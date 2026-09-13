import {
  Injectable,
  UnauthorizedException,
  Optional,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionRepository } from '../repositories/session.repository';
import { SessionEntity } from '../entities/session.entity';
import { TokenService } from './token.service';
import { User } from '@/modules/users/entities/user.entity';
import { AuditLogService } from '@/modules/audit-logs/services/audit-log.service';
import { RedisCacheService } from '@/infra/cache/redis-cache.service';
import type { AuthConfig } from '@/config/configuration';
import { TokenPair } from '../types/auth-result.type';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly gracePeriodMs: number;
  private readonly sessionCachePrefix = 'auth:session:';

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    @Optional() private readonly auditLogService?: AuditLogService,
    @Optional() private readonly redisCacheService?: RedisCacheService,
  ) {
    const authConfig = this.configService.get<AuthConfig>('auth');
    const graceSeconds = authConfig?.refreshGracePeriodSeconds ?? 15;
    this.gracePeriodMs = graceSeconds * 1000;
  }

  // Tạo phiên đăng nhập mới và sinh cặp token
  async create(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ session: SessionEntity; tokens: TokenPair }> {
    const { rawToken, tokenHash } = this.tokenService.generateRefresh();
    const expiresAt = new Date(Date.now() + this.tokenService.refreshTtlMs());

    const session = await this.sessionRepository.create({
      user,
      refreshTokenHash: tokenHash,
      expiresAt,
      isRevoked: false,
      ipAddress,
      userAgent,
    });

    const accessToken = this.tokenService.signAccess(user.id, session.id);
    const expiresIn = this.tokenService.accessTtlSeconds();

    return {
      session,
      tokens: {
        accessToken,
        refreshToken: rawToken,
        expiresIn,
        tokenType: 'Bearer',
      },
    };
  }

  // Xác thực phiên còn hợp lệ và chưa bị thu hồi
  async validate(sessionId: string): Promise<SessionEntity | null> {
    const cacheKey = `${this.sessionCachePrefix}${sessionId}`;
    if (this.redisCacheService) {
      const cached = await this.redisCacheService.get<SessionEntity>(cacheKey);
      if (cached) {
        if (cached.isRevoked || new Date(cached.expiresAt) <= new Date()) {
          return null;
        }
        return cached;
      }
    }

    const session = await this.sessionRepository.getById(sessionId, {
      population: [{ path: 'user' }],
    });

    if (!session || session.isRevoked || session.expiresAt <= new Date()) {
      return null;
    }

    if (this.redisCacheService && session.user) {
      const sessionCachePayload: any = {
        id: session.id,
        isRevoked: session.isRevoked,
        expiresAt: session.expiresAt,
        user: {
          id: session.user.id,
          email: session.user.email,
          roles: session.user.roles ?? [session.user.role],
          isActive: session.user.isActive,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          avatar: session.user.avatar,
        },
      };
      const ttlSeconds = Math.min(
        Math.max(
          1,
          Math.floor(
            (new Date(session.expiresAt).getTime() - Date.now()) / 1000,
          ),
        ),
        300,
      );
      void this.redisCacheService.set(
        cacheKey,
        sessionCachePayload,
        ttlSeconds,
      );
    }

    return session;
  }

  // Xoay vòng refresh token, phát hiện và ngăn chặn replay attack
  async rotate(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('error-invalid-refresh-token');
    }

    const tokenHash = this.tokenService.hashToken(rawRefreshToken);

    // Kiểm tra token khớp với mã đang hoạt động
    let session = await this.sessionRepository.getOne(
      { refreshTokenHash: tokenHash },
      { population: [{ path: 'user' }] },
    );

    if (session) {
      if (session.isRevoked) {
        throw new UnauthorizedException('error-token-revoked');
      }
      if (session.expiresAt <= new Date()) {
        throw new UnauthorizedException('error-token-expired');
      }
      if (!session.user.isActive) {
        throw new UnauthorizedException('error-user-disabled');
      }

      const newRefreshToken = this.tokenService.generateRefresh();
      const newExpiresAt = new Date(
        Date.now() + this.tokenService.refreshTtlMs(),
      );

      await this.sessionRepository.updateById(session.id, {
        previousRefreshTokenHash: session.refreshTokenHash,
        refreshTokenHash: newRefreshToken.tokenHash,
        rotatedAt: new Date(),
        expiresAt: newExpiresAt,
        ipAddress: ipAddress ?? session.ipAddress,
        userAgent: userAgent ?? session.userAgent,
      });

      if (this.redisCacheService) {
        void this.redisCacheService.del(
          `${this.sessionCachePrefix}${session.id}`,
        );
      }

      const newAccessToken = this.tokenService.signAccess(
        session.user.id,
        session.id,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken.rawToken,
        expiresIn: this.tokenService.accessTtlSeconds(),
        tokenType: 'Bearer',
      };
    }

    // Kiểm tra token trước đó xem có trong thời gian ân hạn không
    session = await this.sessionRepository.getOne(
      { previousRefreshTokenHash: tokenHash },
      { population: [{ path: 'user' }] },
    );

    if (session) {
      const now = Date.now();
      const rotatedAtMs = session.rotatedAt
        ? new Date(session.rotatedAt).getTime()
        : 0;

      // Trong thời gian ân hạn: cấp lại access token mà không hủy phiên
      if (now - rotatedAtMs <= this.gracePeriodMs && !session.isRevoked) {
        return {
          accessToken: this.tokenService.signAccess(
            session.user.id,
            session.id,
          ),
          refreshToken: rawRefreshToken,
          expiresIn: this.tokenService.accessTtlSeconds(),
          tokenType: 'Bearer',
        };
      }

      // Quá thời gian ân hạn: nghi vấn đánh cắp token, hủy phiên ngay
      this.logger.warn(
        `Phát hiện replay refresh token tại session ${session.id}, tiến hành thu hồi`,
      );
      await this.sessionRepository.updateById(session.id, {
        isRevoked: true,
        revokedAt: new Date(),
      });

      if (this.redisCacheService) {
        void this.redisCacheService.del(
          `${this.sessionCachePrefix}${session.id}`,
        );
      }

      if (this.auditLogService) {
        void this.auditLogService
          .log({
            action: 'REFRESH_REUSE_DETECTED',
            entityType: 'Session',
            entityId: session.id,
            userId: session.user.id,
            userEmail: session.user.email,
            ipAddress,
            userAgent,
            description:
              'Phát hiện dùng lại refresh token cũ, đã thu hồi phiên',
          })
          .catch((err) => this.logger.error(`Lỗi ghi audit: ${err.message}`));
      }

      throw new UnauthorizedException('error-token-theft-detected');
    }

    throw new UnauthorizedException('error-invalid-refresh-token');
  }

  // Thu hồi một phiên làm việc
  async revoke(sessionId: string): Promise<boolean> {
    const updated = await this.sessionRepository.updateById(sessionId, {
      isRevoked: true,
      revokedAt: new Date(),
    });

    if (this.redisCacheService) {
      void this.redisCacheService.del(`${this.sessionCachePrefix}${sessionId}`);
    }

    return !!updated;
  }

  // Thu hồi tất cả phiên của người dùng (ngoại trừ phiên hiện tại nếu truyền vào)
  async revokeAll(userId: string, exceptSessionId?: string): Promise<number> {
    const condition: Record<string, any> = {
      user: userId,
      isRevoked: false,
    };
    if (exceptSessionId) {
      condition.id = { $ne: exceptSessionId };
    }

    const result = await this.sessionRepository.updateMany(condition, {
      isRevoked: true,
      revokedAt: new Date(),
    });

    if (this.redisCacheService) {
      void this.redisCacheService.delByPattern(`${this.sessionCachePrefix}*`);
    }

    return result.affected;
  }
}

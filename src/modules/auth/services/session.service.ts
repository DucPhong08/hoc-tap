import { Injectable, UnauthorizedException, Optional } from '@nestjs/common';
import { SessionRepository } from '../repositories/session.repository';
import { SessionEntity } from '../entities/session.entity';
import { TokenService } from './token.service';
import { User } from '@/modules/users/entities/user.entity';
import { RedisCacheService } from '@/infra/cache/redis-cache.service';
import { TokenPair } from '../types/auth-result.type';

interface SessionCacheEntry {
  id: string;
  isRevoked: boolean;
  expiresAt: Date | string;
  user: {
    id: string;
    email: string;
    roles: string[];
    isActive: boolean;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

@Injectable()
export class SessionService {
  private readonly sessionCachePrefix = 'auth:session:';

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService,
    @Optional() private readonly redisCacheService?: RedisCacheService,
  ) {}

  /**
   * Tạo phiên đăng nhập mới và sinh cặp token
   */
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

  /**
   * Xác thực phiên còn hợp lệ (ưu tiên đọc từ Redis cache)
   */
  async validate(sessionId: string): Promise<SessionEntity | null> {
    const cacheKey = `${this.sessionCachePrefix}${sessionId}`;
    if (this.redisCacheService) {
      const cached =
        await this.redisCacheService.get<SessionCacheEntry>(cacheKey);
      if (cached) {
        if (cached.isRevoked || new Date(cached.expiresAt) <= new Date()) {
          return null;
        }
        return cached as unknown as SessionEntity;
      }
    }

    const session = await this.sessionRepository.getById(sessionId, {
      population: [{ path: 'user' }],
    });

    if (!session || session.isRevoked || session.expiresAt <= new Date()) {
      return null;
    }

    if (this.redisCacheService && session.user) {
      const sessionCachePayload: SessionCacheEntry = {
        id: session.id,
        isRevoked: session.isRevoked,
        expiresAt: session.expiresAt,
        user: {
          id: session.user.id,
          email: session.user.email,
          roles: session.user.roles,
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

  /**
   * Xoay vòng refresh token đơn giản, an toàn
   */
  async rotate(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('error-invalid-refresh-token');
    }

    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const session = await this.sessionRepository.getOne(
      { refreshTokenHash: tokenHash },
      { population: [{ path: 'user' }] },
    );

    if (!session || session.isRevoked) {
      throw new UnauthorizedException('error-invalid-refresh-token');
    }
    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('error-token-expired');
    }
    if (!session.user?.isActive) {
      throw new UnauthorizedException('error-user-disabled');
    }

    const newRefreshToken = this.tokenService.generateRefresh();
    const newExpiresAt = new Date(
      Date.now() + this.tokenService.refreshTtlMs(),
    );

    await this.sessionRepository.updateById(session.id, {
      refreshTokenHash: newRefreshToken.tokenHash,
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

  /**
   * Thu hồi một phiên làm việc
   */
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

  /**
   * Thu hồi tất cả phiên của người dùng (ngoại trừ phiên hiện tại nếu truyền vào)
   */
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

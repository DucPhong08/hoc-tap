import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Entity } from '@/common/enums/entity.enum';
import { InjectRepository } from '@/infra/repositories/common/repository';
import type { ISessionRepository } from '../repositories/session-repository.interface';
import { SessionEntity } from '../entities/session.entity';
import { TokenService } from './token.service';
import { User } from '@/modules/users/entities/user.entity';
import { TokenPair } from '../types/auth-result.type';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Entity.SESSION)
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenService: TokenService,
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
   * Đọc trạng thái hiện tại để thu hồi phiên và khóa tài khoản có hiệu lực ngay.
   */
  async validate(sessionId: string): Promise<SessionEntity | null> {
    const session = await this.sessionRepository.getById(sessionId, {
      population: [{ path: 'user' }],
    });

    if (
      !session ||
      session.isRevoked ||
      session.expiresAt <= new Date() ||
      !session.user?.isActive ||
      session.user.deletedAt
    ) {
      return null;
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
    if (!session.user?.isActive || session.user.deletedAt) {
      throw new UnauthorizedException('error-user-disabled');
    }

    const newRefreshToken = this.tokenService.generateRefresh();
    const newExpiresAt = new Date(
      Date.now() + this.tokenService.refreshTtlMs(),
    );

    const { affected } = await this.sessionRepository.updateMany(
      {
        id: session.id,
        refreshTokenHash: tokenHash,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      },
      {
        refreshTokenHash: newRefreshToken.tokenHash,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
        ipAddress: ipAddress ?? session.ipAddress,
        userAgent: userAgent ?? session.userAgent,
      },
    );

    if (affected !== 1) {
      throw new UnauthorizedException('error-invalid-refresh-token');
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

    return result.affected;
  }
}

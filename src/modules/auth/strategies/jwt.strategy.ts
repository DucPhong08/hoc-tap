import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { SessionService } from '../services/session.service';
import type { AuthConfig } from '@/config/configuration';
import { User } from '@/modules/users/entities/user.entity';
import { JwtPayload } from '../types/jwt-payload.type';

export type { JwtPayload };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly sessionService: SessionService,
  ) {
    const authConfig = configService.get<AuthConfig>('auth');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig?.jwtSecret ?? 'default-secret',
      issuer: authConfig?.jwtIssuer ?? 'hoc-tap-auth',
      audience: authConfig?.jwtAudience ?? 'hoc-tap-client',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    if (!payload || payload.type !== 'access') {
      throw new UnauthorizedException('error-invalid-token-type');
    }

    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('error-invalid-token-payload');
    }

    // Kiểm tra tính hợp lệ của session
    const session = await this.sessionService.validate(payload.sessionId);
    if (!session) {
      throw new UnauthorizedException('error-session-revoked');
    }

    // Ưu tiên dùng user đã được nạp sẵn từ session để giảm bớt 1 query vào DB mỗi request
    const user =
      session.user ?? (await this.userRepository.getById(payload.sub));

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('error-user-not-found');
    }

    if (user.id !== payload.sub) {
      throw new UnauthorizedException('error-invalid-token-payload');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('error-user-disabled');
    }

    user.sessionId = session.id;
    return user;
  }
}

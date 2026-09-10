import { Injectable } from '@nestjs/common';
import { ApiError } from '@/common/exceptions/api-error';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import type { AuthConfig } from '@/config/configuration';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {
    const authConfig = configService.get<AuthConfig>('auth');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig?.jwtSecret ?? 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.getById(payload.sub, {
      population: [{ path: 'role' }],
    });

    if (!user) {
      throw ApiError.Unauthorized('error-user-not-found');
    }

    if (!user.isActive) {
      throw ApiError.Unauthorized('error-user-disabled');
    }

    return user;
  }
}

import { Injectable } from '@nestjs/common';
import { ApiError } from '@/common/exceptions/api-error';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '@/modules/users/services/user.service';
import { User } from '@/modules/users/entities/user.entity';
import type { AuthConfig } from '@/config/configuration.types';
import { JwtPayload } from '../strategies/jwt.strategy';
import {
  AuthUserProfile,
  LoginResponse,
  OAuthProfile,
} from '../interfaces/oauth-profile.interface';
import { AuthProvider } from '../enums/auth-provider.enum';
import { SystemRole } from '@/modules/roles/enums/system-role.enum';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<LoginResponse> {
    const authConfig = this.configService.get<AuthConfig>('auth');
    const hashedPassword = await bcrypt.hash(
      password,
      authConfig?.bcryptRounds ?? 10,
    );

    const user = await this.userService.create(null, {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
      provider: AuthProvider.LOCAL,
    });

    return this.generateTokens(user);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const [user] = await this.userService.getMany(
      null,
      { email },
      { population: [{ path: 'role' }] },
    );

    if (!user?.password || user.provider !== AuthProvider.LOCAL) {
      throw ApiError.Unauthorized('error-invalid-credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.Unauthorized('error-invalid-credentials');
    }

    if (!user.isActive) {
      throw ApiError.Unauthorized('error-user-disabled');
    }

    return this.generateTokens(user);
  }

  async validateOAuthUser(profile: OAuthProfile): Promise<User> {
    const [existingUser] = await this.userService.getMany(null, {
      email: profile.email,
    });

    if (existingUser) {
      return this.userService.updateById(null, existingUser.id, {
        provider: profile.provider,
        avatar: profile.avatar,
      });
    }

    return this.userService.create(null, {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      provider: profile.provider,
      avatar: profile.avatar,
      isActive: true,
    });
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const authConfig = this.configService.get<AuthConfig>('auth');
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: authConfig?.jwtRefreshSecret,
      });

      const user = await this.userService.getByIdOrNull(null, payload.sub, {
        population: [{ path: 'role' }],
      });

      if (!user) {
        throw ApiError.Unauthorized('error-user-not-found');
      }

      return this.generateTokens(user);
    } catch (e) {
      if (e.message === 'error-user-not-found') {
        throw e;
      }
      throw ApiError.Unauthorized('error-invalid-refresh-token');
    }
  }

  async getUser(userId: string): Promise<AuthUserProfile> {
    const user = await this.userService.getByIdOrNull(null, userId, {
      population: [{ path: 'role' }],
    });

    if (!user) {
      throw ApiError.Unauthorized('error-user-not-found');
    }

    return this.toAuthUserProfile(user);
  }

  generateTokens(user: User): LoginResponse {
    const authConfig = this.configService.get<AuthConfig>('auth');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles ?? [SystemRole.USER],
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: authConfig?.jwtRefreshSecret ?? 'default-refresh-secret',
      expiresIn: (authConfig?.jwtRefreshExpiresIn ?? '7d') as StringValue,
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUserProfile(user),
    };
  }

  private toAuthUserProfile(user: User): AuthUserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles ?? [SystemRole.USER],
      provider: user.provider ?? AuthProvider.LOCAL,
      avatar: user.avatar,
      isActive: user.isActive,
    };
  }
}

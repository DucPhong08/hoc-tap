import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../users/services/user.service';
import { UserEntity } from '../../users/entities/user.entity';
import type { AuthConfig } from '../../../config/configuration.types';
import { JwtPayload } from '../strategies/jwt.strategy';
import {
  AuthUserProfile,
  LoginResponse,
  OAuthProfile,
} from '../interfaces/oauth-profile.interface';
import { AuthProvider } from '../enums/auth-provider.enum';

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
      authConfig?.bcryptRounds || 10,
    );

    const user = await this.userService.create({
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
    const user = await this.userService.findByEmail(email);

    if (!user || user.provider !== AuthProvider.LOCAL) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    if (!user.password) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    return this.generateTokens(user);
  }

  async validateOAuthUser(profile: OAuthProfile): Promise<UserEntity> {
    let user = await this.userService.findByProviderAccount(
      profile.provider,
      profile.providerId,
    );

    if (!user) {
      user = await this.userService.findByEmail(profile.email);

      if (user) {
        user = await this.userService.updateById(user.id, {
          provider: profile.provider,
          providerId: profile.providerId,
          avatar: profile.avatar,
        });
      } else {
        user = await this.userService.create({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          provider: profile.provider,
          providerId: profile.providerId,
          avatar: profile.avatar,
          isActive: true,
        });
      }
    }

    return user;
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const authConfig = this.configService.get<AuthConfig>('auth');
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: authConfig?.jwtRefreshSecret,
      });

      const user = await this.userService.getByIdOrNull(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Không tìm thấy người dùng');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  async getCurrentUser(userId: string): Promise<AuthUserProfile> {
    const user = await this.userService.getByIdOrNull(userId);

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    return this.toAuthUserProfile(user);
  }

  generateTokens(user: UserEntity): LoginResponse {
    const authConfig = this.configService.get<AuthConfig>('auth');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || ['user'],
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: authConfig?.jwtRefreshSecret || 'default-refresh-secret',
      expiresIn: (authConfig?.jwtRefreshExpiresIn || '7d') as any,
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUserProfile(user),
    };
  }

  private toAuthUserProfile(user: UserEntity): AuthUserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles || ['user'],
      provider: user.provider || AuthProvider.LOCAL,
      avatar: user.avatar,
      isActive: user.isActive,
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../users/services/user.service';
import { UserEntity } from '../../users/entities/user.entity';
import { AuthConfig } from '../../../config/root/auth.config';
import { JwtPayload } from '../strategies/jwt.strategy';
import { OAuthProfile } from '../interfaces/oauth-profile.interface';
import { AuthProvider } from '../enums/auth-provider.enum';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    provider: AuthProvider;
  };
}

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
    let user = await this.userService.getOneOrNull(null, {
      provider: profile.provider,
      providerId: profile.providerId,
    });

    if (!user) {
      user = await this.userService.getOneOrNull(null, {
        email: profile.email,
      });

      if (user) {
        user = await this.userService.updateById(null, user._id.toString(), {
          provider: profile.provider,
          providerId: profile.providerId,
          avatar: profile.avatar,
        });
      } else {
        user = await this.userService.create(null, {
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

      const user = await this.userService.getByIdOrNull(null, payload.sub);

      if (!user) {
        throw new UnauthorizedException('Không tìm thấy người dùng');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  generateTokens(user: any): LoginResponse {
    const authConfig = this.configService.get<AuthConfig>('auth');

    const payload: JwtPayload = {
      sub: user._id,
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
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider || AuthProvider.LOCAL,
      },
    };
  }
}

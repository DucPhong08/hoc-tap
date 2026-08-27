import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { UsersModule } from '../users/users.module';
import type { AuthConfig } from '@/config/configuration.types';
import type { StringValue } from 'ms';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const authConfig = config.get<AuthConfig>('auth');
        return {
          secret: authConfig?.jwtSecret ?? 'default-secret',
          signOptions: {
            expiresIn: (authConfig?.jwtExpiresIn ?? '1h') as StringValue,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'GOOGLE_STRATEGY',
      useFactory: (config: ConfigService, authService: AuthService) => {
        const clientId = config.get<string>('GOOGLE_CLIENT_ID');
        return clientId ? new GoogleStrategy(config, authService) : null;
      },
      inject: [ConfigService, AuthService],
    },
    {
      provide: 'FACEBOOK_STRATEGY',
      useFactory: (config: ConfigService, authService: AuthService) => {
        const appId = config.get<string>('FACEBOOK_APP_ID');
        return appId ? new FacebookStrategy(config, authService) : null;
      },
      inject: [ConfigService, AuthService],
    },
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}

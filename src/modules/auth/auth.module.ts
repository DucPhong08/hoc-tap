import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { UsersModule } from '../users/users.module';
import type { AuthConfig } from '@/config/configuration';
import type { StringValue } from 'ms';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { SessionRepository } from './repositories/session.repository';

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
            expiresIn: (authConfig?.jwtExpiresIn ?? '15m') as StringValue,
            issuer: authConfig?.jwtIssuer ?? 'hoc-tap-auth',
            audience: authConfig?.jwtAudience ?? 'hoc-tap-client',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    SessionRepository,
    JwtStrategy,
    {
      provide: 'GOOGLE_STRATEGY',
      useFactory: (config: ConfigService, authService: AuthService) => {
        const clientId = config.get<string>('oauth.google.clientId');
        return clientId ? new GoogleStrategy(config, authService) : null;
      },
      inject: [ConfigService, AuthService],
    },
    {
      provide: 'FACEBOOK_STRATEGY',
      useFactory: (config: ConfigService, authService: AuthService) => {
        const appId = config.get<string>('oauth.facebook.appId');
        return appId ? new FacebookStrategy(config, authService) : null;
      },
      inject: [ConfigService, AuthService],
    },
  ],
  exports: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    SessionRepository,
    JwtStrategy,
    PassportModule,
  ],
})
export class AuthModule {}

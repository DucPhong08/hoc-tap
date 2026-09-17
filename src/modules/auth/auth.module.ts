import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Entity } from '@/common/enums/entity.enum';
import { RepositoryProvider } from '@/infra/repositories/common/repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { UsersModule } from '../users/users.module';
import { UserRepository } from '../users/repositories/user.repository';
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
    RepositoryProvider(Entity.SESSION, SessionRepository),
    RepositoryProvider(Entity.USER, UserRepository),
    JwtStrategy,
    {
      provide: 'GOOGLE_STRATEGY',
      useFactory: (config: ConfigService) => {
        const clientId = config.get<string>('oauth.google.clientId');
        return clientId ? new GoogleStrategy(config) : null;
      },
      inject: [ConfigService],
    },
    {
      provide: 'FACEBOOK_STRATEGY',
      useFactory: (config: ConfigService) => {
        const clientId = config.get<string>('oauth.facebook.clientId');
        return clientId ? new FacebookStrategy(config) : null;
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    JwtStrategy,
    PassportModule,
  ],
})
export class AuthModule {}

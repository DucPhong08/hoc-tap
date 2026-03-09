import { Module, DynamicModule, type Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { UsersModule } from '../users/users.module';
import { AuthConfig } from '../../config/root/auth.config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';

@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    const providers: Provider[] = [AuthService, JwtStrategy];

    return {
      module: AuthModule,
      imports: [
        UsersModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const authConfig = config.get<AuthConfig>('auth');
            return {
              secret: authConfig?.jwtSecret || 'default-secret',
              signOptions: {
                expiresIn: (authConfig?.jwtExpiresIn || '1h') as StringValue,
              },
            };
          },
        }),
      ],
      controllers: [AuthController],
      providers: [
        ...providers,
        {
          provide: 'GOOGLE_STRATEGY',
          useFactory: (config: ConfigService, authService: AuthService) => {
            const clientId = config.get<string>('oauth.google.clientId');
            if (clientId) {
              return new GoogleStrategy(config, authService);
            }
            return null;
          },
          inject: [ConfigService, AuthService],
        },
        {
          provide: 'FACEBOOK_STRATEGY',
          useFactory: (config: ConfigService, authService: AuthService) => {
            const appId = config.get<string>('oauth.facebook.appId');
            if (appId) {
              return new FacebookStrategy(config, authService);
            }
            return null;
          },
          inject: [ConfigService, AuthService],
        },
      ],
      exports: [AuthService, JwtStrategy, PassportModule],
    };
  }
}

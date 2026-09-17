import type { CacheConfig } from '@/infra/cache/cache.interface';
import { mode, num, required, secret, str } from './env';

export interface AppConfig {
  mode: 'development' | 'production' | 'test';
  host: string;
  port: number;
  timeout?: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  jwtIssuer: string;
  jwtAudience: string;
  bcryptRounds: number;
  refreshGracePeriodSeconds: number;
}

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface OAuthConfig {
  google: OAuthProviderConfig;
  facebook: OAuthProviderConfig;
}

export interface AppConfiguration {
  app: AppConfig;
  auth: AuthConfig;
  cache: CacheConfig;
  oauth: OAuthConfig;
}

const oauthProvider = (prefix: string): OAuthProviderConfig => ({
  clientId: str(`${prefix}_CLIENT_ID`) ?? '',
  clientSecret: str(`${prefix}_CLIENT_SECRET`) ?? '',
  callbackUrl: str(`${prefix}_CALLBACK_URL`) ?? '',
});

export default (): AppConfiguration => ({
  app: {
    mode: mode(),
    host: str('HOST') ?? '0.0.0.0',
    port: num('PORT') ?? 3000,
    timeout: num('REQUEST_TIMEOUT_MS') ?? 15000,
  },
  auth: {
    jwtSecret: secret('JWT_SECRET', 'dev-access-secret'),
    jwtExpiresIn: str('JWT_EXPIRES_IN') ?? '15m',
    jwtRefreshSecret: secret('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    jwtRefreshExpiresIn: str('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    jwtIssuer: str('JWT_ISSUER') ?? 'app-auth',
    jwtAudience: str('JWT_AUDIENCE') ?? 'app-client',
    bcryptRounds: num('BCRYPT_ROUNDS') ?? 10,
    refreshGracePeriodSeconds: num('REFRESH_GRACE_PERIOD_SECONDS') ?? 15,
  },
  cache: {
    ttl: num('CACHE_TTL') ?? 300,
    prefix: str('CACHE_PREFIX') ?? 'app',
    redis: str('REDIS_HOST')
      ? {
          host: required('REDIS_HOST'),
          port: num('REDIS_PORT') ?? 6379,
          password: str('REDIS_PASSWORD'),
          db: num('REDIS_DB') ?? 0,
        }
      : undefined,
  },
  oauth: {
    google: oauthProvider('GOOGLE'),
    facebook: oauthProvider('FACEBOOK'),
  },
});

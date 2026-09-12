import type { CacheConfig } from '@/infra/cache/cache.interface';

export interface HostConfig {
  host: string;
  port: number;
}

export interface AppConfig {
  mode: 'development' | 'production' | 'test';
  host: string;
  port: number;
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

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface FacebookOAuthConfig {
  appId: string;
  appSecret: string;
  callbackUrl: string;
}

export interface OAuthConfig {
  google: GoogleOAuthConfig;
  facebook: FacebookOAuthConfig;
}

export interface AppConfiguration {
  mode: string;
  app: AppConfig;
  host: HostConfig;
  auth: AuthConfig;
  cache: CacheConfig;
  oauth: OAuthConfig;
}

export default (): AppConfiguration => {
  const mode =
    process.env.NODE_ENV === 'production' || process.env.MODE === 'production'
      ? 'production'
      : (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
        'development';

  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT) || 3000;

  return {
    mode,
    app: {
      mode,
      host,
      port,
    },
    host: {
      host,
      port,
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      jwtIssuer: process.env.JWT_ISSUER || 'hoc-tap-auth',
      jwtAudience: process.env.JWT_AUDIENCE || 'hoc-tap-client',
      bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
      refreshGracePeriodSeconds:
        Number(process.env.REFRESH_GRACE_PERIOD_SECONDS) || 15,
    },
    cache: {
      ttl: Number(process.env.CACHE_TTL) || 300,
      prefix: process.env.CACHE_PREFIX || 'app',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: Number(process.env.REDIS_DB) || 0,
      },
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
      },
      facebook: {
        appId: process.env.FACEBOOK_APP_ID || '',
        appSecret: process.env.FACEBOOK_APP_SECRET || '',
        callbackUrl: process.env.FACEBOOK_CALLBACK_URL || '',
      },
    },
  };
};

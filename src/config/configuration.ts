export interface HostConfig {
  host: string;
  port: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  bcryptRounds: number;
}

export default () => ({
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  host: {
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
  } as HostConfig,
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  } as AuthConfig,
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
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || '',
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL || '',
});

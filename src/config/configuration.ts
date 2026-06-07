import {
  readBooleanValue,
  readNumberValue,
  readStringValue,
} from './configuration.helpers';
import { ApplicationConfiguration } from './configuration.types';

export default function configuration(): ApplicationConfiguration {
  const environment = process.env;
  const resolvedMode =
    readStringValue(environment.MODE) ??
    readStringValue(environment.NODE_ENV, 'development');
  const mode: ApplicationConfiguration['mode'] =
    resolvedMode === 'production' || resolvedMode === 'test'
      ? resolvedMode
      : 'development';

  const config = {
    mode,
    host: {
      host: readStringValue(environment.HOST, '0.0.0.0'),
      port: readNumberValue(environment.PORT, 3000),
    },
    cors: {
      allowedOrigins: readStringValue(
        environment.CORS_ALLOWED_ORIGINS,
        'http://localhost:3000,http://localhost:3001',
      )
        .split(',')
        .map((origin) => origin.trim()),
    },
    auth: {
      jwtSecret: readStringValue(environment.JWT_SECRET, 'your-secret-key'),
      jwtExpiresIn: readStringValue(environment.JWT_EXPIRES_IN, '1d'),
      jwtRefreshSecret: readStringValue(
        environment.JWT_REFRESH_SECRET,
        'your-refresh-secret',
      ),
      jwtRefreshExpiresIn: readStringValue(
        environment.JWT_REFRESH_EXPIRES_IN,
        '7d',
      ),
      bcryptRounds: readNumberValue(environment.BCRYPT_ROUNDS, 10),
    },
    cache: {
      enabled: readBooleanValue(environment.CACHE_ENABLED, false),
      ttl: readNumberValue(environment.CACHE_TTL, 300),
      prefix: readStringValue(environment.CACHE_PREFIX, 'app'),
      redis: {
        host: readStringValue(environment.REDIS_HOST, 'localhost'),
        port: readNumberValue(environment.REDIS_PORT, 6379),
        password: readStringValue(environment.REDIS_PASSWORD),
        db: readNumberValue(environment.REDIS_DB, 0),
      },
    },
    GOOGLE_CLIENT_ID: readStringValue(environment.GOOGLE_CLIENT_ID, ''),
    GOOGLE_CLIENT_SECRET: readStringValue(environment.GOOGLE_CLIENT_SECRET, ''),
    GOOGLE_CALLBACK_URL: readStringValue(environment.GOOGLE_CALLBACK_URL, ''),
    FACEBOOK_APP_ID: readStringValue(environment.FACEBOOK_APP_ID, ''),
    FACEBOOK_APP_SECRET: readStringValue(environment.FACEBOOK_APP_SECRET, ''),
    FACEBOOK_CALLBACK_URL: readStringValue(
      environment.FACEBOOK_CALLBACK_URL,
      '',
    ),
  };

  return config;
}

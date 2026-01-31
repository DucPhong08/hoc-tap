import { registerAs } from '@nestjs/config';

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  prefix: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}

export default registerAs(
  'cache',
  (): CacheConfig => ({
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
    prefix: process.env.CACHE_PREFIX || 'app',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
  }),
);

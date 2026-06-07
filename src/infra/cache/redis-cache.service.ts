import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheStrategy, CacheConfig } from './cache.interface';
import type { RedisClientType } from './cache.constant';

@Injectable()
export class RedisCacheService
  implements CacheStrategy, OnModuleInit, OnModuleDestroy
{
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private client: RedisClientType | null = null;
  private readonly logger = new Logger(RedisCacheService.name);
  private config: CacheConfig;
  private tagPrefix = 'tag:';
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<CacheConfig>('cache') || {
      enabled: false,
      ttl: 300,
      prefix: 'app',
    };
  }

  async onModuleInit() {
    if (this.config.enabled) {
      await this.initRedis();
    }
  }

  private async initRedis() {
    try {
      // Dynamically import redis only if cache is enabled
      const redis = await import('redis');
      const redisConfig = this.config?.redis;

      if (!redisConfig) {
        this.logger.warn('Redis config not found, cache disabled');
        return;
      }

      this.client = redis.createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
        },
        password: redisConfig.password,
        database: redisConfig.db || 0,
      });

      this.client.on('error', (err: Error) =>
        this.logger.error('Redis error', err.stack),
      );
      this.client.on('connect', () => {
        this.logger.log('Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error(
        'Failed to initialize Redis',
        error instanceof Error ? error.stack : error,
      );
      this.logger.warn('Cache will be disabled');
      this.config.enabled = false;
    }
  }

  private getKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled || !this.client || !this.isConnected) return null;

    try {
      const data = await this.client.get(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(
        'Cache get error',
        error instanceof Error ? error.stack : error,
      );
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.config.enabled || !this.client || !this.isConnected) return;

    try {
      const cacheKey = this.getKey(key);
      const expiry = ttl || this.config.ttl;

      await this.client.setEx(cacheKey, expiry, JSON.stringify(value));
    } catch (error) {
      this.logger.error(
        'Cache set error',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    ttl?: number,
  ): Promise<void> {
    await this.set(key, value, ttl);

    if (!this.client || !this.isConnected) return;

    try {
      // Store key in tag sets
      for (const tag of tags) {
        await this.client.sAdd(
          this.getKey(`${this.tagPrefix}${tag}`),
          this.getKey(key),
        );
      }
    } catch (error) {
      this.logger.error(
        'Cache setWithTags error',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.del(this.getKey(key));
    } catch (error) {
      this.logger.error(
        'Cache del error',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      const keys = await this.client.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      this.logger.error(
        'Cache delByPattern error',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async delByTags(tags: string[]): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      for (const tag of tags) {
        const tagKey = this.getKey(`${this.tagPrefix}${tag}`);
        const keys = await this.client.sMembers(tagKey);

        if (keys.length > 0) {
          await this.client.del(keys);
        }
        await this.client.del(tagKey);
      }
    } catch (error) {
      this.logger.error(
        'Cache delByTags error',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async clear(): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.flushDb();
    } catch (error) {
      this.logger.error(
        'Cache clear error',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      return (await this.client.exists(this.getKey(key))) > 0;
    } catch (error) {
      this.logger.error(
        'Cache has error',
        error instanceof Error ? error.stack : error,
      );
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.logger.log('Redis disconnected');
      } catch (error) {
        this.logger.error(
          'Error disconnecting Redis',
          error instanceof Error ? error.stack : error,
        );
      }
    }
  }
}

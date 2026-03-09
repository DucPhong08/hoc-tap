import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from 'redis';
import { CacheStrategy, CacheConfig } from './cache.interface';

@Injectable()
export class RedisCacheService
  implements CacheStrategy, OnModuleInit, OnModuleDestroy
{
  private client: RedisClientType | null = null;
  private readonly config: CacheConfig;
  private readonly tagPrefix = 'tag:';
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<CacheConfig>('cache') || {
      enabled: false,
      ttl: 300,
      prefix: 'app',
    };
  }

  async onModuleInit(): Promise<void> {
    if (this.config.enabled) {
      await this.initRedis();
    }
  }

  private async initRedis(): Promise<void> {
    try {
      // Dynamically import redis only if cache is enabled
      const { createClient } = await import('redis');
      const redisConfig = this.config?.redis;

      if (!redisConfig) {
        console.warn('Redis config not found, cache disabled');
        return;
      }

      this.client = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
        },
        password: redisConfig.password,
        database: redisConfig.db || 0,
      });

      this.client.on('error', (err: unknown) => {
        this.isConnected = false;
        console.error('Redis error:', err);
      });
      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
      });
      this.client.on('end', () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      console.warn('Cache will be disabled');
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
      if (data === null) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.config.enabled || !this.client || !this.isConnected) return;

    try {
      const cacheKey = this.getKey(key);
      const expiry = ttl ?? this.config.ttl;

      await this.client.setEx(cacheKey, expiry, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
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
      console.error('Cache setWithTags error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.del(this.getKey(key));
    } catch (error) {
      console.error('Cache del error:', error);
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
      console.error('Cache delByPattern error:', error);
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
      console.error('Cache delByTags error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      return (await this.client.exists(this.getKey(key))) > 0;
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }
}

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
  private readonly config: CacheConfig;
  private readonly tagPrefix = 'tag:';
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<CacheConfig>('cache') ?? {
      ttl: 300,
      prefix: 'app',
    };
  }

  async onModuleInit() {
    const redisConfig = this.config?.redis;
    if (!redisConfig?.host) return;

    try {
      const { createClient } = await import('redis');
      this.client = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
          reconnectStrategy: false,
        },
        password: redisConfig.password,
        database: redisConfig.db ?? 0,
      });

      this.client.on('error', (err: Error) =>
        this.logger.warn(`Redis: ${err.message}`),
      );
      this.client.on('connect', () => {
        this.logger.log('Redis đã kết nối');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch {
      this.isConnected = false;
      this.client = null;
      this.logger.warn('Redis không khả dụng — cache bị bỏ qua');
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
      } catch {
        /* bỏ qua */
      }
    }
  }

  private key(k: string) {
    return `${this.config.prefix}:${k}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const data = await this.client!.get(this.key(key));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client!.setEx(
        this.key(key),
        ttl ?? this.config.ttl,
        JSON.stringify(value),
      );
    } catch {
      /* bỏ qua */
    }
  }

  async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    ttl?: number,
  ): Promise<void> {
    await this.set(key, value, ttl);
    if (!this.isConnected) return;
    try {
      const effectiveTtl = ttl ?? this.config.ttl;
      for (const tag of tags) {
        const tagKey = this.key(`${this.tagPrefix}${tag}`);
        await this.client!.sAdd(tagKey, this.key(key));
        if (effectiveTtl) {
          await this.client!.expire(tagKey, effectiveTtl * 2);
        }
      }
    } catch {
      /* bỏ qua */
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client!.del(this.key(key));
    } catch {
      /* bỏ qua */
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const keys: string[] = [];
      for await (const key of this.client!.scanIterator({
        MATCH: this.key(pattern),
        COUNT: 100,
      })) {
        keys.push(key);
      }
      if (keys.length) {
        await this.client!.del(keys);
      }
    } catch {
      /* bỏ qua */
    }
  }

  async delByTags(tags: string[]): Promise<void> {
    if (!this.isConnected) return;
    try {
      for (const tag of tags) {
        const tagKey = this.key(`${this.tagPrefix}${tag}`);
        const keys = await this.client!.sMembers(tagKey);
        if (keys.length) await this.client!.del(keys);
        await this.client!.del(tagKey);
      }
    } catch {
      /* bỏ qua */
    }
  }

  async clear(): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client!.flushDb();
    } catch {
      /* bỏ qua */
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      return (await this.client!.exists(this.key(key))) > 0;
    } catch {
      return false;
    }
  }
}

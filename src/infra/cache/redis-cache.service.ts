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
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              this.logger.error('Redis kết nối lại thất bại quá 10 lần.');
              return new Error('Redis connection retry limit reached');
            }
            return Math.min(retries * 200, 3000);
          },
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
      this.logger.warn('Không thể kết nối Redis, chuyển sang chạy không cache');
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
    }
  }

  private key(k: string): string {
    return `${this.config.prefix}:${k}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const raw = await this.client.get(this.key(key));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.setEx(
        this.key(key),
        ttl ?? this.config.ttl,
        JSON.stringify(value),
      );
    } catch {
      /* bỏ qua */
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.unlink(this.key(key));
    } catch {
      /* bỏ qua */
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const BATCH_SIZE = 500;
      let batch: string[] = [];
      for await (const key of this.client.scanIterator({
        MATCH: this.key(pattern),
        COUNT: 100,
      })) {
        batch.push(key);
        if (batch.length >= BATCH_SIZE) {
          await this.client.unlink(batch);
          batch = [];
        }
      }
      if (batch.length > 0) {
        await this.client.unlink(batch);
      }
    } catch (err) {
      this.logger.warn(`Lỗi delByPattern: ${(err as Error).message}`);
    }
  }

  async clear(): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.flushDb();
    } catch {
      /* bỏ qua */
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;
    try {
      return (await this.client.exists(this.key(key))) > 0;
    } catch {
      return false;
    }
  }
}

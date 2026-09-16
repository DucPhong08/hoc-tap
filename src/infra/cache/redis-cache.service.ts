import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheStrategy, CacheConfig } from './cache.interface';
import type { RedisClientType } from './cache.constant';

const SCAN_BATCH = 500;

@Injectable()
export class RedisCacheService
  implements CacheStrategy, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly config: CacheConfig;
  private client: RedisClientType | null = null;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.getOrThrow<CacheConfig>('cache');
  }

  /** Client chỉ khi thực sự sẵn sàng nhận lệnh. */
  private get ready(): RedisClientType | null {
    return this.client?.isReady ? this.client : null;
  }

  async onModuleInit() {
    const redis = this.config.redis;
    if (!redis?.host) {
      this.logger.log('Không cấu hình Redis, chạy không cache');
      return;
    }

    try {
      const { createClient } = await import('redis');

      this.client = createClient({
        socket: {
          host: redis.host,
          port: redis.port,
          reconnectStrategy: (retries: number) =>
            retries > 10
              ? new Error('Redis vượt quá 10 lần thử kết nối lại')
              : Math.min(retries * 200, 3000),
        },
        password: redis.password,
        database: redis.db ?? 0,
      }) as RedisClientType;

      this.client.on('error', (err: Error) =>
        this.logger.warn(`Redis: ${err.message}`),
      );
      this.client.on('ready', () => this.logger.log('Redis sẵn sàng'));
      this.client.on('end', () => this.logger.warn('Redis đã ngắt kết nối'));

      await this.client.connect();
    } catch (err) {
      this.logger.warn(
        `Không kết nối được Redis, chạy không cache: ${(err as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    if (!this.client?.isOpen) return;

    try {
      await this.client.quit();
    } catch {
      this.client.destroy();
    }
  }

  private key(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  private async command<T>(
    action: (client: RedisClientType) => Promise<T>,
    fallback: T,
  ): Promise<T> {
    const client = this.ready;
    if (!client) return fallback;

    try {
      return await action(client);
    } catch (err) {
      this.logger.warn(`Redis: ${(err as Error).message}`);
      return fallback;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    return this.command<T | null>(async (client) => {
      const raw = await client.get(this.key(key));
      return raw ? (JSON.parse(raw) as T) : null;
    }, null);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.command(async (client) => {
      await client.setEx(
        this.key(key),
        ttl ?? this.config.ttl,
        JSON.stringify(value),
      );
    }, undefined);
  }

  async del(key: string): Promise<void> {
    await this.command(async (client) => {
      await client.unlink(this.key(key));
    }, undefined);
  }

  async delByPattern(pattern: string): Promise<void> {
    await this.command(async (client) => {
      let batch: string[] = [];

      for await (const found of client.scanIterator({
        MATCH: this.key(pattern),
        COUNT: 100,
      })) {
        batch.push(...(Array.isArray(found) ? found : [found]));

        if (batch.length >= SCAN_BATCH) {
          await client.unlink(batch);
          batch = [];
        }
      }

      if (batch.length) await client.unlink(batch);
    }, undefined);
  }

  /** Chỉ xoá key thuộc prefix của app, không đụng DB chung. */
  async clear(): Promise<void> {
    await this.delByPattern('*');
  }

  async has(key: string): Promise<boolean> {
    return this.command(
      async (client) => (await client.exists(this.key(key))) > 0,
      false,
    );
  }
}

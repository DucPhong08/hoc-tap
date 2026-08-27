import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import { RedisCacheService } from './redis-cache.service';
import {
  CACHE_EVICT_KEY,
  CACHE_KEY,
} from '@/common/decorators/cache.decorator';
import type {
  CacheEvictOptions,
  CacheOptions,
} from '@/common/types/cache.type';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: RedisCacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<CacheOptions>(
      CACHE_KEY,
      context.getHandler(),
    );
    const evictOptions = this.reflector.get<CacheEvictOptions>(
      CACHE_EVICT_KEY,
      context.getHandler(),
    );

    if (!cacheOptions && !evictOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = cacheOptions
      ? this.generateCacheKey(request, cacheOptions)
      : undefined;

    if (cacheOptions && cacheKey) {
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData != null) {
        return of(cachedData);
      }
    }

    return next.handle().pipe(
      tap((data) => {
        void (async () => {
          if (cacheOptions && cacheKey) {
            if (cacheOptions.tags) {
              await this.cacheService.setWithTags(
                cacheKey,
                data,
                cacheOptions.tags,
                cacheOptions.ttl,
              );
            } else {
              await this.cacheService.set(cacheKey, data, cacheOptions.ttl);
            }
          }

          if (evictOptions?.key) {
            await this.cacheService.del(evictOptions.key);
          }

          if (evictOptions?.tags?.length) {
            await this.cacheService.delByTags(evictOptions.tags);
          }
        })();
      }),
    );
  }

  private generateCacheKey(request: any, options: CacheOptions): string {
    if (options.key) {
      return options.key;
    }

    const { url, method, query, params } = request;
    const keyParts = [method, url];

    if (Object.keys(query).length > 0) {
      keyParts.push(JSON.stringify(query));
    }

    if (Object.keys(params).length > 0) {
      keyParts.push(JSON.stringify(params));
    }

    return keyParts.join(':');
  }
}

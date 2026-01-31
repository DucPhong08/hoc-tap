import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import { RedisCacheService } from './redis-cache.service';
import { CACHE_KEY } from './cache.decorator';
import { CacheOptions } from './cache.interface';

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

    if (!cacheOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request, cacheOptions);

    // Try to get from cache
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    // Execute and cache result
    return next.handle().pipe(
      tap((data) => {
        void (async () => {
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

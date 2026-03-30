import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RedisCacheService } from './redis-cache.service';
import { CacheInterceptor } from './cache.interceptor';

@Global()
@Module({
  providers: [
    RedisCacheService,
    CacheInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: CacheInterceptor,
    },
  ],
  exports: [RedisCacheService, CacheInterceptor],
})
export class CacheModule {}

import { Module, Global } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { CacheInterceptor } from './cache.interceptor';

@Global()
@Module({
  providers: [RedisCacheService, CacheInterceptor],
  exports: [RedisCacheService, CacheInterceptor],
})
export class CacheModule {}

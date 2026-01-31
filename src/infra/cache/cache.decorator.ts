import { SetMetadata } from '@nestjs/common';
import { CacheOptions } from './cache.interface';

export const CACHE_KEY = 'cache:options';

export const Cacheable = (options?: CacheOptions) =>
  SetMetadata(CACHE_KEY, options || {});

export const CacheEvict = (options?: { key?: string; tags?: string[] }) =>
  SetMetadata('cache:evict', options || {});

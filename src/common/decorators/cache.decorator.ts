import { SetMetadata } from '@nestjs/common';
import type { CacheEvictOptions, CacheOptions } from '../types/cache.type';

export const CACHE_KEY = 'cache:options';
export const CACHE_EVICT_KEY = 'cache:evict';

export const Cacheable = (options?: CacheOptions) =>
  SetMetadata(CACHE_KEY, options || {});

export const CacheEvict = (options?: CacheEvictOptions) =>
  SetMetadata(CACHE_EVICT_KEY, options || {});

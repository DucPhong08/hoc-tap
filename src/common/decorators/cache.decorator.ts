import { SetMetadata } from '@nestjs/common';

export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
}

export interface CacheEvictOptions {
  key?: string;
  tags?: string[];
}

export const CACHE_KEY = 'cache:options';
export const CACHE_EVICT_KEY = 'cache:evict';

export const Cacheable = (options?: CacheOptions) =>
  SetMetadata(CACHE_KEY, options ?? {});

export const CacheEvict = (options?: CacheEvictOptions) =>
  SetMetadata(CACHE_EVICT_KEY, options ?? {});

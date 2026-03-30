export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
}

export interface CacheEvictOptions {
  key?: string;
  tags?: string[];
}

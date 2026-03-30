export interface CacheStrategy {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
  delByTags(tags: string[]): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  prefix: string;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

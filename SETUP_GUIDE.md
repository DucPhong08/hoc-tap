# 🚀 Setup Guide - Cache & Cluster

## ✅ Đã Cài Đặt Sẵn

1. ✅ CacheModule → `app.module.ts`
2. ✅ LoggingModule → `app.module.ts`
3. ✅ MonitoringModule → `app.module.ts`
4. ✅ Cache config → `.env`
5. ✅ Cluster service → `src/cluster.ts`

---

## 📦 Cài Đặt (Tùy Chọn)

### Nếu KHÔNG muốn dùng Cache:

```env
# .env
CACHE_ENABLED=false
CLUSTER_ENABLED=false
```

→ App chạy bình thường, không cần Redis

### Nếu MUỐN dùng Cache:

```bash
# 1. Cài Redis package
npm install redis

# 2. Start Redis server
docker run -d -p 6379:6379 redis:alpine

# 3. Enable cache
# .env
CACHE_ENABLED=true
```

---

## 🎯 Cách Sử Dụng

### 1. Cache trong Controller

```typescript
import { Controller, Get } from '@nestjs/common';
import { Cacheable } from './common/cache/cache.decorator';

@Controller('products')
export class ProductController {
  @Get()
  @Cacheable({ ttl: 300, tags: ['products'] })
  async findAll() {
    return this.productService.findAll();
  }
}
```

### 2. Cache trong Repository

```typescript
import { Injectable } from '@nestjs/common';
import { CachedBaseRepository } from './common/repositories/cached-base.repository';
import { RedisCacheService } from './common/cache/redis-cache.service';

@Injectable()
export class ProductRepository extends CachedBaseRepository<Product> {
  protected entityName = 'Product';
  protected defaultCacheTtl = 600;

  constructor(
    em: EntityManager,
    @InjectRepository(Product) repository: EntityRepository<Product>,
    cacheService: RedisCacheService,
  ) {
    super(em, repository, cacheService);
  }
}
```

### 3. Manual Cache

```typescript
import { Injectable } from '@nestjs/common';
import { RedisCacheService } from './common/cache/redis-cache.service';

@Injectable()
export class ProductService {
  constructor(private cache: RedisCacheService) {}

  async getProduct(id: string) {
    // Check cache
    const cached = await this.cache.get(`product:${id}`);
    if (cached) return cached;

    // Query DB
    const product = await this.productRepo.findOne(id);

    // Save cache
    await this.cache.set(`product:${id}`, product, 300);

    return product;
  }

  async updateProduct(id: string, data: any) {
    const product = await this.productRepo.update(id, data);

    // Invalidate cache
    await this.cache.del(`product:${id}`);

    return product;
  }
}
```

### 4. Logging

```typescript
import { Injectable } from '@nestjs/common';
import { ClusterLogger } from './common/logging/cluster-logger.service';

@Injectable()
export class ProductService {
  constructor(private logger: ClusterLogger) {}

  async findAll() {
    this.logger.log('Finding all products', 'ProductService');

    try {
      const products = await this.productRepo.findAll();
      return products;
    } catch (error) {
      this.logger.error(
        'Failed to find products',
        error.stack,
        'ProductService',
      );
      throw error;
    }
  }
}
```

---

## 🔥 Chạy Cluster Mode

```bash
# Development (single instance)
npm run start:dev

# Production (cluster mode)
npm run build
CLUSTER_ENABLED=true npm run start:cluster
```

---

## 📊 Monitoring Endpoints

```bash
# Health check
GET http://localhost:3000/monitoring/health

# Worker info
GET http://localhost:3000/monitoring/worker-info

# Recent logs
GET http://localhost:3000/monitoring/logs/recent

# Error logs
GET http://localhost:3000/monitoring/logs/errors

# Cluster logs
GET http://localhost:3000/monitoring/logs/cluster

# Stats
GET http://localhost:3000/monitoring/stats
```

---

## 📁 Logs Location

```
logs/
├── app.log          # All logs
├── error.log        # Errors only
├── cluster.log      # Cluster events
├── debug.log        # Debug logs
└── requests.log     # HTTP requests
```

---

## ⚙️ Configuration

### Cache TTL Strategy

```typescript
// Hot data (frequently accessed)
@Cacheable({ ttl: 300 })  // 5 minutes

// Warm data (moderately accessed)
@Cacheable({ ttl: 1800 }) // 30 minutes

// Cold data (rarely changed)
@Cacheable({ ttl: 86400 }) // 24 hours
```

### Cluster Workers

```env
# Development
CLUSTER_ENABLED=false

# Production (auto detect CPU cores)
CLUSTER_ENABLED=true
CLUSTER_WORKERS=0

# Production (manual)
CLUSTER_ENABLED=true
CLUSTER_WORKERS=4
```

---

## 🚨 Troubleshooting

### Redis connection failed

```bash
# Check Redis is running
redis-cli ping

# Or disable cache
CACHE_ENABLED=false
```

### Module 'redis' not found

```bash
# Install Redis
npm install redis

# Or disable cache
CACHE_ENABLED=false
```

### Cluster not starting

```bash
# Try single instance
CLUSTER_ENABLED=false npm run start:prod
```

---

## ✅ Quick Start Checklist

- [ ] Check `.env` file (CACHE_ENABLED, CLUSTER_ENABLED)
- [ ] If cache enabled: Install Redis (`npm install redis`)
- [ ] If cache enabled: Start Redis server
- [ ] Run app: `npm run start:dev`
- [ ] Test monitoring: `GET /monitoring/health`
- [ ] Check logs: `logs/app.log`

---

## 🎯 Examples

### Example 1: Cache Product List

```typescript
@Controller('products')
export class ProductController {
  @Get()
  @Cacheable({ ttl: 300, tags: ['products'] })
  async findAll() {
    return this.productService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productService.create(dto);

    // Invalidate cache
    await this.cache.delByTags(['products']);

    return product;
  }
}
```

### Example 2: Log Requests

```typescript
@Injectable()
export class ProductService {
  constructor(private logger: ClusterLogger) {}

  async findOne(id: string) {
    this.logger.log(`Finding product ${id}`, 'ProductService');

    const product = await this.productRepo.findOne(id);

    if (!product) {
      this.logger.warn(`Product ${id} not found`, 'ProductService');
    }

    return product;
  }
}
```

---

**Xong! App đã sẵn sàng với Cache & Cluster! 🚀**

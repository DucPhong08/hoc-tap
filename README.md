# NestJS Clean Architecture Boilerplate

<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MikroORM-6.3-FF6D00" alt="MikroORM" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7.0-DC382D?logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

## Mô tả

Boilerplate NestJS với Clean Architecture, tích hợp sẵn:

- ✅ **Plop Generator** - Sinh code tự động cho toàn bộ Module (`npm run gen`)
- ✅ **Base CRUD Controller Factory** - Tự động hóa API Endpoints (Pagination, Filtering, Bulk Operations)
- ✅ **MikroORM** - ORM hiện đại với TypeScript
- ✅ **Redis Cache** - Hệ thống cache với decorator `@Cacheable`
- ✅ **JWT Authentication** - Xác thực với JWT + Refresh Token
- ✅ **OAuth2** - Google & Facebook login
- ✅ **Base Repository Pattern** - CRUD operations với query operators
- ✅ **Transaction Support** - Database transactions
- ✅ **Monitoring** - Health check endpoints

## Cấu trúc thư mục

```
src/
├── common/              # Shared utilities
│   ├── cache/          # Redis cache system
│   ├── monitoring/     # Health check
│   ├── repositories/   # Base & cached repositories
│   ├── guards/         # Auth guards
│   ├── decorators/     # Custom decorators
│   └── ...
├── config/             # Configuration với validation
├── infra/              # Infrastructure (ORM, migrations)
├── modules/            # Feature modules
│   ├── auth/          # Authentication
│   ├── users/         # User management
│   └── products/      # Product management
└── main.ts            # API entry
```

## Cài đặt

```bash
npm install
```

## Cấu hình

Copy `.env.example` thành `.env` và cấu hình:

```bash
cp .env.example .env
```

Xem chi tiết trong [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Chạy ứng dụng

```bash
# Development
npm run start:dev
```

## Tính năng chính

### 1. Base Repository với Query Operators

```typescript
// Query operators: $eq, $ne, $in, $gt, $gte, $lt, $lte, $like, $ilike
await userRepo.getMany(
  { age: { $gte: 18 }, status: { $in: ['active', 'pending'] } },
  { sort: { createdAt: -1 }, limit: 10 },
);
```

### 2. Tự động hóa với Plop Generator (`npm run gen`)

Chỉ với 1 câu lệnh, hệ thống tự động:

- Đẻ ra toàn bộ cấu trúc: `Controller`, `Service`, `Repository`, `Entity`, `DTOs`, `Module`.
- Tự động import Module mới vào `app.module.ts`.
- Tự động đăng ký Entity mới vào `entity-registry.ts`.

### 3. Base CRUD Controller Factory

Tự động sinh ra các RESTful APIs chuẩn mực chỉ bằng cách kế thừa:

```typescript
@ApiTags('users')
@Controller('users')
export class UserController extends BaseCrudControllerFactory(
  User,
  CreateUserDto,
  UpdateUserDto,
  UserConditionDto,
) {
  constructor(private readonly userService: UserService) {
    super(userService);
  }
}
```

Hỗ trợ đầy đủ: `GET / (pagination)`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PUT /bulk`, `DELETE /bulk` với Condition Filter qua URL.

### 4. Redis Cache với Decorator

```typescript
@Get()
@Cacheable({ ttl: 300, tags: ['users'] })
async getUsers() {
  return this.userService.getMany();
}
```

### 5. Authentication

- JWT với Access Token + Refresh Token
- OAuth2: Google & Facebook login
- Role-based authorization

### 6. Monitoring

```bash
GET /health          # Health check
GET /health/metrics  # System metrics
```

## Scripts

```bash
# Code Generator (Tự động tạo Module mới)
npm run gen

# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Lint
npm run lint

# Format
npm run format
```

## Database Migrations

```bash
# Tạo migration mới
npm run migration:create

# Chạy migrations
npm run migration:up

# Rollback migration
npm run migration:down
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Single Server

```bash
npm run build
NODE_ENV=production npm run start:prod
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["npm", "run", "start:prod"]
```

### PM2 (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Start API process
pm2 start dist/main.js --name api
```

## Tech Stack

- **Framework**: NestJS 11
- **ORM**: MikroORM 6.3
- **Database**: PostgreSQL
- **Cache**: Redis (optional)
- **Authentication**: Passport JWT, Google OAuth, Facebook OAuth
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## Tài liệu

- [NestJS Documentation](https://docs.nestjs.com)
- [MikroORM Documentation](https://mikro-orm.io)

## License

[MIT licensed](LICENSE)

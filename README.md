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

## Cài đặt

```bash
npm install
```

## Cấu hình

Copy `.env.example` thành `.env` và cấu hình các biến môi trường cần thiết:

```bash
cp .env.example .env
```

Xem chi tiết trong [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Chạy ứng dụng

```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod
```

## Code Generator

Tự động sinh toàn bộ code cấu trúc cho một Module mới:

```bash
npm run gen
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

## Deployment

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

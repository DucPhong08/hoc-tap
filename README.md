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

Các API `GET /users/many` và `GET /audit-logs/many`
mặc định trả tối đa 100 bản ghi. Dùng `limit` (tối đa 1000) và `offset` để
lấy tiếp dữ liệu, ví dụ: `/users/many?limit=100&offset=100`.

Tạo user qua `POST /users` (quyền admin). Hai URL trùng `/users/list-all`
và `/users/admin-create` đã được bỏ.

WebSocket chỉ cho client tự tham gia room cá nhân `user:<id>` của tài khoản
đã xác thực. Session được kiểm tra từ database khi kết nối và trước mỗi packet;
kết nối tự đóng khi access token hết hạn. Socket đang chờ không bị ngắt ngay
chỉ vì logout, nhưng packet tiếp theo sẽ bị từ chối.

`npm run lint` chỉ kiểm tra code; dùng `npm run lint:fix` để tự sửa lỗi lint.

## Code Generator

### Override service trong VS Code

Service kế thừa `BaseService<Entity>` dùng CRUD có sẵn. Khi cần thêm nghiệp vụ:

1. Đặt con trỏ trong class service, ở dòng trống; gõ `ovget` rồi nhấn `Ctrl + Space`.
2. Chọn `ovgetById`, `ovgetOne`, `ovgetMany` hoặc `ovgetPage`, nhấn Enter.
3. Thay placeholder `Entity` bằng entity của service; nhấn Tab để đến phần viết nghiệp vụ.
4. Dùng `Ctrl + .` tại type chưa import để thêm import tương ứng.

Các prefix khác: `ovcreate`, `ovinsertMany`, `ovupdateById`, `ovupdateOne`,
`ovupdateMany`, `ovupdateManyByIds`, `ovdeleteById`, `ovdeleteOne`,
`ovdeleteMany`, `ovdeleteManyByIds`.

Snippet đã chứa `async`, nên không gõ `async` trước prefix. Các mẫu nằm trong
`.vscode/base-service.code-snippets`, dùng generic mặc định của base; cần cập nhật
khi đổi contract hoặc tùy biến generic. TypeScript kiểm tra chữ ký của hàm ghi đè
có tương thích với base; project không bắt buộc từ khóa `override`.

Nếu VS Code hỏi chọn TypeScript, chọn bản trong workspace; cũng có thể dùng lệnh
`TypeScript: Select TypeScript Version` → `Use Workspace Version`.

### Sinh module

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

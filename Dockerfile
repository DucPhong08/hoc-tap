# ==========================================
# 1. Build Stage
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Cài đặt build tools cần thiết cho native modules (ví dụ: bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package descriptors và cài đặt toàn bộ dependencies (bao gồm devDependencies để build)
COPY package*.json ./
RUN npm ci

# Copy toàn bộ mã nguồn và build dự án
COPY . .
RUN npm run build

# Xóa bỏ devDependencies để thu gọn node_modules chạy production
RUN npm prune --omit=dev

# ==========================================
# 2. Production Runtime Stage
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Dùng dumb-init để quản lý process signals (SIGINT/SIGTERM) chính xác trong container
RUN apk add --no-cache dumb-init

# Chạy với quyền non-root user (node) để tăng cường bảo mật
USER node

# Copy các dependencies và sản phẩm build từ builder stage
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["dumb-init", "node", "dist/main.js"]

import { SetMetadata } from '@nestjs/common';

export const AUDITABLE_KEY = 'auditable';

/**
 * Auditable decorator options - CỰC KỲ ĐƠN GIẢN
 * Chỉ cần action và description!
 */
export interface AuditableOptions {
  action: string; // Action type (VD: 'USER_CREATED')
  description?: string; // Mô tả (optional)
}

/**
 * Decorator đánh dấu method cần audit
 *
 * @example
 * ```typescript
 * @Auditable({
 *   action: AuditKey.USER_CREATED,
 *   description: 'Tạo người dùng mới'
 * })
 * async create(@Body() dto: CreateUserDto) { }
 * ```
 */
export const Auditable = (options: AuditableOptions) =>
  SetMetadata(AUDITABLE_KEY, options);

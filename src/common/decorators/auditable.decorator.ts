import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@/modules/audit-logs/enums/audit-action.enum';
import {
  AUDITABLE_KEY,
  AUDIT_LOG_KEY,
  AUDIT_LOG_METADATA,
  AuditLogProps,
} from '@/modules/audit-logs/constants/audit-log.constant';

export { AUDITABLE_KEY, AUDIT_LOG_KEY, AUDIT_LOG_METADATA };
export type { AuditLogProps };

export interface AuditableOptions extends Omit<AuditLogProps, 'action'> {
  action?: AuditAction | string;
}

/**
 * Decorator to mark a method or class for audit logging.
 */
export const AuditLog = (options: AuditLogProps = {}) =>
  SetMetadata(AUDIT_LOG_KEY, options);

/**
 * Backward-compatible alias for @AuditLog.
 *
 * Đây là alias thật sự (cùng metadata key `AUDIT_LOG_KEY`), không phải một
 * decorator song song với key riêng. Nhờ vậy AuditInterceptor chỉ cần đọc
 * metadata một lần duy nhất, bất kể handler dùng @AuditLog hay @Auditable.
 */
export const Auditable = (options: AuditableOptions = {}) => AuditLog(options);

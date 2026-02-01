import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../../modules/audit-logs/enums/audit-action.enum';

export const AUDITABLE_KEY = 'auditable';

export interface AuditableOptions {
  /**
   * Audit action type
   */
  action: AuditAction;

  /**
   * Custom description
   */
  description?: string;

  /**
   * Fields to exclude from logging
   */
  excludeFields?: string[];
}

/**
 * @Auditable decorator for automatic audit logging
 *
 * @example
 * ```typescript
 * @Auditable({
 *   action: AuditAction.UPDATE,
 * })
 * async updateUser(id: string, data: UpdateUserDto) { }
 * ```
 */
export const Auditable = (options: AuditableOptions) =>
  SetMetadata(AUDITABLE_KEY, options);

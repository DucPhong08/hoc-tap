import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../../modules/audit-logs/enums/audit-action.enum';

export const AUDITABLE_KEY = 'auditable';

export interface AuditableOptions {
  action: AuditAction;
  description?: string;
}

export const Auditable = (options: AuditableOptions) =>
  SetMetadata(AUDITABLE_KEY, options);

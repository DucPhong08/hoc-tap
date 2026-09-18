import type { AuditLog } from '../entities/audit-log.entity';

export const AUDIT_LOG_KEY = 'audit-log';

export const AUDITABLE_KEY = AUDIT_LOG_KEY;

export const AUDIT_LOG_METADATA = '__audit_log_metadata__';

export interface AuditLogProps {
  action?: string;
  description?: string;
  sourceId?: string;
  metadata?: Record<string, any>;
  logResponse?: boolean;
  logError?: boolean;
  uId?: string;
  uCode?: string;
  uName?: string;
  uEmail?: string;
}

export type LogActionData = Partial<AuditLog>;

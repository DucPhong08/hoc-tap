import type { IBaseRepository } from '@/common/interfaces/repository.interface';
import type { AuditLog } from '../entities/audit-log.entity';

export interface IAuditLogRepository<TContext = any> extends IBaseRepository<
  AuditLog,
  TContext
> {}

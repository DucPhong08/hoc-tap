import { Type } from '@nestjs/common';
import { AuditLogEntity } from 'src/modules/audit-logs/entities/audit-log.entity';

export const LogsEntities: Type[] = [AuditLogEntity];

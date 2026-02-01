import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { AuditAction } from '../enums/audit-action.enum';

export interface LogActionData {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  description?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  async log(data: LogActionData): Promise<AuditLogEntity> {
    const changes =
      data.oldData && data.newData
        ? this.calculateChanges(data.oldData, data.newData)
        : undefined;

    return this.repository.create({
      ...data,
      changes,
    });
  }

  private calculateChanges(
    oldData: Record<string, any>,
    newData: Record<string, any>,
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = { old: oldData[key], new: newData[key] };
      }
    }

    return changes;
  }
}

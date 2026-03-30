import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLogEntity } from '../entities/audit-log.entity';
import type { LogActionData } from '../constants/audit-log.constant';

@Injectable()
export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  async log(data: LogActionData): Promise<AuditLogEntity> {
    return this.repository.create({
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      userEmail: data.userEmail,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      endpoint: data.endpoint,
      method: data.method,
      description: data.description,
    });
  }

  async logMany(dataArray: LogActionData[]): Promise<AuditLogEntity[]> {
    const entities = dataArray.map((data) => ({
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      userEmail: data.userEmail,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      endpoint: data.endpoint,
      method: data.method,
      description: data.description,
    }));

    const result: AuditLogEntity[] = [];
    for (const entity of entities) {
      result.push(await this.repository.create(entity));
    }
    return result;
  }

  async getUserActions(userId: string, limit = 100): Promise<AuditLogEntity[]> {
    return this.repository.getUserActions(userId, limit);
  }

  async getEntityHistory(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogEntity[]> {
    return this.repository.getEntityHistory(entityType, entityId);
  }

  async getRecentActions(limit = 50): Promise<AuditLogEntity[]> {
    return this.repository.getRecentActions(limit);
  }

  async cleanupOldLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    return this.repository.deleteOlderThan(cutoffDate);
  }
}

import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLog } from '../entities/audit-log.entity';
import type { LogActionData } from '../constants/audit-log.constant';

@Injectable()
export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  async log(data: LogActionData): Promise<AuditLog> {
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

  async logMany(dataArray: LogActionData[]): Promise<AuditLog[]> {
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

    const result: AuditLog[] = [];
    for (const entity of entities) {
      result.push(await this.repository.create(entity));
    }
    return result;
  }

  async getUserActions(userId: string, limit = 100): Promise<AuditLog[]> {
    const result = await this.repository.getPage(
      { userId },
      { limit, page: 1, sort: { createdAt: -1 } },
    );
    return result.data;
  }

  async getEntityHistory(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.repository.getMany(
      { entityType, entityId },
      { sort: { createdAt: 1 } },
    );
  }

  async getRecentActions(limit = 50): Promise<AuditLog[]> {
    const result = await this.repository.getPage(
      {},
      { limit, page: 1, sort: { createdAt: -1 } },
    );
    return result.data;
  }

  async cleanupOldLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const result = await this.repository.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
    return result.deleted;
  }
}

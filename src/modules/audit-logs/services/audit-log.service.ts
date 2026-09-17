import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService } from '@/infra/services/base.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLog } from '../entities/audit-log.entity';
import type { LogActionData } from '../constants/audit-log.constant';

@Injectable()
export class AuditLogService extends BaseService<AuditLog> {
  private static readonly MAX_QUERY_LIMIT = 100;

  constructor(protected readonly repository: AuditLogRepository) {
    super(repository);
  }

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

  async logMany(dataArray: LogActionData[]): Promise<{ n: number }> {
    if (!dataArray || dataArray.length === 0) {
      return { n: 0 };
    }

    return this.repository.insertMany(
      dataArray.map((data) => ({
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
      })),
    );
  }

  async getUserActions(userId: string, limit = 100): Promise<AuditLog[]> {
    const safeLimit = this.clampLimit(limit, 100);
    return this.repository.getMany(
      { userId },
      { limit: safeLimit, sort: { createdAt: -1 } },
    );
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
    const safeLimit = this.clampLimit(limit, 50);
    return this.repository.getMany(
      {},
      { limit: safeLimit, sort: { createdAt: -1 } },
    );
  }

  async cleanup(days: number): Promise<number> {
    if (!days || days < 1) {
      throw new BadRequestException(
        'Số ngày lưu trữ (retention days) phải lớn hơn hoặc bằng 1',
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const result = await this.repository.deleteMany(
      {
        createdAt: { $lt: cutoffDate },
      },
      { soft: false },
    );
    return result.deleted;
  }

  private clampLimit(limit: number, defaultLimit: number): number {
    const parsed = Number(limit);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return defaultLimit;
    }
    return Math.min(parsed, AuditLogService.MAX_QUERY_LIMIT);
  }
}

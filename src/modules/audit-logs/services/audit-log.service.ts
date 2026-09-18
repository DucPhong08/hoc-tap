import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService } from '@/infra/services/base.service';
import { Entity } from '@/common/enums/entity.enum';
import { InjectRepository } from '@/infra/repositories/common/repository';
import type { IAuditLogRepository } from '../repositories/audit-log-repository.interface';
import { AuditLog } from '../entities/audit-log.entity';
import type { LogActionData } from '../constants/audit-log.constant';

@Injectable()
export class AuditLogService extends BaseService<AuditLog> {
  private static readonly MAX_QUERY_LIMIT = 100;

  constructor(
    @InjectRepository(Entity.AUDIT_LOG)
    protected readonly repository: IAuditLogRepository,
  ) {
    super(repository);
  }

  async log(data: LogActionData): Promise<AuditLog> {
    return this.repository.create(data);
  }

  async logMany(dataArray: LogActionData[]): Promise<{ n: number }> {
    if (!dataArray || dataArray.length === 0) {
      return { n: 0 };
    }

    return this.repository.insertMany(dataArray);
  }

  async getUserActions(uId: string, limit = 100): Promise<AuditLog[]> {
    const safeLimit = this.clampLimit(limit, 100);
    return this.repository.getMany(
      { uId },
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

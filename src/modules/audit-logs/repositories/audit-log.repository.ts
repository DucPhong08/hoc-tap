import { Injectable } from '@nestjs/common';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository extends MikroOrmBaseRepository<AuditLogEntity> {
  protected entityClass = AuditLogEntity;

  async getUserActions(userId: string, limit = 100): Promise<AuditLogEntity[]> {
    return this.getMany({ userId }, { limit, sort: { createdAt: -1 } });
  }

  async getEntityHistory(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogEntity[]> {
    return this.getMany({ entityType, entityId }, { sort: { createdAt: 1 } });
  }

  async getRecentActions(limit = 50): Promise<AuditLogEntity[]> {
    return this.getMany({}, { limit, sort: { createdAt: -1 } });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.em.nativeDelete(this.entityClass, {
      createdAt: { $lt: date },
    });
    return result;
  }
}

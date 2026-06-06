import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { InjectEntityRepository } from 'src/database/entity-registry.helper';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository extends MikroOrmBaseRepository<
  AuditLog,
  EntityManager
> {
  constructor(
    @InjectEntityRepository(AuditLog)
    repository: EntityRepository<AuditLog>,
  ) {
    super(repository);
  }

  async getUserActions(userId: string, limit = 100): Promise<AuditLog[]> {
    return this.getMany({ userId }, { limit, sort: { createdAt: -1 } });
  }

  async getEntityHistory(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.getMany({ entityType, entityId }, { sort: { createdAt: 1 } });
  }

  async getRecentActions(limit = 50): Promise<AuditLog[]> {
    return this.getMany({}, { limit, sort: { createdAt: -1 } });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.em.nativeDelete(AuditLog, {
      createdAt: { $lt: date },
    });
    return result;
  }
}

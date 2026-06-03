import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { InjectEntityRepository } from 'src/database/entity-registry.helper';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository extends MikroOrmBaseRepository<
  AuditLogEntity,
  EntityManager
> {
  constructor(
    @InjectEntityRepository(AuditLogEntity)
    repository: EntityRepository<AuditLogEntity>,
  ) {
    super(repository);
  }

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
    const result = await this.em.nativeDelete(AuditLogEntity, {
      createdAt: { $lt: date },
    });
    return result;
  }
}

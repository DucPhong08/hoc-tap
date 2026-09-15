import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '@/infra/repositories/mikro-orm-base.repository';
import { InjectEntityRepository } from '@/database/entity-registry.helper';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository extends MikroOrmBaseRepository<AuditLog> {
  constructor(
    @InjectEntityRepository(AuditLog)
    private readonly auditLogRepo: EntityRepository<AuditLog>,
  ) {
    super(auditLogRepo);
  }
}

import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { MikroOrmBaseRepository } from '@/infra/repositories/mikro-orm-base.repository';
import { InjectEntityRepository } from '@/database/entity-registry';
import { AuditLog } from '../entities/audit-log.entity';
import type { IAuditLogRepository } from './audit-log-repository.interface';

@Injectable()
export class AuditLogRepository
  extends MikroOrmBaseRepository<AuditLog>
  implements IAuditLogRepository
{
  constructor(
    @InjectEntityRepository(AuditLog)
    private readonly auditLogRepo: EntityRepository<AuditLog>,
  ) {
    super(auditLogRepo);
  }
}

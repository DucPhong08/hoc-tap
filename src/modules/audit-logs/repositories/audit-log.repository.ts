import { Injectable } from '@nestjs/common';
import { MikroOrmBaseRepository } from '../../../infra/repositories/mikro-orm-base.repository';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository extends MikroOrmBaseRepository<AuditLogEntity> {
  protected entityClass = AuditLogEntity;
}

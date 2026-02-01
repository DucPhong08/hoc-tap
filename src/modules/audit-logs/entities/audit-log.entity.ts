import { Entity, Property, Index } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entity/base.entity';
import { AuditAction } from '../enums/audit-action.enum';

@Entity({ tableName: 'audit_logs' })
@Index({ properties: ['userId', 'createdAt'] })
@Index({ properties: ['action', 'createdAt'] })
@Index({ properties: ['entityType', 'entityId'] })
export class AuditLogEntity extends BaseEntity {
  @Property({ type: 'varchar', length: 50 })
  action!: AuditAction;

  @Property({ type: 'varchar', length: 100 })
  entityType!: string;

  @Property({ type: 'varchar', length: 100 })
  entityId!: string;

  @Property({ type: 'json', nullable: true })
  oldData?: Record<string, any>;

  @Property({ type: 'json', nullable: true })
  newData?: Record<string, any>;

  @Property({ type: 'json', nullable: true })
  changes?: Record<string, { old: any; new: any }>;

  @Property({ type: 'varchar', length: 100 })
  userId!: string;

  @Property({ type: 'varchar', length: 150, nullable: true })
  userEmail?: string;

  @Property({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Property({ type: 'text', nullable: true })
  userAgent?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  endpoint?: string;

  @Property({ type: 'varchar', length: 10, nullable: true })
  method?: string;

  @Property({ type: 'text', nullable: true })
  description?: string;
}

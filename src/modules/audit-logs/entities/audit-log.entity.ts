import { Entity, Property, Index } from '@mikro-orm/core';
import { IsString, Allow } from 'class-validator';
import { BaseEntity } from '../../../common/entity/base.entity';

@Entity({ tableName: 'audit_logs' })
@Index({ properties: ['userId', 'createdAt'] })
@Index({ properties: ['action', 'createdAt'] })
export class AuditLog extends BaseEntity {
  @IsString()
  @Property({})
  action!: string;

  @IsString()
  @Property({})
  entityType!: string;

  @IsString()
  @Property({})
  entityId!: string;

  @Allow()
  @Property({ type: 'json', nullable: true })
  changes?: Record<string, any>;

  @IsString()
  @Property({})
  userId!: string;

  @IsString()
  @Property({ nullable: true })
  userEmail?: string;

  @IsString()
  @Property({ nullable: true })
  ipAddress?: string;

  @IsString()
  @Property({ nullable: true })
  userAgent?: string;

  @IsString()
  @Property({ nullable: true })
  endpoint?: string;

  @IsString()
  @Property({ nullable: true })
  method?: string;

  @IsString()
  @Property({ type: 'text', nullable: true })
  description?: string;
}

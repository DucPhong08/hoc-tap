import { Entity, Property, Index } from '@mikro-orm/core';
import { IsString, Allow } from 'class-validator';
import { BaseEntity } from '@/common/entity/base.entity';
import { Table } from '@/common/enums/entity.enum';

@Entity({ tableName: Table.AUDIT_LOG })
@Index({ properties: ['uId', 'createdAt'] })
@Index({ properties: ['action', 'createdAt'] })
export class AuditLog extends BaseEntity {
  @IsString()
  @Property({})
  action!: string;

  @IsString()
  @Property({ nullable: true })
  entityType?: string;

  @IsString()
  @Property({ nullable: true })
  entityId?: string;

  @IsString()
  @Property({ nullable: true })
  sourceId?: string;

  @Allow()
  @Property({ type: 'json', nullable: true })
  changes?: Record<string, any>;

  @IsString()
  @Property({ nullable: true })
  uId?: string;

  @IsString()
  @Property({ nullable: true })
  uCode?: string;

  @IsString()
  @Property({ nullable: true })
  uName?: string;

  @IsString()
  @Property({ nullable: true })
  uEmail?: string;

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
  @Property({ nullable: true })
  requestType?: string;

  @IsString()
  @Property({ type: 'text', nullable: true })
  description?: string;

  @Allow()
  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Allow()
  @Property({ type: 'json', nullable: true })
  data?: any;

  @Allow()
  @Property({ type: 'json', nullable: true })
  query?: any;

  @Allow()
  @Property({ type: 'json', nullable: true })
  param?: any;

  @Allow()
  @Property({ type: 'json', nullable: true })
  response?: any;

  @Allow()
  @Property({ type: 'json', nullable: true })
  error?: any;
}

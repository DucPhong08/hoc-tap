import { Entity, Property, Index } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Allow } from 'class-validator';
import { BaseEntity } from '../../../common/entity/base.entity';

@Entity({ tableName: 'audit_logs' })
@Index({ properties: ['userId', 'createdAt'] })
@Index({ properties: ['action', 'createdAt'] })
export class AuditLogEntity extends BaseEntity {
  @ApiProperty({ description: 'Audit action' })
  @IsString()
  @Property({ type: 'varchar', length: 50 })
  action!: string;

  @ApiProperty({ description: 'Entity type' })
  @IsString()
  @Property({ type: 'varchar', length: 100 })
  entityType!: string;

  @ApiProperty({ description: 'Entity ID' })
  @IsString()
  @Property({ type: 'varchar', length: 100 })
  entityId!: string;

  @ApiProperty({ description: 'Changes made' })
  @Allow()
  @Property({ type: 'json', nullable: true })
  changes?: Record<string, any>;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  @Property({ type: 'varchar', length: 100 })
  userId!: string;

  @ApiProperty({ description: 'User email' })
  @IsString()
  @Property({ type: 'varchar', length: 150, nullable: true })
  userEmail?: string;

  @ApiProperty({ description: 'IP address' })
  @IsString()
  @Property({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent' })
  @IsString()
  @Property({ type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'Endpoint' })
  @IsString()
  @Property({ type: 'varchar', length: 255, nullable: true })
  endpoint?: string;

  @ApiProperty({ description: 'HTTP method' })
  @IsString()
  @Property({ type: 'varchar', length: 10, nullable: true })
  method?: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  @Property({ type: 'text', nullable: true })
  description?: string;
}

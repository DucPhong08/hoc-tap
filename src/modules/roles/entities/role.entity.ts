import { Entity, Property } from '@mikro-orm/core';
import { IsOptional, IsString } from 'class-validator';
import { BaseEntity } from '@/common/entity/base.entity';

@Entity({ tableName: 'roles' })
export class Role extends BaseEntity {
  @IsString()
  @Property({ unique: true })
  code!: string;

  @IsOptional()
  @IsString()
  @Property({ nullable: true })
  name?: string;

  @IsOptional()
  @IsString()
  @Property({ nullable: true })
  description?: string;
}

import { Entity, Property } from '@mikro-orm/core';
import { IsString, Allow } from 'class-validator';
import { BaseEntity } from '@/common/entity/base.entity';
import { Table } from '@/common/enums/entity.enum';

@Entity({ tableName: Table.SETTING })
export class Setting extends BaseEntity {
  @IsString()
  @Property({ unique: true })
  key!: string;

  @Allow()
  @Property({ type: 'json' })
  value!: Record<string, any>;
}

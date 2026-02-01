import { Entity, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Allow } from 'class-validator';
import { BaseEntity } from '../../../common/entity/base.entity';

@Entity({ tableName: 'settings' })
export class SettingEntity extends BaseEntity {
  @ApiProperty({ description: 'Setting key (unique identifier)' })
  @IsString()
  @Property({ type: 'varchar', length: 100, unique: true })
  key!: string;

  @ApiProperty({ description: 'Setting value (stored as JSON)' })
  @Allow()
  @Property({ type: 'json' })
  value!: Record<string, any>;
}

import { Entity, Property } from '@mikro-orm/core';
import {
  IsEmail,
  IsString,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../../common/base.entity';

@Entity({ tableName: 'users' })
export class UserEntity extends BaseEntity {
  @ApiProperty()
  @IsEmail()
  @MaxLength(150)
  @Property({ type: 'varchar', length: 150 })
  email!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  @Property({ type: 'varchar', length: 150 })
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(150)
  @Property({ type: 'varchar', length: 150 })
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ type: 'text', nullable: true })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;
}

import { Entity, Property } from '@mikro-orm/core';
import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/base.entity';

@Entity({ tableName: 'products' })
export class ProductEntity extends BaseEntity {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  @Property({ type: 'varchar', length: 200 })
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Property({ type: 'integer', default: 0 })
  stock: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Property({ type: 'varchar', length: 50, nullable: true })
  sku?: string;
}

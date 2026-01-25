import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { MigrationOrmConfig } from './orm/migration.config';

export class OrmConfig {
  @IsArray()
  @Type(() => String)
  entities!: string[];

  @IsArray()
  @Type(() => String)
  entitiesTs!: string[];

  @ValidateNested()
  @Type(() => MigrationOrmConfig)
  migrations!: MigrationOrmConfig;

  @IsBoolean()
  @IsOptional()
  debug?: boolean;
}

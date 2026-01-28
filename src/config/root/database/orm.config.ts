import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { MigrationOrmConfig } from './orm/migration.config';

export class OrmConfig {
  @ValidateNested()
  @Type(() => MigrationOrmConfig)
  migrations!: MigrationOrmConfig;

  @IsBoolean()
  @IsOptional()
  debug?: boolean;
}

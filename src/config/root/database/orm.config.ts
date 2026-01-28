import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { MigrationOrmConfig } from './orm/migration.config';

export class OrmConfig {
  @ValidateNested()
  @Type(() => MigrationOrmConfig)
  migrations!: MigrationOrmConfig;
}

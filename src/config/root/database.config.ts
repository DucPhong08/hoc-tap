import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DevConfig } from './database/dev.config';
import { OrmConfig } from './database/orm.config';

export class DatabaseConfig {
  profile?: 'sql' | 'mongo';

  @ValidateNested()
  @Type(() => DevConfig)
  dev!: DevConfig;

  connection?: Record<string, unknown>;

  @ValidateNested()
  @Type(() => OrmConfig)
  orm!: OrmConfig;

  driverOptions?: Record<string, unknown>;
}

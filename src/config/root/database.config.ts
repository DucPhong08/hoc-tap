import {
  IsDefined,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DevConfig } from './database/dev.config';
import { ConnectionConfig } from './database/connection.config';

export class DatabaseConfig {
  @ValidateNested()
  @Type(() => DevConfig)
  dev: DevConfig = new DevConfig();

  @IsDefined()
  @ValidateNested()
  @Type(() => ConnectionConfig)
  connection!: ConnectionConfig;

  @IsOptional()
  @IsObject()
  driverOptions?: Record<string, unknown>;
}

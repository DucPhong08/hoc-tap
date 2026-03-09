import { IsBoolean } from 'class-validator';

export class DevConfig {
  @IsBoolean()
  autoMigrate: boolean = false;

  @IsBoolean()
  autoSyncSchema: boolean = false;

  @IsBoolean()
  debug: boolean = false;
}

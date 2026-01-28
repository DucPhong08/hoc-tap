import { IsBoolean } from 'class-validator';

export class DevConfig {
  @IsBoolean()
  autoMigrate!: boolean;

  @IsBoolean()
  debug!: boolean;
}

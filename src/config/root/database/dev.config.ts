import { IsBoolean, IsNumber, Min } from 'class-validator';

export class DevConfig {
  @IsBoolean()
  autoMigrate!: boolean;

  @IsBoolean()
  autoSeed!: boolean;

  @IsNumber()
  @Min(0)
  timeout!: number;

  @IsBoolean()
  debug!: boolean;
}

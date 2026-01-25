import { IsBoolean, IsNumber, Min } from 'class-validator';

export class MigrationConfig {
  @IsBoolean()
  migrate!: boolean;

  @IsBoolean()
  seed!: boolean;

  @IsNumber()
  @Min(0)
  timeout!: number;
}

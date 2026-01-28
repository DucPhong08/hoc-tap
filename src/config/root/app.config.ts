import { IsString, IsOptional } from 'class-validator';

export class AppConfig {
  @IsString()
  apiPrefix!: string;

  @IsString()
  appName!: string;

  @IsString()
  appVersion!: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}

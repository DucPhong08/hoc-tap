import { IsString, IsNumber, Min, Max, IsIn } from 'class-validator';

export class AppConfig {
  @IsString()
  @IsIn(['development', 'staging', 'production'])
  nodeEnv!: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  port!: number;

  @IsString()
  apiPrefix!: string;

  @IsString()
  appName!: string;

  @IsString()
  appVersion!: string;
}

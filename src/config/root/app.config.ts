import { IsString, IsOptional } from 'class-validator';

export class AppConfig {
  @IsString()
  apiPrefix: string = 'api';

  @IsString()
  appName: string = 'Hoc Tap API';

  @IsString()
  appVersion: string = '1.0.0';

  @IsString()
  @IsOptional()
  timezone?: string = 'Asia/Ho_Chi_Minh';
}

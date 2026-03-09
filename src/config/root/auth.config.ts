import { IsString, IsNumber, Min } from 'class-validator';

export class AuthConfig {
  @IsString()
  jwtSecret: string = 'change-me-in-production';

  @IsString()
  jwtExpiresIn: string = '1d';

  @IsString()
  jwtRefreshSecret: string = 'change-me-refresh-in-production';

  @IsString()
  jwtRefreshExpiresIn: string = '7d';

  @IsNumber()
  @Min(10)
  bcryptRounds: number = 10;
}

import { IsString, IsNumber, Min } from 'class-validator';

export class AuthConfig {
  @IsString()
  jwtSecret!: string;

  @IsString()
  jwtExpiresIn!: string;

  @IsString()
  jwtRefreshSecret!: string;

  @IsString()
  jwtRefreshExpiresIn!: string;

  @IsNumber()
  @Min(10)
  bcryptRounds!: number;
}

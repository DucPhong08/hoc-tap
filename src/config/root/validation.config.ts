import { IsBoolean } from 'class-validator';

export class ValidationConfig {
  @IsBoolean()
  whitelist!: boolean;

  @IsBoolean()
  forbidNonWhitelisted!: boolean;

  @IsBoolean()
  transform!: boolean;
}

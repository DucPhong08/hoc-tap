import {
  IsBoolean,
  IsNumber,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class RedisConfig {
  @IsString()
  host!: string;

  @IsNumber()
  port!: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsNumber()
  db!: number;
}

export class CacheConfig {
  @IsBoolean()
  enabled!: boolean;

  @IsNumber()
  ttl!: number;

  @IsString()
  prefix!: string;

  @ValidateNested()
  @Type(() => RedisConfig)
  redis!: RedisConfig;
}

import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayNotEmpty, IsArray } from 'class-validator';

export class CorsConfig {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @Type(() => String)
  origins!: string[];
}

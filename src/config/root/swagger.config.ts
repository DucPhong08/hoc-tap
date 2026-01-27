import { IsBoolean, IsString } from 'class-validator';

export class SwaggerConfig {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  path!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  version!: string;
}

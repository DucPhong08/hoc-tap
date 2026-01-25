import { IsIn, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HostConfig } from './root/host.config';
import { CorsConfig } from './root/cors.config';
import { DatabaseConfig } from './root/database.config';

export class RootConfig {
  @IsString()
  @IsIn(['development', 'production'])
  mode!: 'development' | 'production';

  @ValidateNested()
  @Type(() => HostConfig)
  host!: HostConfig;

  @ValidateNested({ each: true })
  @Type(() => DatabaseConfig)
  databases!: { [s: string]: DatabaseConfig };

  @ValidateNested({ each: true })
  @Type(() => CorsConfig)
  cors!: CorsConfig;
}

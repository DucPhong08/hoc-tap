import { IsIn, IsString, ValidateNested } from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
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

  @Transform(({ value }) => {
    if (!value || typeof value !== 'object') return value;
    const result: Record<string, DatabaseConfig> = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        result[key] = plainToInstance(DatabaseConfig, value[key], {
          enableImplicitConversion: true,
        });
      }
    }
    return result;
  })
  databases!: Record<string, DatabaseConfig>;

  @ValidateNested({ each: true })
  @Type(() => CorsConfig)
  cors!: CorsConfig;
}

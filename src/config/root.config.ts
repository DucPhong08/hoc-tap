import { IsIn, IsString, ValidateNested } from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { HostConfig } from './root/host.config';
import { CorsConfig } from './root/cors.config';
import { DatabaseConfig } from './root/database.config';
import { AppConfig } from './root/app.config';
import { SwaggerConfig } from './root/swagger.config';
import { ValidationConfig } from './root/validation.config';
import { AuthConfig } from './root/auth.config';

export class RootConfig {
  @IsString()
  @IsIn(['development', 'production'])
  mode!: 'development' | 'production';

  @ValidateNested()
  @Type(() => AppConfig)
  app!: AppConfig;

  @ValidateNested()
  @Type(() => HostConfig)
  host!: HostConfig;

  @ValidateNested()
  @Type(() => SwaggerConfig)
  swagger!: SwaggerConfig;

  @ValidateNested()
  @Type(() => ValidationConfig)
  validation!: ValidationConfig;

  @ValidateNested()
  @Type(() => AuthConfig)
  auth!: AuthConfig;

  @Transform(({ value }) => {
    if (!value || typeof value !== 'object') return value;
    const result: Record<string, DatabaseConfig> = {};
    for (const key in value) {
      // eslint-disable-next-line no-prototype-builtins
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

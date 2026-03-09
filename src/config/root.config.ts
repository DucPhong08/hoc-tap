import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { HostConfig } from './root/host.config';
import { CorsConfig } from './root/cors.config';
import { DatabaseConfig } from './root/database.config';
import { AppConfig } from './root/app.config';
import { SwaggerConfig } from './root/swagger.config';
import { ValidationConfig } from './root/validation.config';
import { AuthConfig } from './root/auth.config';
import { CacheConfig } from './root/cache.config';
import { ClusterConfig } from './root/cluster.config';
import { OAuthConfig } from './root/oauth.config';

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

  @ValidateNested()
  @Type(() => OAuthConfig)
  @IsOptional()
  oauth?: OAuthConfig;

  @ValidateNested()
  @Type(() => CacheConfig)
  cache!: CacheConfig;

  @ValidateNested()
  @Type(() => ClusterConfig)
  cluster!: ClusterConfig;

  @Transform(({ value }) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    const result: Record<string, DatabaseConfig> = {};
    const rawValue = value as Record<string, unknown>;
    for (const key in rawValue) {
      if (Object.prototype.hasOwnProperty.call(rawValue, key)) {
        result[key] = plainToInstance(DatabaseConfig, rawValue[key], {
          enableImplicitConversion: true,
        });
      }
    }
    return result;
  })
  databases!: Record<string, DatabaseConfig>;

  @ValidateNested()
  @Type(() => CorsConfig)
  cors!: CorsConfig;
}

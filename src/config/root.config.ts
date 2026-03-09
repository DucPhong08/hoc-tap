import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HostConfig } from './root/host.config';
import { DatabaseConfig } from './root/database.config';
import { AppConfig } from './root/app.config';
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

  @IsObject()
  databases: Record<string, DatabaseConfig> = {};
}

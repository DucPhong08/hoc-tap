import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

export class GoogleOAuthConfig {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

export class FacebookOAuthConfig {
  @IsOptional()
  @IsString()
  appId?: string;

  @IsOptional()
  @IsString()
  appSecret?: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

export class OAuthConfig {
  @ValidateNested()
  @Type(() => GoogleOAuthConfig)
  @IsOptional()
  google?: GoogleOAuthConfig;

  @ValidateNested()
  @Type(() => FacebookOAuthConfig)
  @IsOptional()
  facebook?: FacebookOAuthConfig;
}

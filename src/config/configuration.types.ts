export interface AppConfig {
  apiPrefix: string;
  appName: string;
  appVersion: string;
  timezone?: string;
}

export interface HostConfig {
  host: string;
  port: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  bcryptRounds: number;
}

export interface SwaggerConfig {
  enabled: boolean;
  path: string;
  title: string;
  description: string;
  version: string;
}

export interface ValidationConfig {
  whitelist: boolean;
  forbidNonWhitelisted: boolean;
  transform: boolean;
}

export interface ApplicationConfiguration {
  mode: 'development' | 'production' | 'test';
  app: AppConfig;
  host: HostConfig;
  auth: AuthConfig;
  cache: {
    enabled: boolean;
    ttl: number;
    prefix: string;
    redis: {
      host: string;
      port: number;
      password?: string;
      db: number;
    };
  };
  swagger: SwaggerConfig;
  validation: ValidationConfig;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;
  FACEBOOK_CALLBACK_URL: string;
}

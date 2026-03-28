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

export interface ApplicationConfiguration {
  mode: 'development' | 'production' | 'test';
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
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;
  FACEBOOK_CALLBACK_URL: string;
}

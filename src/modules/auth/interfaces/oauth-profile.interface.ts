import { AuthProvider } from '../enums/auth-provider.enum';

export interface OAuthProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  provider: AuthProvider;
  avatar?: string;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserProfile;
}

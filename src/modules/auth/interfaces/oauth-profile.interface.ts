import { AuthProvider } from '../enums/auth-provider.enum';
import { Role } from '../../users/constant/constant';

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
  roles: Role[];
  provider: AuthProvider;
  avatar?: string;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserProfile;
}

import { AuthProvider } from '../enums/auth-provider.enum';

export interface OAuthProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

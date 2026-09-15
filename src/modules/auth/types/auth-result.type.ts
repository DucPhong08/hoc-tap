import { AuthUserProfile } from '../interfaces/oauth-profile.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
  tokenType: 'Bearer';
}

export interface AuthResult extends TokenPair {
  user: AuthUserProfile;
}

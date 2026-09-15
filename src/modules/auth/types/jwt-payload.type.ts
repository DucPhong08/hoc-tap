export interface JwtPayload {
  sub: string;
  sessionId: string;
  type: 'access';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

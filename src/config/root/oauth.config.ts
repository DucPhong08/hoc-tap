export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  facebook: {
    appId: string;
    appSecret: string;
    callbackUrl: string;
  };
}

export default (): { oauth: OAuthConfig } => ({
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackUrl:
        process.env.FACEBOOK_CALLBACK_URL ||
        'http://localhost:3000/auth/facebook/callback',
    },
  },
});

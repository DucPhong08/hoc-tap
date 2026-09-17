import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '../enums/auth-provider.enum';
import type { OAuthProfile } from '../interfaces/oauth-profile.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.google.clientId') ?? '',
      clientSecret:
        configService.get<string>('oauth.google.clientSecret') ?? '',
      callbackURL: configService.get<string>('oauth.google.callbackUrl') ?? '',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): OAuthProfile {
    const { id, emails, name, photos } = profile;

    const oauthProfile: OAuthProfile = {
      provider: AuthProvider.GOOGLE,
      providerId: id,
      email: emails?.[0]?.value ?? '',
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatar: photos?.[0]?.value,
    };

    return oauthProfile;
  }
}

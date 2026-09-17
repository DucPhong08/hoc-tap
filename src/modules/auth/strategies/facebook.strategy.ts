import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '../enums/auth-provider.enum';
import type { OAuthProfile } from '../interfaces/oauth-profile.interface';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.facebook.clientId') ?? '',
      clientSecret:
        configService.get<string>('oauth.facebook.clientSecret') ?? '',
      callbackURL:
        configService.get<string>('oauth.facebook.callbackUrl') ?? '',
      scope: ['email'],
      profileFields: ['emails', 'name', 'photos'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): OAuthProfile {
    const { id, emails, name, photos } = profile;

    const oauthProfile: OAuthProfile = {
      provider: AuthProvider.FACEBOOK,
      providerId: id,
      email: emails?.[0]?.value ?? '',
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatar: photos?.[0]?.value,
    };

    return oauthProfile;
  }
}

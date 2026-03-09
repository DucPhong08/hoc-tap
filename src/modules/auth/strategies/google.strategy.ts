import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  type Profile,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { AuthProvider } from '../enums/auth-provider.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('oauth.google.clientId') || '',
      clientSecret:
        configService.get<string>('oauth.google.clientSecret') || '',
      callbackURL: configService.get<string>('oauth.google.callbackUrl') || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, name, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      done(
        new UnauthorizedException('Tài khoản Google không cung cấp email'),
        undefined,
      );
      return;
    }

    const oauthProfile = {
      provider: AuthProvider.GOOGLE,
      providerId: id,
      email,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      avatar: photos?.[0]?.value,
    };

    try {
      const user = await this.authService.validateOAuthUser(oauthProfile);
      done(null, user);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}

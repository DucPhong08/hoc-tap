import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { AuthProvider } from '../enums/auth-provider.enum';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('oauth.facebook.appId') || '',
      clientSecret: configService.get<string>('oauth.facebook.appSecret') || '',
      callbackURL:
        configService.get<string>('oauth.facebook.callbackUrl') || '',
      scope: ['email'],
      profileFields: ['emails', 'name', 'photos'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: unknown) => void,
  ): Promise<void> {
    const { id, emails, name, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      done(
        new UnauthorizedException('Tài khoản Facebook không cung cấp email'),
        undefined,
      );
      return;
    }

    const oauthProfile = {
      provider: AuthProvider.FACEBOOK,
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

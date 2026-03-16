import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.PRODUCTION_URL}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      accessToken,
      refreshToken,
      provider_id: profile.id,
      username: profile.username,
      email: profile.emails?.[0]?.value,
      avatar:
        profile?.photos && profile.photos.length > 0
          ? profile.photos[0].value
          : null,
      name: profile.displayName,
      provider: 'github',
    };
  }
}

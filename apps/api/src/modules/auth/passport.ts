import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { env } from '../../config/env';
import { findOrCreateOAuthUser } from './oauth.service';

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const userTokens = await findOrCreateOAuthUser({
            provider: 'google',
            oauthId: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            username: profile.displayName || profile.username || 'GoogleUser',
            avatarUrl: profile.photos?.[0]?.value,
          });
          done(null, userTokens);
        } catch (error) {
          done(error);
        }
      },
    ),
  );
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_CALLBACK_URL) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.find((e: any) => e.primary)?.value || profile.emails?.[0]?.value || '';
          const userTokens = await findOrCreateOAuthUser({
            provider: 'github',
            oauthId: profile.id,
            email: email,
            username: profile.username || profile.displayName || 'GitHubUser',
            avatarUrl: profile.photos?.[0]?.value,
          });
          done(null, userTokens);
        } catch (error) {
          done(error);
        }
      },
    ),
  );
}

export default passport;

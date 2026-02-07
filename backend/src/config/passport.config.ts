import { PassportStatic } from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model';

export const configurePassport = (passport: PassportStatic) => {
  // JWT Strategy
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production');
  }
  const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_' + Date.now();
  if (!process.env.JWT_SECRET) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  JWT_SECRET not set — using random development fallback (tokens will not persist across restarts)');
  }

  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
  };

  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const user = await User.findById(payload.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          passReqToCallback: true,
        },
      async (req, _accessToken, _refreshToken, profile, done) => {
          try {
            const tenant = (req as any).tenant || 'default';
            
            let user = await User.findOne({
              'oauth.google': profile.id,
              tenant,
            });

            if (!user) {
              user = await User.findOne({
                email: profile.emails?.[0].value,
                tenant,
              });

              if (user) {
                user.oauth.google = profile.id;
                user.isVerified = true;
                await user.save();
              } else {
                user = await User.create({
                  email: profile.emails?.[0].value,
                  firstName: profile.name?.givenName || '',
                  lastName: profile.name?.familyName || '',
                  avatar: profile.photos?.[0].value,
                  oauth: { google: profile.id },
                  isVerified: true,
                  tenant,
                });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  }
};

const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user || !user.password) return done(null, false, { message: 'Invalid email or password.' });

        const passwordMatches = await user.matchPassword(password);
        if (!passwordMatches) return done(null, false, { message: 'Invalid email or password.' });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || 'missing-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing-client-secret',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(null, false, { message: 'Google account has no public email.' });

          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });
          if (user) {
            user.googleId = user.googleId || profile.id;
            user.profileImage = profile.photos?.[0]?.value || user.profileImage;
            await user.save();
            return done(null, user);
          }

          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            profileImage: profile.photos?.[0]?.value,
            role: req.session.oauthRole === 'teacher' ? 'teacher' : 'student',
            teacherStatus: req.session.oauthRole === 'teacher' ? 'pending' : 'none',
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      done(null, await User.findById(id));
    } catch (error) {
      done(error);
    }
  });
};

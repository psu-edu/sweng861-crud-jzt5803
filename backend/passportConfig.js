const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('./database');

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ where: { googleId: profile.id } });

          if (!user) {
            // Check if user exists by email (optional, depends on policy)
            const email =
              profile.emails && profile.emails[0]
                ? profile.emails[0].value
                : null;
            if (email) {
              user = await User.findOne({ where: { email } });
            }

            if (user) {
              // Link existing user to Google Account
              user.googleId = profile.id;
              await user.save();
            } else {
              // Create new user
              user = await User.create({
                googleId: profile.id,
                username: profile.displayName, // or email
                email: email,
                role: 'user',
              });
            }
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log('[Auth] Google OAuth strategy configured');
} else {
  console.log(
    '[Auth] Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)'
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

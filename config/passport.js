const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model');

// Kiểm tra biến môi trường
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  WARNING: Google OAuth credentials not configured!');
  console.warn('⚠️  Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
} else {
  console.log('✓ Google OAuth configured');
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra user đã tồn tại
        let user = await User.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: profile.emails[0].value }
          ],
          deleted: false 
        });

        if (user) {
          // Cập nhật googleId nếu chưa có
          if (!user.googleId) {
            user = await User.findByIdAndUpdate(
              user._id,
              { googleId: profile.id, authProvider: 'google' },
              { new: true }
            );
          }
          return done(null, user);
        }

        // Tạo user mới - KHÔNG CÓ PASSWORD
        const newUser = await new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          fullName: profile.displayName,
          avatar: profile.photos[0]?.value,
          authProvider: 'google',
          status: 'active'
          // Không set password ở đây
        }).save();

        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  ));
}

module.exports = passport;
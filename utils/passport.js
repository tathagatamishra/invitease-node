// utils/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/userModel');

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const u = await User.findById(id);
    done(null, u);
  } catch (err) {
    done(err);
  }
});

/* GOOGLE */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_ORIGIN}/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      // get photo if available
      const photoUrl = profile.photos && profile.photos[0] && profile.photos[0].value;

      // try to find by oauth entry first, then by email
      let user = await User.findOne({ 'oauth.provider': 'google', 'oauth.providerId': profile.id });
      if (!user && email) user = await User.findOne({ email });
      if (!user) {
        // create new user and save profile image if available
        user = new User({
          fullName: profile.displayName || email,
          email,
          loginMethods: ['google'],
          oauth: [{ provider: 'google', providerId: profile.id }],
          verified: true,
          role: 'sender',
          profileImage: photoUrl || undefined
        });
        await user.save();
      } else {
        // ensure oauth entry exists
        const existsOauth = (user.oauth || []).some(o => o.provider === 'google' && o.providerId === profile.id);
        if (!existsOauth) {
          user.oauth = user.oauth || [];
          user.oauth.push({ provider: 'google', providerId: profile.id });
        }
        // update profileImage if Google provides one and user doesn't already have a profileImage
        if (photoUrl && (!user.profileImage || user.profileImage.indexOf('googleusercontent') !== -1)) {
          user.profileImage = photoUrl;
        }
        // if user email is missing but Google provides, set it
        if (email && !user.email) user.email = email;
        await user.save();
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

/* FACEBOOK */
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_ORIGIN}/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'emails']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      let user = await User.findOne({ 'oauth.provider': 'facebook', 'oauth.providerId': profile.id });
      if (!user && email) user = await User.findOne({ email });
      if (!user) {
        user = new User({
          fullName: profile.displayName || email,
          email,
          loginMethods: ['facebook'],
          oauth: [{ provider: 'facebook', providerId: profile.id }],
          verified: true,
          role: 'sender'
        });
        await user.save();
      } else {
        const exists = (user.oauth || []).some(o => o.provider === 'facebook' && o.providerId === profile.id);
        if (!exists) {
          user.oauth = user.oauth || [];
          user.oauth.push({ provider: 'facebook', providerId: profile.id });
          await user.save();
        }
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

/* LINKEDIN */
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_ORIGIN}/auth/linkedin/callback`,
    scope: ['r_liteprofile', 'r_emailaddress']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      let user = await User.findOne({ 'oauth.provider': 'linkedin', 'oauth.providerId': profile.id });
      if (!user && email) user = await User.findOne({ email });
      if (!user) {
        user = new User({
          fullName: profile.displayName || email,
          email,
          loginMethods: ['linkedin'],
          oauth: [{ provider: 'linkedin', providerId: profile.id }],
          verified: true,
          role: 'sender'
        });
        await user.save();
      } else {
        const exists = (user.oauth || []).some(o => o.provider === 'linkedin' && o.providerId === profile.id);
        if (!exists) {
          user.oauth = user.oauth || [];
          user.oauth.push({ provider: 'linkedin', providerId: profile.id });
          await user.save();
        }
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

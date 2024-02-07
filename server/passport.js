module.exports = (oauth_config, db, logger) => {

// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const GitHubStrategy = require('passport-github2').Strategy;
const passport = require('passport');


// passport.use(new GitHubStrategy({
//   clientID: oauth_config.github.clientId,
//   clientSecret: oauth_config.github.clientSecret,
//   scope:['user:email'],
//   callbackURL: "/api/auth/github/callback"
// },
// function(accessToken, refreshToken, profile, cb) {
//   const register_handler = (err, profile) =>{
//     if(err){
//       logger.error(err)
//       return done(err)
//     }
//     return done(null, profile)
//   };
  
//   const email = profile.emails[0].value;
//   db.registerOrLoginUser(email, register_handler);
//   done(null,profile);
//   // TODO: find a way to determine whether user is opt-in or not
//   // TODO: and then register user as normal user or guest base on that
//   // db.registerGuest(register_handler);
// }
// ));

// passport.use(new GoogleStrategy({
//     clientID: oauth_config.google.clientId,
//     clientSecret: oauth_config.google.clientSecret,
//     callbackURL: "/api/auth/google/callback",
//     passReqToCallback: true
//   },
//   function(req, accessToken, refreshToken, profile, done) {
//     const register_handler = (err, jwtToken) =>{
//       if(err){
//         logger.error(err);
//         return done(err);
//       }
//       logger.info("strat jwt:", jwtToken)
//       return done(null, jwtToken);
//     };
    
//     // console.log('access token', accessToken)
//     // console.log('refresh token', refreshToken)
//     const email = profile.emails[0].value;
//     db.registerOrLoginUser(email, register_handler);
//     // TODO: find a way to determine whether user is opt-in or not
//     // TODO: and then register user as normal user or guest base on that
//     // db.registerGuest(register_handler);
//   }
// ));


passport.serializeUser(function(user, done) {
  logger.info(user, "has been authorized")
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

return passport;

}
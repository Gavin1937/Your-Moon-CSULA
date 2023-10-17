module.exports = (oauth_config, db, logger) => {

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const passport = require('passport');


passport.use(new GitHubStrategy({
  clientID: oauth_config.github.clientId,
  clientSecret: oauth_config.github.clientSecret,
  scope:['user:email'],
  callbackURL: "/api/auth/github/callback"
},
function(accessToken, refreshToken, profile, cb) {
  const email = profile.emails[0].value;
  db.registerOrLoginUser(email, (err, profile) =>{
    if(err){
      logger.error(err)
      return done(err)
    }
    return done(null, profile)
  })
  done(null,profile)
}
));

passport.use(new GoogleStrategy({
    clientID: oauth_config.google.clientId,
    clientSecret: oauth_config.google.clientSecret,
    callbackURL: "/api/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    const email = profile.emails[0].value;
    db.registerOrLoginUser(email, (err, jwtToken) =>{
      if(err){
        logger.error(err);
        return done(err);
      }
      logger.info("strat jwt:", jwtToken)
      return done(null, jwtToken);
    });
  }
));


passport.serializeUser(function(user, done) {
  logger.info(user, "has been authorized")
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

return passport;

}
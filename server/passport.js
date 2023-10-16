require('dotenv').config();
var config = null;
if (process.env.NODE_ENV === "production") {
	config = require("./config/production.config.json");
} else {
	config = require("./config/dev.config.json");
}


const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const passport = require('passport');
//const crypto = require("crypto");
const DBManager = require('./DBManager.js');
var logger = require('./logger.js')(config.log_file, config.log_level);
var db = new DBManager(config.db, config.aes_key, config.jwt_secret, logger);




passport.use(new GitHubStrategy({
  clientID: config.oauth.github.clientId,
  clientSecret: config.oauth.github.clientSecret,
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
    clientID: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
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

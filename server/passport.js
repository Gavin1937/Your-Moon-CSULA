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
var db = new DBManager(config.db, logger);

console.log(config.oauth.google)



passport.use(new GitHubStrategy({
  clientID: config.oauth.github.clientId,
  clientSecret: config.oauth.github.clientSecret,
  scope:['user:email'],
  callbackURL: "/api/auth/github/callback"
},
function(accessToken, refreshToken, profile, cb) {
  const email = profile.emails[0].value;
//   console.log(email)
//  done(null,profile)
  db.findOrAddUserByEmail(email);
}
));

passport.use(new GoogleStrategy({
    clientID: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
    callbackURL: "/api/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
    const email = profile.emails[0].value;
    db.findOrAddUserByEmail(email, (err, profile) =>{
      if(err){
        logger.error(err)
        return done(err)
      }
      return done(null, profile)
    })
    // console.log('Email : '+ profile.emails[0].value);
    done(null,profile)
  }
));

// function encryptEmail(email) {
//   const iv = crypto.randomBytes(16);
//   const key = crypto.createHash('sha256')
//     .update(String(process.env['SECRET'])).digest();
//   // console.log(key)
//   const cipher = crypto.createCipheriv(process.env['ENCRYPTION_ALGORITHM'], Buffer.from(key), iv);
//   let encrypted = cipher.update(email);
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   return iv.toString('hex') + ':' + encrypted.toString('hex');
// }



// passport.serializeUser((user,done) =>{
//   // console.log(user)
//   // // console.log()
//   // // done(null,user)
//   // process.nextTick(() => {
//   //   return cb(null, user.email);
//   // });
//   console.log(user)
//   done(null, user.user_email)
// })

// passport.deserializeUser((email,done) => {
//   db.query('SELECT * FROM Users WHERE user_email = ?', email, (err, user) =>{
//     if(err) {
//       console.log(err)
//       return done(err)
//     }
//     return done(null,user)
//   } )
// })

passport.serializeUser(function(user, done) {
  logger.info(user, "has been authorized")
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const passport = require('passport');
const mysql = require("mysql2");
const crypto = require("crypto");
const db = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  port: 3306,
  user: "root",
  password: "loona",
  database: "YourMoonDB"
});


passport.use(new GitHubStrategy({
  clientID: process.env['GITHUB_CLIENT_ID'],
  clientSecret: process.env['GITHUB_CLIENT_SECRET'],
  scope:['user:email'],
  callbackURL: "/auth/github/callback"
},
function(accessToken, refreshToken, profile, cb) {
  const email = profile.emails[0].value;
//   console.log(email)
//  done(null,profile)
findOrCreateUserFromEmail(email, (err, profile) =>{
  if(err){
    return cb(err)
  }
  return cb(null, profile)
})
}
));

passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: "/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
    const email = profile.emails[0].value;
    findOrCreateUserFromEmail(email, (err, profile) =>{
      if(err){
        console.log(err)
        return done(err)
      }
      return done(null, profile)
    })
    // console.log('Email : '+ profile.emails[0].value);
    // done(null,profile)
  }
));

 function findOrCreateUserFromEmail(email, done){
  // const encryptedEmail = encryptEmail(email);
  const sqlSearch = 'SELECT * FROM Users WHERE user_email = ?'
  const sqlInsert = 'INSERT INTO Users (user_email) VALUES (?)'
  
  try{
  db.query(sqlSearch, email, (err, row) => {
    if(err) {
      console.log("DB error occurred")
      return done(err)
    }
    else if(row.length == 1){
      return done(null, row);
    }
    else{
      db.query(sqlInsert,email, (err,row) =>{
        if(err){
           console.log("DB error")
           return done(err)
        }
        
        else{ 
          return done(null, row);
        }
      })
    }

  })
  }catch(err){
    console.log(err)
  }
}

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
  console.log(user)
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

module.exports = (logger) => {
  const passport = require("passport");

  passport.serializeUser(function (user, done) {
    logger.info(user, "has been authorized");
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  return passport;
};

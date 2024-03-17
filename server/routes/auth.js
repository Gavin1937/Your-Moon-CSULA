module.exports = (db, logger, config) => {
  const router = require("express").Router();
  const passport = require("passport");
  const GoogleStrategy = require("passport-google-oauth20").Strategy;
  const GitHubStrategy = require("passport-github2").Strategy;

  // https://stackoverflow.com/a/20341863
  // setup Strategy when we receive a request to /api/auth/google
  // in this way we can access request query in the strategy callback

  var google_setup_strategy = function () {
    return function (req, res, next) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: config.oauth.google.clientId,
            clientSecret: config.oauth.google.clientSecret,
            callbackURL: "/api/auth/google/callback",
          },
          function (accessToken, refreshToken, profile, done) {
            process.nextTick(function () {
              const register_handler = (err, jwtToken) => {
                if (err) {
                  logger.error(err);
                  return done(err);
                }
                logger.info("strat jwt:", jwtToken);
                return done(null, jwtToken);
              };

              const email = profile.emails[0].value;
              // console.log(req.query.isOptIn)
              if (req.query.isOptIn === "true")
                db.registerOrLoginUser(email, register_handler);
              else if (req.query.isOptIn === "false")
                db.registerGuest(register_handler);
              else res.status(400);
            });
          }
        )
      );

      next();
    };
  };

  var github_setup_strategy = function () {
    return function (req, res, next) {
      passport.use(
        new GitHubStrategy(
          {
            clientID: config.oauth.github.clientId,
            clientSecret: config.oauth.github.clientSecret,
            callbackURL: "/api/auth/github/callback",
            scope: ["user:email"],
          },
          function (accessToken, refreshToken, profile, done) {
            process.nextTick(function () {
              const register_handler = (err, jwtToken) => {
                if (err) {
                  logger.error(err);
                  return done(err);
                }
                logger.info("strat jwt:", jwtToken);
                return done(null, jwtToken);
              };

              const email = profile.emails[0].value;

              if (req.query.isOptIn === "true")
                db.registerOrLoginUser(email, register_handler);
              else if (req.query.isOptIn === "false")
                db.registerGuest(register_handler);
              else res.status(400);
            });
          }
        )
      );

      next();
    };
  };

  router.get(
    "/google",
    google_setup_strategy(),
    passport.authenticate("google", {
      scope: ["email"],
    })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    function (req, res) {
      res.cookie("token", req.user, {
        secure: true,
        maxAge: 2 * 24 * 60 * 60 * 1000,
      });
      res.redirect(
        (config.frontend_url ? config.frontend_url : "") + "/authenticate"
      );
    }
  );

  router.get(
    "/github",
    github_setup_strategy(),
    passport.authenticate("github", { scope: ["user:email"] })
  );

  router.get(
    "/github/callback",
    passport.authenticate("github", { failureRedirect: "/" }),
    function (req, res) {
      res.cookie("token", req.user, {
        secure: true,
        maxAge: 2 * 24 * 60 * 60 * 1000,
      });
      res.redirect(
        (config.frontend_url ? config.frontend_url : "") + "/authenticate"
      );
    }
  );

  router.get("/login/success", (req, res) => {
    if (req.user) {
      res.status(200).json({
        user: req.user,
      });
    }
  });

  router.get("login/failed", (req, res) => {
    res.status(401).json({
      message: "login failed",
    });
  });

  return router;
};

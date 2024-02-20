require("dotenv").config();
var config = null;
if (process.env.NODE_ENV === "production") {
  config = require("./config/production.config.json");
} else {
  config = require("./config/dev.config.json");
}
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const DBManager = require("./DBManager.js");
var logger = require("./logger.js")(config.log_file, config.log_level);
var db = new DBManager(
  config.db,
  config.aes_key,
  config.jwt_secret,
  config.jobtable,
  logger
);
const upload = require("./multerSetup.js")(
  (('aws' in config && config['aws']) ? 's3' : 'native'),
  config,
  logger
);
const CryptoJS = require("crypto-js");
const passport = require("./passport.js")(logger);
const session = require("express-session");
const { rateLimit } = require("express-rate-limit");
const authRoutes = require("./routes/auth.js")(db, logger, config);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(express.json());

app.use(
  session({
    // express-session needs a secret for signing sessions with HMAC
    // we use a session_key from config file to ensure its security
    secret: CryptoJS.enc.Base64.parse(config.session_key).toString(
      CryptoJS.enc.Hex
    ),
    resave: false,
    saveUninitialized: false,
    // TODO: change this for production
    // https://stackoverflow.com/a/40324493
    cookie: { secure: false },
  })
);

// add rate limiting to endpoints
const limiter = rateLimit({
  windowMs: config.rate_limit.windowMs,
  limit: config.rate_limit.limit,
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // TODO: use RedisStore for rateLimiting
  // reference: https://github.com/express-rate-limit/express-rate-limit/blob/main/test/external/stores/source/redis-store.ts
  // store: ... , // Use an external store for consistency across multiple server instances.
});
app.use(limiter);
// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// https://expressjs.com/en/guide/behind-proxies.html
// https://express-rate-limit.mintlify.app/reference/error-codes#err-erl-unexpected-x-forwarded-for
app.set('trust proxy', 1);

app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    credentials: true,
    origin: config.cors_origin_whitelist,
  })
);
app.use(cookieParser());
app.use("/api/auth", authRoutes);

function uploadHandler(next) {
  // outer function takes in "next" request handler
  return function (req, res) {
    // logger.debug(`uploadHandler inner func res: ${JSON.stringify(res)}`);
    // returns a request handler uses "next" inside
    upload.single("lunarImage")(req, res, function (error) {
      // MulterError handler function
      logger.debug(`req.file: ${JSON.stringify(req.file, null, 2)}`);
      if (
        (error && error.code == "LIMIT_FILE_SIZE") ||
        req.file.size > config.max_upload_size
      ) {
        logger.warn("IMAGE IS TOO BIG!");
        res.status(413).json({
          status: "UPLOAD FAILED ! ❌",
          message: `IMAGE IS TOO BIG!, UPLOAD LIMIT IS: ${config.max_upload_size}`,
        });
      } else {
        if (!req.file) {
          res.status(404).json({
            status: "UPLOAD FAILED ! ❌",
            message: "FILE NOT FOUND",
          });
        }
        next(req, res); // calls "next" request handler if no error in Multer part
      }
    });
  };
}

//! If we eventually decide to use AWS S3, we should remove/modify this endpoint
// upload picture file (file upload only)
app.post(
  "/api/picUpload",
  uploadHandler((req, res) => {
    // pass upload & db handler as "next" function
    try {
      logger.debug(`req.cookies: ${JSON.stringify(req.cookies, null, 2)}`);
      logger.debug(`req.headers: ${JSON.stringify(req.headers, null, 2)}`);
      // backend will take jwt from either cookies.token or headers.authorization
      let jwt_token =
        Object.keys(req.cookies).length <= 0
          ? req.headers.authorization
          : req.cookies.token;
      if (!jwt_token || jwt_token.length <= 0) {
        logger.warn("UNAUTHORIZED ACCESS!");
        res.status(401).json({
          status: "UNAUTHORIZED ACCESS!",
          message: "Please login to access this endpoint.",
        });
        return;
      }
      db.verifyUserJWT(jwt_token, (error, result) => {
        logger.debug(`result: ${JSON.stringify(result, null, 2)}`);
        logger.debug(`error: ${JSON.stringify(error, null, 2)}`);
        if (error) {
          logger.error(`error:\n${error}`);
          res.status(401).json({
            status: "VERIFY FAILED ! ❌",
            message: error.toString(),
          });
        } else {
          logger.info("VERIFIED USER!");
          const is_guest_user = (result.user_type === 'guest');
          logger.debug(`is_guest_user: ${is_guest_user}`);
          const imgFile = req.file; // gets the file that is uploaded from the client
          logger.debug(`imgFile:\n${JSON.stringify(imgFile, null, 2)}`); // testing purposes to see some info of the file

          // additional size check
          if (imgFile.size > config.max_upload_size) {
            logger.warn("IMAGE IS TOO BIG!");
            res.status(413).json({
              status: "UPLOAD FAILED ! ❌",
              message: `IMAGE IS TOO BIG!, UPLOAD LIMIT IS: ${config.max_upload_size}`,
            });
          }

          const { upload_uuid } = req.query;

          logger.info(`upload_uuid: ${upload_uuid}`);

          const imageName = req.file.originalname; // name of the image file
          const imageType = req.file.mimetype; // type of the image file
          const path = req.file.path; // gets the buffer

          logger.debug(`NAME: ${imageName}`);
          logger.debug(`IMAGE TYPE: ${imageType}`);
          logger.debug(`path: ${path}`);

          // rm job from the queue
          db.finishUploadJob(is_guest_user, upload_uuid, 1, 0, (error2, result2) => {
            if (error2) {
              logger.error("THERE HAS BEEN AN ERROR UPLOADING THE IMAGE!");
              logger.error(`error2:\n${error2.toString()}`);
              res.status(400).json({
                status: "UPLOAD FAILED ! ❌",
                message: error2.toString(),
              });
            } else {
              logger.info("IMAGE UPLOAD SUCCESSFULLY!");
              // upload success, save file
              res.status(200).json({
                status: "UPLOAD SUCCESSFUL ! ✔️",
              });
            }
          });
        }
      });
    } catch (error) {
      logger.error(`Exception:\n${error.stack}`);
      res.status(500).json({
        status: "UPLOAD FAILED ! ❌",
        message: "Internal Server Error",
      });
    }
  })
);

// upload picture metadata
app.post("/api/picMetadata", (req, res) => {
  try {
    logger.debug("In picMetadata");
    logger.debug(`req.body:`);
    logger.debug(JSON.stringify(req.body));

    logger.debug(`req.cookies: ${JSON.stringify(req.cookies, null, 2)}`);
    logger.debug(`req.headers: ${JSON.stringify(req.headers, null, 2)}`);
    // backend will take jwt from either cookies.token or headers.authorization
    let jwt_token =
      Object.keys(req.cookies).length <= 0
        ? req.headers.authorization
        : req.cookies.token;
    if (!jwt_token || jwt_token.length <= 0) {
      logger.warn("UNAUTHORIZED ACCESS!");
      res.status(401).json({
        status: "UNAUTHORIZED ACCESS!",
        message: "Please login to access this endpoint.",
      });
      return;
    }

    db.verifyUserJWT(jwt_token, (error, result) => {
      logger.debug(`result: ${JSON.stringify(result, null, 2)}`);
      logger.debug(`error: ${JSON.stringify(error, null, 2)}`);
      if (error) {
        logger.error(`error:\n${error}`);
        res.status(401).json({
          status: "VERIFY FAILED ! ❌",
          message: error.toString(),
        });
      } else {
        logger.info("VERIFIED USER!");
        db.addImage(
          req.body.instrument,
          req.body.image,
          req.body.moon,
          (error2, result2) => {
            logger.debug(`result2: ${JSON.stringify(result2, null, 2)}`);
            logger.debug(`error2: ${JSON.stringify(error2, null, 2)}`);
            if (error2) {
              logger.error("THERE HAS BEEN AN ERROR INSERTING THE IMAGE!");
              res.status(500).json({
                status: "UPLOAD FAILED ! ❌",
                message: "THERE HAS BEEN AN ERROR INSERTING THE IMAGE!",
              });
            } else {
              logger.info("IMAGE METADATA INSERTED SUCCESSFULLY!");

              // TODO: use redis for this job queue
              db.registerUploadJob(
                config.upload_job_expire,
                result.user_id,
                (error3, result3) => {
                  if (result3 == null) {
                    res.status(400).json({
                      status: "UPLOAD FAILED ! ❌",
                      message: error3.toString(),
                    });
                  } else {
                    res.status(200).json({
                      status: "UPLOAD SUCCESSFUL ! ✔️",
                      upload_uuid: result3.upload_uuid,
                      expires: result3.expires,
                      // TODO: response with credentials for picture file upload
                    });
                  }
                }
              );
            }
          }
        );
      }
    });
  } catch (error) {
    logger.error(`Exception:\n${error.stack}`);
    res.status(500).json({
      status: "UPLOAD FAILED ! ❌",
      message: "Internal Server Error",
    });
  }
});

app.get("/api/verifyUser", (req, res) => {
  try {
    logger.debug("In verifyUser");
    logger.debug(`req.body: ${JSON.stringify(req.body)}`);

    // user_jwt is inside http header: authorization
    let user_jwt = req.cookies.token;
    logger.debug(`user_jwt: ${user_jwt}`);

    db.verifyUserJWT(user_jwt, (error, result) => {
      logger.debug(`result: ${JSON.stringify(result, null, 2)}`);
      logger.debug(`error: ${JSON.stringify(error, null, 2)}`);
      if (error) {
        logger.error(`error:\n${error}`);
        res.status(401).json({
          status: "VERIFY FAILED ! ❌",
          message: error.toString(),
        });
      } else {
        logger.info("VERIFIED USER!");
        res.status(200).json({
          status: "VERIFY SUCCESS ! ✔️",
          verified: result.ok,
          user_type: result.user_type,
        });
      }
    });
  } catch (error) {
    logger.error(`Exception:\n${error.stack}`);
    res.status(500).json({
      status: "UPLOAD FAILED ! ❌",
      message: "Internal Server Error",
    });
  }
});

//! Users should only register account using OAuth
//! Once OAuth is done, we should remove this endpoint
//! For now, lets disable this endpoint in production
if (process.env.NODE_ENV !== "production") {
  // Authenticate or Register User
  // This endpoint can handle both regular user and guest user
  // Just add a new field `{"guest_user":true}` to the request body
  // and you will register as a guest
  app.post("/api/authUser", (req, res) => {
    try {
      logger.debug("In authUser");
      logger.debug(`req.body:`);
      logger.debug(JSON.stringify(req.body));

      // TODO: retrieve email from OAuth 2.0
      let { guest_user, user_email } = req.body;
      guest_user = Boolean(guest_user);
      logger.debug(`guest_user: ${guest_user}`);
      logger.debug(`user_email: ${user_email}`);

      const register_handler = (error, result) => {
        logger.debug(`result: ${JSON.stringify(result, null, 2)}`);
        logger.debug(`error: ${JSON.stringify(error, null, 2)}`);
        if (error) {
          logger.error(`error:\n${error}`);
          let message = null;
          if (error) {
            message = "FAILED TO REGISTER OR LOGIN USER";
          }
          res.status(400).json({
            status: "REGISTER OR LOGIN FAILED ! ❌",
            message: message,
          });
          logger.error(message);
        } else {
          // response with jwt
          res.status(200).json(result);
        }
      };

      if (!guest_user && user_email.length > 0) {
        db.registerOrLoginUser(user_email, register_handler);
      } else if (guest_user) {
        db.registerGuest(register_handler);
      }
    } catch (error) {
      logger.error(`Exception:\n${error.stack}`);
      res.status(500).json({
        status: "SERVER FAILED ! ❌",
        message: "Internal Server Error",
      });
    }
  });
}

// running on port 3001 currently
app.listen(config.app_port, () => {
  // start up
  logger.info(`Start server on port: ${config.app_port}`);
  logger.info(`Logging Level: ${config.log_level}`);
  logger.info(`Save log file to:\n${config.log_file}`);
});

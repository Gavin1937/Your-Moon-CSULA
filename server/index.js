require('dotenv').config();
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
const DBManager = require('./DBManager.js');
var logger = require('./logger.js')(config.log_file, config.log_level);
var db = new DBManager(config.db, config.aes_key, config.jwt_secret, logger);
const upload = require('./multerSetup.js')(process.env.STORAGE_METHOD, config, logger);
const CryptoJS = require("crypto-js");
const passport = require("./passport.js")(config.oauth, db, logger);
const session = require('express-session');
const authRoutes = require("./routes/auth");


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(express.json());

app.use(session({
	// express-session needs a secret for signing sessions with HMAC
	// we use a session_key from config file to ensure its security
	secret: CryptoJS.enc.Base64.parse(config.session_key).toString(CryptoJS.enc.Hex),
	resave: false,
	saveUninitialized: false,
	cookie: { secure: false }
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(cors({
	credentials: true,
	origin: config.cors_origin_whitelist
}));
app.use(cookieParser());
app.use("/api/auth", authRoutes)



function uploadHandler(next) { // outer function takes in "next" request handler
	return function (req, res) { // returns a request handler uses "next" inside
		upload.single("lunarImage")(req, res, function (error) { // MulterError handler function
			logger.debug(`req.file: ${JSON.stringify(req.file, null, 2)}`);
			if (error && error.code == 'LIMIT_FILE_SIZE' || req.file.size > config.max_upload_size) {
				logger.warn("IMAGE IS TOO BIG!");
				res.status(413).json({
					status: "UPLOAD FAILED ! ❌",
					message: `IMAGE IS TOO BIG!, UPLOAD LIMIT IS: ${config.max_upload_size}`,
				});
			}
			else {
				if (!req.file) {
					res.status(404).json({
						status: "UPLOAD FAILED ! ❌",
						message: "FILE NOT FOUND"
					});
				}
				next(req, res); // calls "next" request handler if no error in Multer part
			}
		});
	};
}

//! If we eventually decide to use AWS S3, we should remove this endpoint
// upload picture file (file upload only)
app.post("/api/picUpload", uploadHandler((req, res) => { // pass upload & db handler as "next" function
	try {
		logger.debug(`req.cookies: ${JSON.stringify(req.cookies,null,2)}`);
		logger.debug(`req.headers: ${JSON.stringify(req.headers,null,2)}`);
		// backend will take jwt from either cookies.token or headers.authorization
		let jwt_token = Object.keys(req.cookies).length <= 0 ? req.headers.authorization : req.cookies.token;
		if (!jwt_token || jwt_token.length <= 0) {
			logger.warn("UNAUTHORIZED ACCESS!");
			res.status(401).json({
				status: "UNAUTHORIZED ACCESS!",
				message: "Please login to access this endpoint.",
			})
			return;
		}
		db.verifyUserJWT(jwt_token, (error, result) => {
            logger.debug(`result: ${JSON.stringify(result,null,2)}`);
            logger.debug(`error: ${JSON.stringify(error,null,2)}`);
			if (error) {
				logger.error(`error:\n${error}`);
				res.status(400).json({
					status: "VERIFY FAILED ! ❌",
					message: error.toString(),
				});
			}
			else {
				logger.info("VERIFIED USER!");
				const imgFile = req.file;	// gets the file that is uploaded from the client
				logger.debug(`imgFile:\n${JSON.stringify(imgFile, null, 2)}`);	// testing purposes to see some info of the file
				
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
				
				logger.info(`NAME: ${imageName}`);
				logger.info(`IMAGE TYPE: ${imageType}`);
				logger.info(`path: ${path}`);
				
				// rm job from the queue
				db.finishUploadJob(upload_uuid, 1, 0, (error2, result2) => {
					if (error2) {
						logger.error("THERE HAS BEEN AN ERROR UPLOADING THE IMAGE!");
						logger.error(`error2:\n${error2.toString()}`);
						res.status(400).json({
							status: "UPLOAD FAILED ! ❌",
							message: error2.toString(),
						});
					}
					else {
						// upload success, save file
						res.status(200).json({
							status: "UPLOAD SUCCESSFUL ! ✔️"
						})
					}
				});
			}
		});
	}
	catch (error) {
		logger.error(`Exception:\n${error.stack}`);
		res.status(500).json({
			status: "UPLOAD FAILED ! ❌",
			message: "Internal Server Error",
		});
	}
}));

// upload picture metadata
app.post("/api/picMetadata", (req, res) => {
	try {
		logger.info("In picMetadata");
		logger.debug(`req.body:`);
		logger.debug(JSON.stringify(req.body));
		
		logger.debug(`req.cookies: ${JSON.stringify(req.cookies,null,2)}`);
		logger.debug(`req.headers: ${JSON.stringify(req.headers,null,2)}`);
		// backend will take jwt from either cookies.token or headers.authorization
		let jwt_token = Object.keys(req.cookies).length <= 0 ? req.headers.authorization : req.cookies.token;
		if (!jwt_token || jwt_token.length <= 0) {
			logger.warn("UNAUTHORIZED ACCESS!");
			res.status(401).json({
				status: "UNAUTHORIZED ACCESS!",
				message: "Please login to access this endpoint.",
			})
			return;
		}
		
		db.verifyUserJWT(jwt_token, (error, result) => {
            logger.debug(`result: ${JSON.stringify(result,null,2)}`);
            logger.debug(`error: ${JSON.stringify(error,null,2)}`);
			if (error) {
				logger.error(`error:\n${error}`);
				res.status(400).json({
					status: "VERIFY FAILED ! ❌",
					message: error.toString(),
				});
			}
			else {
				logger.info("VERIFIED USER!");
				db.addImage(req.body.instrument, req.body.image, req.body.moon, (error2, result2) => {
					logger.debug(`result2: ${JSON.stringify(result2,null,2)}`);
					logger.debug(`error2: ${JSON.stringify(error2,null,2)}`);
					if (error2) {
						logger.error("THERE HAS BEEN AN ERROR INSERTING THE IMAGE!");
						res.status(500).json({
							status: "UPLOAD FAILED ! ❌",
							message: "THERE HAS BEEN AN ERROR INSERTING THE IMAGE!",
						});
					}
					else {
						logger.info("Successfully inserted into the YourMoonDB!");
						logger.info("IMAGE INSERTED SUCCESSFULLY!");
						
						// TODO: use redis for this job queue
						db.registerUploadJob(config.upload_job_expire, 1, (error3, result3) => {
							if (result3 == null) {
								res.status(400).json({
									status: "UPLOAD FAILED ! ❌",
									message: error3.toString(),
								});
							}
							else {
								res.status(200).json({
									status: "UPLOAD SUCCESSFUL ! ✔️",
									upload_uuid: result3.upload_uuid,
									expires: result3.expires,
									// TODO: response with credentials for picture file upload
								});
							}
						});
					}
				});
			}
		});
	}
	catch (error) {
		logger.error(`Exception:\n${error.stack}`);
		res.status(500).json({
			status: "UPLOAD FAILED ! ❌",
			message: "Internal Server Error",
		});
	}
});

app.get("/api/emailAESKey", (req, res) => {
	try {
		logger.info("In emailAESKey");
		logger.debug(`req.body:`);
		logger.debug(JSON.stringify(req.body));
		
		db.registerUserRegistrationJob(300, (error, result) => {
            logger.debug(`result: ${JSON.stringify(result,null,2)}`);
            logger.debug(`error: ${JSON.stringify(error,null,2)}`);
			if (error) {
				logger.error(`error:\n${error}`);
				res.status(400).json({
					status: "KEY GENERATION FAILED ! ❌",
					message: error.toString(),
				});
			}
			else {
				res.status(200).json({
					status: "NEW AES KEY",
					...result
				});
			}
		})
	}
	catch (error) {
		logger.error(`Exception:\n${error.stack}`);
		res.status(500).json({
			status: "KEY GENERATION FAILED ! ❌",
			message: "Internal Server Error",
		});
	}
})

app.post("/api/authUser", (req, res) => {
	try {
		logger.info("In authUser");
		logger.debug(`req.body:`);
		logger.debug(JSON.stringify(req.body));
		
		// TODO: retrieve email from OAuth 2.0
		const { user_email, uuid } = req.body;
		logger.debug(`user_email: ${user_email}`);
		logger.debug(`uuid: ${uuid}`);
		
		db.finishUserRegistrationJob(uuid, user_email, (error, result) => {
            logger.debug(`result: ${JSON.stringify(result,null,2)}`);
            logger.debug(`error: ${JSON.stringify(error,null,2)}`);
			if (error) {
				res.status(400).json({
					status: "REGISTER OR LOGIN FAILED ! ❌",
					message: "FAILED TO DECRYPT EMAIL",
				});
				return;
			}
			else {
				db.registerOrLoginUser(result.user_email, (error, result) => {
					logger.debug(`result: ${JSON.stringify(result,null,2)}`);
					logger.debug(`error: ${JSON.stringify(error,null,2)}`);
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
					}
					else {
						// response with jwt
						res.status(200).json(result);
					}
				});
			}
		});
	}
	catch (error) {
		logger.error(`Exception:\n${error.stack}`);
		res.status(500).json({
			status: "SERVER FAILED ! ❌",
			message: "Internal Server Error",
		});
	}
})

//! This is a demo endpoint, we need to verify user's jwt right inside other endpoints
app.get("/api/verifyUser", (req, res) => {
	try {
		logger.info("In verifyUser");
		logger.debug(`req.body:`);
		//logger.debug(JSON.stringify(req.body));
		
		// user_jwt is inside http header: authorization
		let user_jwt = req.cookies.token;
		logger.debug("user_jwt")
		logger.info(`user_jwt: ${user_jwt}`);
		
		db.verifyUserJWT(user_jwt, (error, result) => {
            logger.debug(`result: ${JSON.stringify(result,null,2)}`);
            logger.debug(`error: ${JSON.stringify(error,null,2)}`);
			if (error) {
				logger.error(`error:\n${error}`);
				res.status(400).json({
					status: "VERIFY FAILED ! ❌",
					message: error.toString(),
				});
			}
			else {
				logger.info("VERIFIED USER!");
				res.status(200).json({
					status: "VERIFY SUCCESS ! ✔️",
					verify:result
				});
			}
		});
	}
	catch (error) {
		logger.error(`Exception:\n${error.stack}`);
		res.status(500).json({
			status: "UPLOAD FAILED ! ❌",
			message: "Internal Server Error",
		});
	}
})

// running on port 3001 currently
app.listen(config.app_port, () => {
	// start up
	logger.info(`Start server on port: ${config.app_port}`);
	logger.info(`Logging Level: ${config.log_level}`);
	logger.info(`Save log file to:\n${config.log_file}`);
});

require('dotenv').config();
var config = null;
if (process.env.NODE_ENV === "production") {
	config = require("./config/production.config.json");
} else {
	config = require("./config/dev.config.json");
}
const express = require("express");
const app = express();
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const multer = require("multer");
const multerS3 = require("multer-s3");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const DBManager = require('./DBManager.js');
var logger = require('./logger.js')(config.log_file, config.log_level);
var db = new DBManager(config.db, config.aes_key, config.jwt_secret, logger);


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(express.json());
app.use(cors());
app.use(cookieParser());


// file filter to only allow image file types ()
const isImg = (req, file, cb) => {
	if (file.mimetype.startsWith("image")) {
		cb(null, true);
	} else {
		logger.warn("NOT AN IMAGE!!!");
		cb(null, logger.warn("ONLY image files are acceptable!"));
	}
};


// save to file system
// ==================================================
// const storeImg = multer.diskStorage({
// 	destination: (req, file, cb) => {
// 		// cb = callback
// 		cb(null, "uploadedImages");		// uploads to 'uploadedImages' folder
// 	},
// 	filename: (req, file, cb) => {
// 		cb(null, `image-${Date.now()}.${file.originalname}`);
// 	},
// });
// const upload = multer({
// 	storage: storeImg,
// 	fileFilter: isImg,
// 	limits: { fileSize: config.max_upload_size },
// });
// ==================================================


// save to aws s3
// ==================================================
// Connection to S3 database with full S3 connection
let aws_config = (({ bucket_name, ...others }) => others)(config.aws)
AWS.config.update(aws_config);

// Create a connection to yourmoon bucket
const s3 = new AWS.S3();
s3.listBuckets((err, data) => {
	if (err) {
		logger.error('AWS connection error:', err);
	} else {
		logger.info('AWS connection successful.');
		logger.info(`\n${JSON.stringify(data,null,2)}`);
	}
});

// setup multer for upload to s3
const upload = multer({
	storage: multerS3({
		s3: s3,
		acl: 'public-read',
		bucket: config.aws.bucket_name,
		key: function (req, file, cb) {
			logger.warn("Upload Query: ", req.query);
			logger.warn("File Information:\n", file);
			const key = `image-${new Date().toISOString()}.${file.originalname}`;
			if (key) {
			  cb(null, key);
			} else {
			  cb(new Error("Error generating S3 key"));
			}
		  },
		fileFilter: isImg,
		limits: { fileSize: config.max_upload_size },
	})
});
// ==================================================


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
		let jwt_token = req.cookies.token;
		if (!jwt_token || jwt_token.length <= 0) {
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
		let jwt_token = req.cookies.token;
		if (!jwt_token || jwt_token.length <= 0) {
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

//! This is a demo endpoint, we can do user authentication in auth.js
app.post("/api/authUser", (req, res) => {
	try {
		logger.info("In authUser");
		logger.debug(`req.body:`);
		logger.debug(JSON.stringify(req.body));
		
		// TODO: retrieve email from OAuth 2.0
		const { user_email } = req.query;
		logger.debug(`user_email: ${user_email}`);
		
		db.registerUser(user_email, (error, result) => {
            logger.debug(`result: ${JSON.stringify(result,null,2)}`);
            logger.debug(`error: ${JSON.stringify(error,null,2)}`);
			if (error) {
				logger.error(`error:\n${error}`);
				let message = null;
				if (error.toString().includes("duplicate")) {
					message = "DUPLICATE EMAIL";
				} else {
					message = "FAILED TO REGISTER USER";
				}
				res.status(400).json({
					status: "REGISTER FAILED ! ❌",
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
	catch (error) {
		logger.error(`Exception:\n${error.stack}`);
		res.status(500).json({
			status: "UPLOAD FAILED ! ❌",
			message: "Internal Server Error",
		});
	}
})

//! This is a demo endpoint, we need to verify user's jwt right inside other endpoints
app.get("/api/verifyUser", (req, res) => {
	try {
		logger.info("In verifyUser");
		logger.debug(`req.body:`);
		logger.debug(JSON.stringify(req.body));
		
		// user_jwt is inside http header: authorization
		const user_jwt = req.headers.authorization;
		logger.debug(`user_jwt: ${user_jwt}`);
		
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

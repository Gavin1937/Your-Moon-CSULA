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
const sharp = require("sharp");
const passport = require("passport");
const passportSetup = require("./passport");
const cookieSession = require('cookie-session');
const authRoutes = require("./routes/auth");
const DBManager = require('./DBManager.js');
var logger = require('./logger.js')(config.log_file, config.log_level);
var db = new DBManager(config.db, logger);


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(express.json());
app.use(cookieSession({
	name:"session",
	keys:["Your-Moon"],//encryption key,
	maxAge: 60 * 30 //30 minutes
}));


app.use(passport.initialize());
app.use(passport.session());

//allows to send sessions to client and server
app.use(cors({
	origin:"http://localhost:5173", //replace with home page url
	methods:"GET,POST",
	credentials: true,
}))

app.use("/api/auth", authRoutes)

// file system
const storeImg = multer.diskStorage({
	destination: (req, file, cb) => {
		// cb = callback
		cb(null, "uploadedImages");		// uploads to 'uploadedImages' folder
	},
	filename: (req, file, cb) => {
		cb(null, `image-${Date.now()}.${file.originalname}`);
	},
});

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
		// TODO: check JWT in the cookie here
		
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
		db.finishUploadJob(upload_uuid, 1, 0, (error, result) => {
			if (error) {
				logger.error("THERE HAS BEEN AN ERROR UPLOADING THE IMAGE!");
				logger.error(`error:\n${error.toString()}`);
				res.status(400).json({
					status: "UPLOAD FAILED ! ❌",
					message: error.toString(),
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
		
		// TODO: check JWT in the cookie here
		
		db.addImage(req.body.instrument, req.body.image, req.body.moon, (error, result) => {
			if (error) {
				logger.error("THERE HAS BEEN AN ERROR INSERTING THE IMAGE!");
				logger.error(`error:\n${error}`);
				res.status(500).json({
					status: "UPLOAD FAILED ! ❌",
					message: "THERE HAS BEEN AN ERROR INSERTING THE IMAGE!",
				});
			}
			else {
				logger.info("Successfully inserted into the lunarimages database!");
				logger.info("IMAGE INSERTED SUCCESSFULLY!");
				
				// TODO: use redis for this job queue
				db.registerUploadJob(config.upload_job_expire, 1, (error, result) => {
					if (result == null) {
						res.status(400).json({
							status: "UPLOAD FAILED ! ❌",
							message: error.toString(),
						});
					}
					else {
						res.status(200).json({
							status: "UPLOAD SUCCESSFUL ! ✔️",
							upload_uuid: result.upload_uuid,
							expires: result.expires,
							// TODO: response with credentials for picture file upload
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

// running on port 3001 currently
app.listen(config.app_port, () => {
	// start up
	logger.info(`Start server on port: ${config.app_port}`);
	logger.info(`Logging Level: ${config.log_level}`);
	logger.info(`Save log file to:\n${config.log_file}`);
});

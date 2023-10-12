require('dotenv').config();
let config = null;
if (process.env.NODE_ENV === "production") {
	config = require("./config/production.config.json");
} else {
	config = require("./config/dev.config.json");
}
const express = require("express");
const app = express();
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const multer = require("multer");
const multerS3 = require("multer-s3");
const cors = require("cors");
const sharp = require("sharp");
const DBManager = require('./DBManager.js');
var logger = require('./logger.js')(config.log_file, config.log_level);
let db = new DBManager(config.db, logger);


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(express.json());
app.use(cors());

// Connection to S3 database with full S3 connection
AWS.config.update(config.aws);

// Create a connection to yourmoon bucket
const s3 = new AWS.S3();

s3.listBuckets((err, data) => {
	if (err) {
		console.error('AWS connection error:', err);
	} else {
		console.log('AWS connection successful.');
		console.log(data);
	}
});

// file system
// const storeImg = multer.diskStorage({
// 	destination: (req, file, cb) => {
// 		// cb = callback
// 		cb(null, "uploadedImages");		// uploads to 'uploadedImages' folder
// 	},
// 	filename: (req, file, cb) => {
// 		cb(null, `image-${Date.now()}.${file.originalname}`);
// 	},
// });

// file filter to only allow image file types ()
const isImg = (req, file, cb) => {
	if (file.mimetype.startsWith("image")) {
		cb(null, true);
	} else {
		logger.warn("NOT AN IMAGE!!!");
		cb(null, logger.warn("ONLY image files are acceptable!"));
	}
};

// multer is a library that allows for image storing
const upload = multer({
	storage: multerS3({
		s3: s3,
		acl: 'public-read',
		bucket: 'yourmoon',
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

		// testing purposes to see some info of the file
		logger.debug(`req.body:\n${JSON.stringify(req.body, null, 2)}`);

		// getting the inputted data from the client through destructuring
		const { longitude, latitude, time, date } = req.query;
		const photoUrl = imgFile.location;

		// testing purposes to see the data
		logger.debug(`photoUrl: ${photoUrl}`);
		logger.debug(`longitude: ${longitude}`);
		logger.debug(`latitude: ${latitude}`);
		logger.debug(`time: ${time}`);
		logger.debug(`date: ${date}`);

		const imageName = req.file.originalname; // name of the image file
		const imageType = req.file.mimetype; // type of the image file
		const path = req.file.path; // gets the buffer

		logger.info(`NAME: ${imageName}`);
		logger.info(`IMAGE TYPE: ${imageType}`);
		logger.info(`path: ${path}`);
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
		
		db.addImage(req.body.instrument, req.body.image, req.body.moon, (error, result) => {
			if (error) {
				logger.error("THERE HAS BEEN AN ERROR INSERTING THE IMAGE!");
				logger.error(`error:\n${JSON.stringify(error, null, 2)}`);
				res.status(500).json({
					status: "UPLOAD FAILED ! ❌",
					message: "THERE HAS BEEN AN ERROR INSERTING THE IMAGE!",
				});
			}
			else {
				logger.info("Successfully inserted into the lunarimages database!");
				logger.info("IMAGE INSERTED SUCCESSFULLY!");
				res.status(200).json({
					status: "UPLOAD SUCCESSFUL ! ✔️"
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
	logger.info(`Start server on port: ${config.app_port}`);
});

// start up
logger.info(`Logging Level: ${config.log_level}`);
logger.info(`Save log file to: ${config.log_file}`);

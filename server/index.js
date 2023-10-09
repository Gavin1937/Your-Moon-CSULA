require('dotenv').config();
let config = null;
if (process.env.NODE_ENV === "production") {
	config = require("./config/production.config.json");
} else {
	config = require("./config/dev.config.json");
}
const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const multer = require("multer");
const cors = require("cors");
const sharp = require("sharp");
var logger = require('./logger.js')(config.log_file, config.log_level);


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(express.json());
app.use(cors());

// Setting up connection (Currently, it's set up to our own localhost. There is no server as of now.)
// Currently, you would have to create your own database called 'lunarimages' in MySQL
const db = mysql.createPool(config.db);

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

// multer is a library that allows for image storing
const upload = multer({
	storage: storeImg,
	fileFilter: isImg,
	limits: { fileSize: config.max_upload_size },
});

function uploadHandler(next) { // outer function takes in "next" request handler
	return function(req, res) { // returns a request handler uses "next" inside
		upload.single("lunarImage")(req, res, function(error) { // MulterError handler function
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

app.post("/api/picUpload", uploadHandler( (req, res) => { // pass upload & db handler as "next" function
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

		// testing purposes to see the data
		logger.debug(`longitude: ${longitude}`);
		logger.debug(`latitude: ${latitude}`);
		logger.debug(`time: ${time}`);
		logger.debug(`date: ${date}`);

		// YOU CAN REMOVE THE COMMENTED CODE RIGHT BELOW
		// 
		// if (latitude === '' || longitude === '' || time === '' || date === '') {

		
    	const imageName = req.file.originalname; // name of the image file
    	const imageType = req.file.mimetype; // type of the image file
    	const path = req.file.path; // gets the buffer

		logger.info(`NAME: ${imageName}`);
		logger.info(`IMAGE TYPE: ${imageType}`);
		logger.info(`path: ${path}`);

		/*
			updated SQL statement for now, you would have to create your own database and table on your
			local machine since this isn't hosted on a server right now
		*/
		const sqlInsert =
			"INSERT INTO LunarImageDB (img_name, img_type, img_file, longitude, latitude, m_time, m_date) values(?, ?, ?, ?, ?, ?, ?)";

		// query the SQL statement with the data and image file that the user provides from the client
		db.query(sqlInsert, [imageName, imageType, path, longitude, latitude, time, date], (error, result) => {
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
					status: "UPLOAD SUCCESSFUL ! ✔️",
					fileName: imgFile.filename,
				});
			}
		});
	}
	catch (error) {
		logger.error(`Exception:\n${JSON.stringify(error, null, 2)}`);
		res.status(500).json({
			status: "UPLOAD FAILED ! ❌",
			message: "Internal Server Error",
		});
	}
}));

// this is a test route to see if it displays image from the server
app.get("/api/displayImage/:id", (req, res) => {
	try {
		const id = req.params.id; // req.params gives information from the route (in this case, 'id' is part of the route)

		const sqlDisplay = "SELECT img_file FROM LunarImageDB where id = ?";

		db.query(sqlDisplay, [id], (error, result) => {
			if (error) {
				throw error;
			}

			const filePath = result[0].img_file; // getting the specific row of the image file path from the database

			//
			sharp(filePath)
				.resize(300) // optional image processing (Resizes the image. No parameters: original size. OR (width, height) OR (single size - this adjusts the size by nxn ))
				// this toBuffer() function returns a promise
				.toBuffer() // get the buffer object which contains the processed image data
				.then((buffer) => {
					// convert buffer object to base64-encoded string (base64 is text of binary data)   (ex. 01000001 01000010 01000011 -> QUJD)
					const base64Image = buffer.toString("base64");
					const imageSrc = `data:image;base64,${base64Image}`; //
					res.send(`<img src="${imageSrc}" />`); // displays the image with an img tag
				})
				.catch((err) => {
					logger.error(err);
					res.status(500).send("ThErE iS nO iMaGe To Be DiSpLaYeD!");
				});
		});
	} catch (error) {
		logger.error(error);
	}


});

// running on port 3001 currently
app.listen(config.app_port, () => {
	logger.info(`Start server on port: ${config.app_port}`);
});

// start up
logger.info(`Logging Level: ${config.log_level}`);
logger.info(`Save log file to: ${config.log_file}`);

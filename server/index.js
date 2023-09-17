const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const multer = require("multer");
const cors = require("cors");
const sharp = require("sharp");
const { error } = require("console");
const port = 3001;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(express.json());
app.use(cors());

// Setting up connection (Currently, it's set up to our own localhost. There is no server as of now.)
// Currently, you would have to create your own database called 'lunarimages' in MySQL
const db = mysql.createPool({
	connectionLimit: 10,
	host: "localhost",
	port: 3306,
	user: "root",
	password: "",
	database: "lunarimages",
});

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
		console.log("NOT AN IMAGE!!!");
		cb(null, error("ONLY image files are acceptable!"));
	}
};

// multer is a library that allows for image storing
const upload = multer({ storage: storeImg, fileFilter: isImg });

app.post("/picUpload", upload.single("lunarImage"), (req, res) => {
	try {
		const imgFile = req.file;	// gets the file that is uploaded from the client
		console.log(imgFile);	// testing purposes to see some info of the file

		// testing purposes to see some info of the file
		console.log("THIS IS THE req.body:");
		console.log(req.body);

		// getting the inputted data from the client through destructuring
		const { longitude, latitude, time, date } = req.query;

		// testing purposes to see the data
		console.log(`longitude: ${longitude}`);
		console.log(`latitude: ${latitude}`);
		console.log(`time: ${time}`);
		console.log(`date: ${date}`);

		// YOU CAN REMOVE THE COMMENTED CODE RIGHT BELOW
		// 
		// if (latitude === '' || longitude === '' || time === '' || date === '') {

		
    	const imageName = req.file.originalname; // name of the image file
    	const imageType = req.file.mimetype; // type of the image file
    	const path = req.file.path; // gets the buffer

			console.log(`NAME: ${imageName}`);
			console.log(`IMAGE TYPE: ${imageType}`);
			console.log(`path: ${path}`);

			/*
			 updated SQL statement for now, you would have to create your own database and table on your
			 local machine since this isn't hosted on a server right now
			*/
			const sqlInsert =
				"INSERT INTO LunarImageDB (img_name, img_type, img_file, longitude, latitude, m_time, m_date) values(?, ?, ?, ?, ?, ?, ?)";

			// query the SQL statement with the data and image file that the user provides from the client
			db.query(sqlInsert, [imageName, imageType, path, longitude, latitude, time, date], (error, result) => {
				if (error) {
					console.log("THERE HAS BEEN AN ERROR INSERTING THE IMAGE!");
					throw error;
				}
				console.log("Successfully inserted into the lunarimages database!");

			});
			console.log("IMAGE INSERTED SUCCESSFULLY!");
			res.status(200).json({
				status: "UPLOAD SUCCESSFUL ! ✔️",
				fileName: imgFile.filename,
			});
		}
	} catch (error) {
		res.status(500).json({
			status: "UPLOAD FAILED ! ❌",
			error,
		});
	}
});

// this is a test route to see if it displays image from the server
app.get("/displayImage/:id", (req, res) => {
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
					// console.log(imageSrc);
					// console.log("buffer: ", base64Image);
					res.send(`<img src="${imageSrc}" />`); // displays the image with an img tag
				})
				.catch((err) => {
					console.error(err);
					res.status(500).send("ThErE iS nO iMaGe To Be DiSpLaYeD!");
				});
		});
	} catch (error) {
		console.log(error);
	}


});

// running on port 3001 currently
app.listen(port, () => {
	console.log(`Running on Port ${port}`);
});

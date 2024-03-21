module.exports = (storage_method, config, logger) => {

const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
var upload = null;

// file filter to only allow image file types ()
const isImg = (req, file, cb) => {
	if (file.mimetype.startsWith("image")) {
		cb(null, true);
	} else {
		logger.warn("NOT AN IMAGE!!!");
		cb(null, logger.warn("ONLY image files are acceptable!"));
	}
};

if (storage_method == "s3")
{
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
		logger.debug(`\n${JSON.stringify(data,null,2)}`);
	}
});

// setup multer for upload to s3
// ==================================================
upload = multer({
	storage: multerS3({
		s3: s3,
		acl: 'private',
		bucket: config.aws.bucket_name,
		key: function (req, file, cb) {
			logger.debug("Upload Query: ", req.query);
			logger.info("File Information:\n", file);
			// filename save in s3
			// TODO: we should check md5 in file.originalname against its real md5, just in case file upload failed
			const key = file.originalname;
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
}
else
{
// save to file system
// ==================================================
const storeImg = multer.diskStorage({
	destination: (req, file, cb) => {
		// cb = callback
		cb(null, "uploadedImages");		// uploads to 'uploadedImages' folder
	},
	filename: (req, file, cb) => {
		// TODO: we should check md5 in file.originalname against its real md5, just in case file upload failed
		cb(null, file.originalname);
	},
});
upload = multer({
	storage: storeImg,
	fileFilter: isImg,
	limits: { fileSize: config.max_upload_size },
});
// ==================================================
}

return upload;

}
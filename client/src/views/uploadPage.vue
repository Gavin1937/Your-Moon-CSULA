<!--
	TODO
	- figureout the how to upload file name form the index.js file.
	- figureout how to upload the correct file datatype form the index.js file.
	- restrict users from uploading any file type other than jpg. 
	- add not null.
-->
<!-- eslint-disable prettier/prettier -->
<script setup>
import Cropper from 'vue-cropperjs';
import 'cropperjs/dist/cropper.css';
import axios from "axios";
import ExifReader from 'exifreader';
import {ref, reactive} from "vue";
import MoonRegistration from '../moon-registration';
import config from '../../config/config.json'


// This is the ref to the cropper DOM element
const cropr = ref(null);

let data = reactive({
	// "META DATA"
	image : '',
	// Message for displaying success or failure when uploading
	message : '',
	// Tracks if image has meta data
	hasExif : true,
	maxFileSize: 30 * 1024 * 1024, //max file size 30MB
	fileSizeExceeded: false,
	isValidFileType: false,
	latitude : '',
	longitude : '',
	altitude : '',
	timeStamp : '',
	// Data retrieved from RunMoonDetect()
	moon_position : null,
	// Tracks date input if there isn't meta data
	date : '',
	// Tracks time input if there isn't meta data
	time : '',
	file : null,
	fileType : '',
	imageDataUrl : null,
	showCropper : false,
	croppedImage : null,
})

function getScaledCropData(){
	// Gets cropBoxData and scales it up to the scale of the original image.
	try{
		const canvasWidth = cropr.value.getCanvasData().width;
		const canvasNaturalWidth = cropr.value.getCanvasData().naturalWidth;
		const {left, top, width, height} = cropr.value.getCropBoxData();
		// The crop box x, y, width and height are all scaled from the canvas scale to the original image scale.
		return {
			x:left*canvasNaturalWidth/canvasWidth,
			y:top*canvasNaturalWidth/canvasWidth,
			width: width*canvasNaturalWidth/canvasWidth,
			height: height*canvasNaturalWidth/canvasWidth,
		};
	} catch (error) {
		console.log(error)
	}
}
async function onCropperReady() {
	try{
	console.log(data.moon_position.x)
	// The Cropper canvas scales down so the crop box needs to compensate for the scale.
	// naturalWidth and naturalHeight are the original dimensions of the image.
	// The width and height both scale equally so only width will be used.
	const {width, naturalWidth} = cropr.value.getCanvasData();
	// left, top, width and height are all scaled by width/naturalWidth.
	const initialCropData = {
			left: data.moon_position.x*width/naturalWidth,
			top: data.moon_position.y*width/naturalWidth,
			width: data.moon_position.width*width/naturalWidth,
			height: data.moon_position.width*width/naturalWidth,
	};
	cropr.value.setCropBoxData(initialCropData);
	} catch (error) {
		console.log(error)
	}
}

//checks bytes of file header to check file type because human readable MIME type can be manipulated
function checkFileType(file) {
  const reader = new FileReader();
  let header = "";

  reader.onload = (e) => {
    let fileType = "";
    let arr = new Uint8Array(e.target.result).subarray(0, 16);

    for (let i = 0; i < arr.length; i++) {
      header += arr[i].toString(16);
    }

    //hexadecimal representation of those file extensions. References: https://mimesniff.spec.whatwg.org/#matching-an-image-type-pattern
    //https://en.wikipedia.org/wiki/List_of_file_signatures
    if (header.includes("424d")) {
      fileType = "bmp";
    } else if (header.includes("ffd8ff")) {
      fileType = "jpg";
    } else if (header.includes("504e47")) {
      fileType = "png";
    } else if (header.includes("52494646") && header.includes("57454250")) {
      fileType = "webp";
    } else {
      fileType = "invalid";
      data.message = "File type not accepted";
    }

	data.fileType = fileType;
    data.isValidFileType = fileType !== "invalid" ? true : false;
  };
  reader.readAsArrayBuffer(file);
}

async function onFileChange(e) {
	// TODO check that the file uploaded is a valid image file
	const files = e.target.files;

	if (files.length > 0) {
    data.file = files[0];
    checkFileType(data.file);
    //delays for .5s because that's about the time it takes for data.isValidFileType to be updated
    setTimeout(() => {
      if (data.isValidFileType) {
        if (data.file.size <= data.maxFileSize) {
          data.fileSizeExceeded = false;
          data.message = "";
          const reader = new FileReader();
          updateMetaData();
          reader.onload = (e) => {
            data.imageDataUrl = e.target.result;
            data.showCropper = true;
            data.croppedImage = true;
          };
          reader.readAsDataURL(data.file);
          // TODO: set the cropping box to the moon_position
          RunDetectMoon(data.file);
        } else {
          data.fileSizeExceeded = true;
          data.message = "Max upload file size of 30MB exceeded";
        }
      }
    }, 500);
  }
}

// Credit goes to Youssef El-zein. 
// This is modified code from his work on the MoonTrek site.
async function updateMetaData(){
	try{
		const tags = await ExifReader.load(data.file);

		// If so, keep imageData.hasExif true
		data.hasExif = true;
		// Set the date
		if(tags.GPSLongitude && tags.GPSLatitude){
			// Keep all North latitude values positive
			// and make South latitude values negative
			if (tags.GPSLatitudeRef.value[0] === 'N') {
				data.latitude = tags.GPSLatitude.description;
			} else {
				data.latitude = -1 * tags.GPSLatitude.description;
			}

			// Keep all East longitude values positive
			// and make West longitude values negative
			if (tags.GPSLongitudeRef.value[0] === 'E') {
				data.longitude = tags.GPSLongitude.description;
			} else {
				data.longitude = -1 * tags.GPSLongitude.description;
			}
		}
		if(tags.GPSAltitude){
			//.slice removes last 2 characters (blank space and m)
			data.altitude = tags.GPSAltitude.description.slice(0,-2);
		}
		if(tags.DateTimeOriginal){
			// Get datetime in YYYY:MM:DD HH:MM:SS
			const imageDate = tags.DateTimeOriginal.description
			//Split time and date
			const [datePart, timePart] = imageDate.split(' ');
			//Split date
			const [year, month, day] = datePart.split(':');
			//Reformat date into something compatible with the field.
			const temp_date = `${year}-${month}-${day}`;
			data.date = temp_date;
			data.time = timePart;
		}
		if(tags.Make && tags.Model){
			//As of now this only captures camera make and model
			data.make = tags.Make.description;
			data.model = tags.Model.description;
		}
	} catch (error) {
		console.log(error);
	}
}
// wrapper function to run moon detection algorithm
// parameters:
//   * _fileObject => one element of js FileList object
//   * _type       => string type, specifying the return type of api.
//                    If _type === 'circle'
//                    return: { "type": "circle", "x": int, "y": int, "radius": int }
// 
//                    If _type === 'square'
//                    return: { "type": "square", "x": int, "y": int, "width": int }
// 
//                    If _type === 'rectangle'
//                    return: { "type": "rectangle", "x1": int, "y1": int, "x2": int, "y2": int }
//   * returns from MoonDetection() will be receive & process by this.onMoonPositionUpdatse()
async function RunDetectMoon(_fileObject, _type="square") {
	try {
		MoonRegistration.MoonDetection(_fileObject, _type, onMoonPositionUpdate)
	} catch (err) {
		data.message = err;
	}
}
async function onMoonPositionUpdate(new_position) {
			console.log('moon_position:', new_position);
			if(new_position.type == "square"){
				data.moon_position = {x:new_position.x, y:new_position.y, width:new_position.width}
				console.log(data.moon_position)
			}
}
// function that gets the cropped image and sends it to server-side
async function uploadCroppedImage() {
	try {
		const imgFile = await new Promise(resolve => {
			cropr.value.getCroppedCanvas().toBlob(img => {
				resolve(img);
			});
		});
		const formData = new FormData();
		formData.append("lunarImage", imgFile, data.fileType);
		// make post request to upload image to database
		const res = await axios.post(`${config.backend_url}/api/picUpload`, formData, {
			params: {
				latitude: data.latitude,
				longitude: data.longitude,
				time: data.time,
				date: data.date,
			},
		});
		
		const { status } = res.data;
		console.log(`status: ${status}`);
		
		data.message = status;

	} catch (err) {
		data.message = err;
	}
}
</script>

<!-- eslint-disable prettier/prettier -->
<template>
	<body class="background">
		<div class="container d-flex justify-content-center align-items-center">
			<div class="padding1">
				<h2 class="txt up1">
					Upload and crop your image.
				</h2>
				<br>
				<input type="file" accept=".jpg,.png,.webp,.bmp,.jpeg" ref="lunarImage" @change="onFileChange" />
				<br>
				<br>
				<cropper class="resize" ref="cropr" v-if="data.showCropper && data.moon_position" :src="data.imageDataUrl" 				
				:zoomOnWheel = "false"
				:zoomable = "false"
				:zoomOnTouch = "false"
				:movable = "false"
				:viewMode = 3
				:restore = false
				:aspectRatio = 1
				:scaleX = 1
				:scaleY = 1
				@ready="onCropperReady" />
			</div>
		<div class="status-message" v-if="fileSizeExceeded || !isValidFileType">
			{{ data.message }}
		</div>
		<div v-if="data.croppedImage">
			<div class="cent">
				<div id="image-upload">
					<form @submit.prevent="onSubmit" enctype="multipart/form-data">
						<div class="field">
							<div class="file is-centered">
								<label class="file-label">
									<!-- <input class="file-input" type="file" ref="lunarImage" @change="onSelect" /> add back to code-->
									<span class="file-cta">
										<span class="file-icon">
											<font-awesome-icon icon="fa-solid fa-file-arrow-up" />
										</span>

									</span>
								</label>
							</div>
						</div>

							<!-- this portion only shows up if the image has no EXIF data attached to it : v-if="!hasExif"-->
							<div id="manual-form" class="move">
								<div class="columns is-centered">
									<div class="column is-one-fifth">
										<div class="field">
											<label class="label">
												Latitude
											</label>
											<div class="control">
												<input class="input" type="text" v-model="data.latitude" />
											</div>
										</div>
									</div>
									<div class="column is-one-fifth">
										<div class="field">
											<label class="label">
												Longitude
											</label>
											<div class="control">
												<input class="input" type="text" v-model="data.longitude" />
											</div>
										</div>
									</div>
									<div class="column is-one-fifth">
							<div class="field">
											<label class="label">
												Altitude 
											</label>
											<div class="control">
												<input class="input" type="text" v-model="data.altitude" />
											</div>
										</div>
									</div>
								</div>

								<div class="columns is-centered">
									<div class="column is-one-fifth">
										<div class="field">
											<label class="label">
												Date
											</label>
											<div class="control">
												<input class="input" type="date" v-model="data.date" />
											</div>
										</div>
									</div>
									<div class="column is-one-fifth">
										<div class="field">
											<label class="label">
												Time
											</label>
											<div class="control">
												<input class="input" type="time" v-model="data.time" />
											</div>
										</div>
									</div>
									<div class="column is-one-fifth">
										<div class="field">
											<label class="label">
												Instrument Make
											</label>
											<div class="control">
												<input class="input" type="text" v-model="data.make" />
											</div>
										</div>
									</div>
									<div class="column is-one-fifth">
										<div class="field">
											<label class="label">
												Instrument Model
											</label>
											<div class="control">
												<input class="input" type="text" v-model="data.model" />
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class="field">
								<!-- <button class="button is-link" @click="onSubmit">
								Upload
							</button> -->
							</div>
						</form>
						<p class="status-message">
							{{ data.message }}
						</p>
					</div>
					<div v-if="data.croppedImage">
						<button type="button" class="btn btn-primary" @click="uploadCroppedImage">Upload</button>
					</div>
				</div>
			</div>
		</div>
	</body>
</template>
  


<!-- eslint-disable prettier/prettier -->
<style>
.move{
	margin-left: 5px;
}
.resize {
	border: 10px solid;
	border-color: teal;
	object-fit: fill;
}

.txt {
	color: white;
	/*font-family: monospace;*/
}

.ins {
	padding-top: 1%;
}

.padding1 {
	padding-left: 1%;
}

.up1 {
	padding-top: 2%;
}

.container {
	max-width: 800px;
	margin: 0 auto;
}

.preview {
	margin-top: 20px;
	display: flex;
	justify-content: center;
}

.preview img {
	max-width: 100%;
}

.crop {
	margin-top: 20px;
	display: flex;
	justify-content: center;
}

.crop button {
	padding: 10px;
	background-color: #4CAF50;
	color: white;
	border: none;
	cursor: pointer;
	font-size: 16px;
}

.crop button:hover {
	background-color: #3e8e41;
}

.submit {
	margin-top: 20px;
	display: flex;
	justify-content: center;
}

.submit input[type="submit"] {
	padding: 10px;
	background-color: #4CAF50;
	color: white;
	border: none;
	cursor: pointer;
	font-size: 16px;
}

.submit input[type="submit"]:hover {
	background-color: #ffff
}

.colo1 {
	color: white;
}

.cent {
	padding-left: 2.5%;
	padding-top: 1%;
}

.background {
	/*background-color: black; 
	*/
	background-repeat: no-repeat;
	background-image: url("moon_phases.jpg");
	background-size: cover;
}


#image-upload, .status-message {
	font-size: 1.2rem;
	color: chartreuse;
}

#image-upload label {
	font-size: 1.2rem;
	color: whitesmoke;
}

#image-upload #manual-form {
	margin-top: 5rem;
	margin-bottom: 3rem;
}

@media (min-width: 180px) and (max-width: 768px) {
	#image-upload #manual-form {
		padding-left: 4rem;
		padding-right: 4rem;
	}
}
</style>
<!--
	TODO
	- figureout the how to upload file name form the index.js file.
	- figureout how to upload the correct file datatype form the index.js file.
	- restrict users from uploading any file type other than jpg. 
	- add not null.
-->


<!-- eslint-disable prettier/prettier -->
<template>
	<body class="background">
		<div class="container d-flex justify-content-center align-items-center">
			<div class="padding1">
				<h2 class="txt up1">
					Upload and crop your image.
				</h2>
				<br>
				<input type="file" ref="lunarImage" @change="onFileChange" />
				<br>
				<br>
				<cropper class="resize" ref="cropper" v-if="showCropper" :src="imageDataUrl" 				
				:zoomOnWheel = "false"
				:zoomable = "false"
				:zoomOnTouch = "false"
				:movable = "false"
				@ready="onCropperReady" />
			</div>

		<div v-if="croppedImage">

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
												<input class="input" type="text" v-model="latitude" />
											</div>
										</div>
									</div>
									<div class="column is-one-fifth">
										<div class="field">
											<label class="label">
												Longitude
											</label>
											<div class="control">
												<input class="input" type="text" v-model="longitude" />
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
												<input class="input" type="date" v-model="date" />
											</div>
										</div>
									</div>
									<div class="column is-one-fifth">
										<div class="field">
											<label class="label">
												Time
											</label>
											<div class="control">
												<input class="input" type="time" v-model="time" />
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
						<p id="status-message">
							{{ this.message }}
						</p>
					</div>
					<div v-if="croppedImage">
						<button type="button" class="btn btn-primary" @click="uploadCroppedImage">Upload</button>
					</div>
				</div>
			</div>
		</div>
	</body>
</template>
  
<!-- eslint-disable prettier/prettier -->
<script>
import Cropper from 'vue-cropperjs';
import 'cropperjs/dist/cropper.css';
import axios from "axios";
import ExifReader from 'exifreader';
import MoonRegistration from '../moon-registration';

export default {
	components: {
		Cropper,
	},
	data() {
		return {
			file: null,
			imageDataUrl: null,
			showCropper: false,
			croppedImage: null,

			// "META DATA"
			image: '',
			// Message for displaying success or failure when uploading
			message: '',
			// Tracks if image has meta data
			hasExif: true,
			latitude: '',
			longitude: '',
			timeStamp: '',
			// Tracks date input if there isn't meta data
			date: '',
			// Tracks time input if there isn't meta data
			time: ''
		};
	},
	methods: {
		onFileChange(e) {
			//TODO check that the file uploaded is a valid image file

			const files = e.target.files;
			
			if (files.length > 0) {
				
				this.file = files[0];
				
				const reader = new FileReader();
				this.updateMetaData();
				reader.onload = (e) => {
					this.imageDataUrl = e.target.result;
					this.showCropper = true;
					this.croppedImage = true;
				};
				reader.readAsDataURL(this.file);
			}
		},
		// Credit goes to Youssef El-zein. 
		//This is modified code from his work on the MoonTrek site.
		async updateMetaData(){
			try{
				const tags = await ExifReader.load(this.file);
				//console.log(tags)
				if (tags.GPSLongitude && tags.GPSLatitude && tags.DateTimeOriginal) {
					// If so, keep imageData.hasExif true
					this.hasExif = true;
					// Set the date
					this.date = tags.DateTimeOriginal.description;

					// Keep all North latitude values positive
					// and make South latitude values negative
					if (tags.GPSLatitudeRef.value[0] === 'N') {
						this.latitude = tags.GPSLatitude.description;
					} else {
						this.latitude = -1 * tags.GPSLatitude.description;
					}

					// Keep all East longitude values positive
					// and make West longitude values negative
					if (tags.GPSLongitudeRef.value[0] === 'E') {
						this.longitude = tags.GPSLongitude.description;
					} else {
						this.longitude = -1 * tags.GPSLongitude.description;
					}
					
					const imageDate = tags.DateTimeOriginal.description
					const [datePart, timePart] = imageDate.split(' ');
					const [year, month, day] = datePart.split(':');
					const temp_date = `${year}-${month}-${day}`;
					this.date = temp_date;
					this.time = timePart;
				}
				else{
					console.log('No relevent image metadata found.');
				}
			} catch (error) {
				console.log(error);
			}
		},
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
		//   * returns from MoonDetection() will be receive & process by this.onMoonPositionUpdate()
		async RunDetectMoon(_fileObject, _type="square") {
			try {
				MoonRegistration.MoonDetection(_fileObject, _type, this.onMoonPositionUpdate)
			} catch (err) {
				this.message = err;
			}
		},
		// function that gets the cropped image and sends it to server-side
		async uploadCroppedImage() {
			try {
				const imgFile = await new Promise(resolve => {
					this.$refs.cropper.getCroppedCanvas().toBlob(img => {
						resolve(img);
					});
				});

				this.RunDetectMoon(this.file)

				const formData = new FormData();
				formData.append("lunarImage", imgFile, '.jpg');

				// make post request to upload image to database
				const res = await axios.post("http://localhost:3001/picUpload", formData, {
					params: {
						latitude: this.latitude,
						longitude: this.longitude,
						time: this.time,
						date: this.date,
					},
				});
				
				const { status } = res.data;
				console.log(`status: ${status}`);

				this.message = status;

			} catch (err) {
				this.message = err;
			}
		},
		async onMoonPositionUpdate(new_position) {
			// TODO: set the cropping box to the moon_position
			console.log('moon_position:', new_position);
		},
	},
};
</script>

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
	/* background-color: black; */

	background-repeat: no-repeat;
	background-image: url("moon_phases.jpg");
	background-size: cover;
}


#image-upload #status-message {
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
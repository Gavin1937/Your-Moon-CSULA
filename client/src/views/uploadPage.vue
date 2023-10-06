<!--
	TODO
	- figureout the how to upload file name form the index.js file.
	- figureout how to upload the correct file datatype form the index.js file.
	- restrict users from uploading any file type other than jpg. 
	- add not null.
-->
<!-- eslint-disable prettier/prettier -->
<script setup>
import Cropper from "vue-cropperjs";
import "cropperjs/dist/cropper.css";
import axios from "axios";
import ExifReader from "exifreader";
import { ref, reactive } from "vue";
import MoonRegistration from "../moon-registration";

//This is the ref to the cropper DOM element
const cropr = ref(null);

let data = reactive({
  // "META DATA"
  image: "",
  // Message for displaying success or failure when uploading
  message: "",
  // Tracks if image has meta data

  //I think more appropriate name would be hasRequiredMetadata as exifReader is able to read tags for any image file
  hasExif: true,
  maxFileSize: 30_000_000, //30MB max file size
  fileSizeExceeded: false,
  latitude: "",
  longitude: "",
  altitude: "",
  timeStamp: "",
  // Tracks date input if there isn't meta data
  date: "",
  // Tracks time input if there isn't meta data
  time: "",
  file: null,
  imageDataUrl: null,
  showCropper: false,
  croppedImage: null,
});
function onFileChange(e) {
  //TODO check that the file uploaded is a valid image file
  const files = e.target.files;

  if (files.length > 0) {
    data.file = files[0];
    if (data.file.size <= data.maxFileSize) {
      data.fileSizeExceeded = false;
      const reader = new FileReader();
      updateMetaData();
      checkForMissingMetaData();
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
      data.message = "Max upload file size exceeded";
    }
  }
}

async function checkForMissingMetaData() {
  try {
    const tags = await ExifReader.load(data.file);
    // const requiredMetaData = [tags.GPSLatitudeRef, tags.GPSLongitudeRef, tags.GPSLatitudeRef, tags.]
    if (
      tags.GPSLatitude &&
      tags.GPSLongitude &&
      tags.Altitude &&
      tags.DateTimeOriginal &&
      tags.Make &&
      tags.Model
    ) {
      data.hasExif = true;
    } else {
      data.hasExif = false;
      data.message =
        "Missing some required metadata, please input them manually";
    }
  } catch (error) {
    console.log(error);
  }
}
// Credit goes to Youssef El-zein.
//This is modified code from his work on the MoonTrek site.
async function updateMetaData() {
  try {
    const tags = await ExifReader.load(data.file);
    console.log(tags);

    // If so, keep imageData.hasExif true
    data.hasExif = true;
    // Set the date
    if (tags.GPSLongitude && tags.GPSLatitude) {
      // Keep all North latitude values positive
      // and make South latitude values negative
      if (tags.GPSLatitudeRef.value[0] === "N") {
        data.latitude = tags.GPSLatitude.description;
      } else {
        data.latitude = -1 * tags.GPSLatitude.description;
      }

      // Keep all East longitude values positive
      // and make West longitude values negative
      if (tags.GPSLongitudeRef.value[0] === "E") {
        data.longitude = tags.GPSLongitude.description;
      } else {
        data.longitude = -1 * tags.GPSLongitude.description;
      }
    }
    if (tags.GPSAltitude) {
      data.altitude = tags.GPSAltitude.description;
    }
    if (tags.DateTimeOriginal) {
      // Get datetime in YYYY:MM:DD HH:MM:SS
      const imageDate = tags.DateTimeOriginal.description;
      //Split time and date
      const [datePart, timePart] = imageDate.split(" ");
      //Split date
      const [year, month, day] = datePart.split(":");
      //Reformat date into something compatible with the field.
      const temp_date = `${year}-${month}-${day}`;
      data.date = temp_date;
      data.time = timePart;
    }
    if (tags.Make && tags.Model) {
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
async function RunDetectMoon(_fileObject, _type = "square") {
  try {
    MoonRegistration.MoonDetection(_fileObject, _type, onMoonPositionUpdate);
  } catch (err) {
    data.message = err;
  }
}
async function onMoonPositionUpdate(new_position) {
  // TODO: set the cropping box to the moon_position
  console.log("moon_position:", new_position);
}
// function that gets the cropped image and sends it to server-side
async function uploadCroppedImage() {
  try {
    const imgFile = await new Promise((resolve) => {
      cropr.value.getCroppedCanvas().toBlob((img) => {
        resolve(img);
      });
    });
    const formData = new FormData();
    formData.append("lunarImage", imgFile, ".jpg");
    // make post request to upload image to database
    const res = await axios.post("http://localhost:3001/picUpload", formData, {
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
        <h2 class="txt up1">Upload and crop your image.</h2>
        <br />
        <input
          type="file"
          ref="lunarImage"
          accept="images/*"
          @change="onFileChange"
        />
        <br />
        <br />
        <cropper
          class="resize"
          ref="cropr"
          v-if="data.showCropper"
          :src="data.imageDataUrl"
          :zoomOnWheel="false"
          :zoomable="false"
          :zoomOnTouch="false"
          :movable="false"
          @ready="onCropperReady"
        />
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
                      <label class="label"> Latitude </label>
                      <div class="control">
                        <input
                          class="input"
                          type="number"
                          v-model="data.latitude"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="field">
                      <label class="label"> Longitude </label>
                      <div class="control">
                        <input
                          class="input"
                          type="number"
                          v-model="data.longitude"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="field">
                      <label class="label"> Altitude </label>
                      <div class="control">
                        <input
                          class="input"
                          type="number"
                          v-model="data.altitude"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="columns is-centered">
                  <div class="column is-one-fifth">
                    <div class="field">
                      <label class="label"> Date </label>
                      <div class="control">
                        <input class="input" type="date" v-model="data.date" />
                      </div>
                    </div>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="field">
                      <label class="label"> Time </label>
                      <div class="control">
                        <input class="input" type="time" v-model="data.time" />
                      </div>
                    </div>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="field">
                      <label class="label"> Instrument Make </label>
                      <div class="control">
                        <input class="input" type="text" v-model="data.make" />
                      </div>
                    </div>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="field">
                      <label class="label"> Instrument Model </label>
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
            <p id="status-message">
              {{ data.message }}
            </p>
          </div>
          <div v-if="data.croppedImage">
            <button
              type="button"
              class="btn btn-primary"
              @click="uploadCroppedImage"
            >
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  </body>
</template>

<!-- eslint-disable prettier/prettier -->
<style>
.move {
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
  background-color: #4caf50;
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
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.submit input[type="submit"]:hover {
  background-color: #ffff;
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

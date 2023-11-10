<!-- eslint-disable prettier/prettier -->
<script setup>
import Cropper from "vue-cropperjs";
import "cropperjs/dist/cropper.css";
import CryptoJS from 'crypto-js';
import axios from "axios";
import ExifReader from "exifreader";
import { ref, reactive } from "vue";
import MoonRegistration from "../moon-registration";
import config from "../../config/config.json";
import { nearestCity } from 'cityjs';

// This is the ref to the cropper DOM element
const cropr = ref(null);

let data = reactive({
  // "META DATA"
  image: "",
  // Message for displaying success or failure when uploading
  message: "",
  // Tracks if image has meta data
  hasExif: true,
  maxFileSize: 30 * 1024 * 1024, //max file size 30MB
  fileSizeExceeded: false,
  isValidFileType: false,
  latitude: '',
  longitude: '',
  inValidCoords: null,
  altitude: '',
  timeStamp: '',
  // Data retrieved from RunMoonDetect()
  moon_position: null,
  moon_position_circle: null,
  // Tracks date input if there isn't meta data
  date: '',
  // Tracks time input if there isn't meta data
  time: '',
  iframe:{
		src: ""
	},
  file: null,
  fileType: '',
  imageDataUrl: null,
  imageHash: null,
  showCropper: false,
  croppedImage: null,
  mapReady: false
})

//function when user clicks no -that location on OpenStreetMaps is wrong
function closeMapAndResetLatLonFields(){
	data.mapReady = false;
	data.latitude = '';
	data.longitude = '';
}

//lat range -90 - 90, lon -180 - 180, would cause error on OpenStreetMaps if not valid lat and lon
function validateCoords(){
	if(data.latitude >= -90 && data.latitude <= 90){
		if(data.longitude >= -180 && data.longitude <= 180){
			data.message = ""
			showCoordsOnMap()
		}
	}else{
		data.invalidCoords = true;
		data.message = "Invalid coordinates";
		data.latitude = "";
		data.longitude = "";
	}
	
}

function showCoordsOnMap(){
	const city = nearestCity({latitude: data.latitude, longitude: data.longitude});
	const qParam = city.name.replace(" ", "+");
  
  // lat, lon, zoom to OSM bounding box
  // https://stackoverflow.com/a/17811173
  function rad2deg(radians)
  {
    var pi = Math.PI;
    return radians * (180/pi);
  }
  function deg2rad(degrees)
  {
    var pi = Math.PI;
    return degrees * (pi/180);
  }
  // trigonometry sec function
  function sec(val) {
    return 1/Math.cos(val);
  }
  
  function getTileNumber(lat, lon, zoom) {
    let xtile = Number.parseInt( (lon+180)/360 * 2**zoom ) ;
    let ytile = Number.parseInt( (1 - Math.log(Math.tan(deg2rad(lat)) + sec(deg2rad(lat)))/Math.PI)/2 * 2**zoom ) ;
    return [xtile, ytile];
  }
  
  function getLonLat(xtile, ytile, zoom) {
    let n = 2 ** zoom;
    let lon_deg = xtile / n * 360.0 - 180.0;
    let lat_deg = rad2deg(Math.atan(Math.sinh(Math.PI * (1 - 2 * ytile / n))));
    return [lon_deg, lat_deg];
  }
  
  // convert from permalink OSM format like:
  // http://www.openstreetmap.org/?lat=43.731049999999996&lon=15.79375&zoom=13&layers=M
  // to OSM "Export" iframe embedded bbox format like:
  // http://www.openstreetmap.org/export/embed.html?bbox=15.7444,43.708,15.8431,43.7541&layer=mapnik
  
  function LonLat_to_bbox(lat, lon, zoom) {
    let width = 425;
    let height = 350; // note: must modify this to match your embed map width/height in pixels
    let tile_size = 256;
    
    let [xtile, ytile] = getTileNumber (lat, lon, zoom);
    
    let xtile_s = (xtile * tile_size - width/2) / tile_size;
    let ytile_s = (ytile * tile_size - height/2) / tile_size;
    let xtile_e = (xtile * tile_size + width/2) / tile_size;
    let ytile_e = (ytile * tile_size + height/2) / tile_size;
    
    let [lon_s,lat_s] = getLonLat(xtile_s, ytile_s, zoom);
    let [lon_e,lat_e] = getLonLat(xtile_e, ytile_e, zoom);
    
    let bbox = [lon_s,lat_s,lon_e,lat_e];
    return bbox;
  }
  
  let bbox = LonLat_to_bbox(city.latitude,city.longitude,9.5);
  let bbox_str = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]},`
  
  data.iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox_str}&layer=mapnik&marker=${city.latitude},${city.longitude}`
	data.mapReady = true;
}

function getScaledCropData() {
  // Gets cropBoxData and scales it up to the scale of the original image.
  try {
    const canvasWidth = cropr.value.getCanvasData().width;
    const canvasNaturalWidth = cropr.value.getCanvasData().naturalWidth;
    const { left, top, width, height } = cropr.value.getCropBoxData();
    // The crop box x, y, width and height are all scaled from the canvas scale to the original image scale.
    return {
      x: (left * canvasNaturalWidth) / canvasWidth,
      y: (top * canvasNaturalWidth) / canvasWidth,
      width: (width * canvasNaturalWidth) / canvasWidth,
      height: (height * canvasNaturalWidth) / canvasWidth,
    };
  } catch (error) {
    console.log(error);
  }
}

async function onCropperReady() {
  try {
    // The Cropper canvas scales down so the crop box needs to compensate for the scale.
    // naturalWidth and naturalHeight are the original dimensions of the image.
    // The width and height both scale equally so only width will be used.
    const { width, naturalWidth } = cropr.value.getCanvasData();
    // left, top, width and height are all scaled by width/naturalWidth.
    const initialCropData = {
      left: (data.moon_position.x * width) / naturalWidth,
      top: (data.moon_position.y * width) / naturalWidth,
      width: (data.moon_position.width * width) / naturalWidth,
      height: (data.moon_position.width * width) / naturalWidth,
    };
    cropr.value.setCropBoxData(initialCropData);
  } catch (error) {
    console.log(error);
  }
}

//checks bytes of file header to check file type because human readable MIME type can be manipulated
function checkFileType(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let header = "";
    reader.onload = (e) => {
      let fileType = "";
      let arr = new Uint8Array(e.target.result).subarray(0, 16);

      // for (let i = 0; i < arr.length; i++) {
      //   header += arr[i].toString(16);
      // }
      let dataview = new DataView(arr.buffer);

      // hexadecimal representation of those file extensions.
      // References:
      // https://mimesniff.spec.whatwg.org/#matching-an-image-type-pattern
      // https://en.wikipedia.org/wiki/List_of_file_signatures
      if (dataview.getUint16(0,false) == 0x424d) {
        fileType = "bmp";
      } else if (dataview.getUint32(0,true) & 0x00ffd8ff > 0) {
        fileType = "jpg";
      } else if (dataview.getUint32(0,true) & 0x00474e50 > 0) {
        fileType = "png";
      } else if (dataview.getUint32(0,false) == 0x52494646 && dataview.getUint32(8,false) == 0x57454250) {
        fileType = "webp";
      } else {
        fileType = "invalid";
        data.message = "File type not accepted";
      }

      data.fileType = fileType;
      data.isValidFileType = fileType !== "invalid" ? true : false;
      resolve({ fileType: data.fileType, isValidFileType: data.isValidFileType });
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function onFileChange(e) {
  const files = e.target.files;

  if (files.length > 0) {
    data.file = files[0];
    checkFileType(data.file).then(() => {
      if (data.isValidFileType) {
        if (data.file.size <= data.maxFileSize) {
          data.fileSizeExceeded = false;
          data.message = "";
          // force cropper js to reload imageDataUrl
          data.imageDataUrl = "";
          data.imageHash = "";
          data.showCropper = false;
          const reader = new FileReader();
          updateMetaData();
          reader.onload = (e) => {
            data.imageDataUrl = e.target.result;
            data.showCropper = true;
            data.croppedImage = true;
            // DataUrl looks like:
            // data:<MIME-TYPE>;base64,<BASE-64 DATA>
            // we need to extract only the <BASE-64 DATA> part
            let b64content = e.target.result.substr(e.target.result.indexOf(';base64,')+8)
            data.imageHash = CryptoJS.MD5(CryptoJS.enc.Base64.parse(b64content)).toString();
            console.log(data.imageHash)
          };
          reader.readAsDataURL(data.file);
          RunDetectMoon(data.file);
        } else {
          data.fileSizeExceeded = true;
          data.message = "Max upload file size of 30MB exceeded";
        }
      }
    });
  }
}

// Credit goes to Youssef El-zein.
// This is modified code from his work on the MoonTrek site.
async function updateMetaData() {
  try {
    const tags = await ExifReader.load(data.file);

    // If so, keep imageData.hasExif true
    data.hasExif = true;
    // Set the date
    if (tags.GPSLongitude && tags.GPSLatitude) {
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
    if (tags.GPSAltitude) {
      //.slice removes last 2 characters (blank space and m)
      data.altitude = tags.GPSAltitude.description.slice(0, -2);
    }
    if (tags.DateTimeOriginal) {
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
    MoonRegistration.MoonDetection(_fileObject, _type, onMoonPositionUpdate)
  } catch (err) {
    data.message = err;
  }
}
async function onMoonPositionUpdate(new_position_circle, new_position) {
  data.moon_position_circle = { x: new_position_circle.x, y: new_position_circle.y, radius: new_position_circle.radius };
  if (new_position.type == "square") {
    data.moon_position = { x: new_position.x, y: new_position.y, width: new_position.width }
    console.log('moon_position:',data.moon_position)
  }
}
// function that gets the cropped image and sends it to server-side
async function uploadCroppedImage() {
  try {
    // make post request to upload image to database
    let img_filename = `${data.imageHash}.${data.file.type.split('/')[1]}`;
    let metadata_params = {
      "instrument": {
        "inst_type": "phone", // TODO: add additional drop-down menu for instrument type. ("phone", "camera", "phone+telescope", "camera+telescope")
        "inst_make": data.make,
        "inst_model": data.model
      },
      "image": {
        "img_name": img_filename,
        "img_type": data.file.type,
        "img_uri": './'+img_filename, // TODO: file uri should be determined by the server
        "img_altitude": Number.parseFloat(data.altitude),
        "img_longitude": Number.parseFloat(data.longitude),
        "img_latitude": Number.parseFloat(data.latitude),
        "img_timestamp": Math.floor((new Date()).getTime() / 1000), // TODO: derive image's original unix timestamp when taken from geolocation & datetime
      },
      "moon": {
        "moon_detect_flag": 1,
        "moon_exist_flag": 1,
        "moon_loc_x": data.moon_position_circle.x,
        "moon_loc_y": data.moon_position_circle.y,
        "moon_loc_r": data.moon_position_circle.radius
      }
    }
    const meta_res = await axios.post(
      `${config.backend_url}/api/picMetadata`,
      metadata_params,
      { withCredentials: true, }
    );

    if (meta_res.status == 200) {
      const imgFile = await new Promise(resolve => {
        cropr.value.getCroppedCanvas().toBlob(img => {
          resolve(img);
        });
      });
      const formData = new FormData();
      formData.append(
        "lunarImage",
        // we can rename imgFile by re-create a new File obj
        new File([imgFile], metadata_params.image.img_name, {type: data.fileType}),
        data.fileType
      );
      const upload_res = await axios.post(
        `${config.backend_url}/api/picUpload?upload_uuid=${meta_res.data.upload_uuid}`,
        formData,
        { withCredentials: true }
      );

      const { status } = upload_res.data;
      console.log(`status: ${status}`);

      data.message = status;
    }

  } catch (err) {
    data.message = err;
  }
}
</script>

<!-- eslint-disable prettier/prettier -->

<template>
  <body class="background">
    <div class="content-block d-flex justify-content-center align-items-center">
      <div class="padding1">
        <h2 class="txt up1">Upload and crop your image.</h2>
        <br />
        <input
          type="file"
          accept=".jpg,.png,.webp,.bmp,.jpeg"
          ref="lunarImage"
          @change="onFileChange"
        />
        <br />
        <br />
        <cropper
          class="resize"
          ref="cropr"
          v-if="data.showCropper && data.moon_position"
          :src="data.imageDataUrl"
          :zoomOnWheel="false"
          :zoomable="false"
          :zoomOnTouch="false"
          :movable="false"
          :viewMode="3"
          :restore="false"
          :responsive="false"
          :aspectRatio="1"
          :scaleX="1"
          :scaleY="1"
          @ready="onCropperReady"
        />
      </div>
      <div class="status-message" v-if="fileSizeExceeded || !isValidFileType || invalidCoords">
        {{ data.message }}
      </div>
	  <div v-if="data.mapReady">
    <iframe width="450" height="250"
      frameborder="0" style="border:0"
      referrerpolicy="no-referrer-when-downgrade"
      :src="data.iframe.src"
      allowfullscreen
    >
    </iframe>
		<p>Can you confirm location from where Moon shot was taken?</p>
		<button @click="closeMapAndResetLatLonFields">No</button>
		<button @click="uploadCroppedImage">Yes</button>
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
						  min="-90"
						  max="90"
						  required
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
						  min="-180"
						  max="180"
						  required
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
						  required
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
                        <input class="input" type="date" v-model="data.date" required/>
                      </div>
                    </div>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="field">
                      <label class="label"> Time </label>
                      <div class="control">
                        <input class="input" type="time" v-model="data.time" required />
                      </div>
                    </div>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="field">
                      <label class="label"> Instrument Make </label>
                      <div class="control">
                        <input class="input" type="text" v-model="data.make" required />
                      </div>
                    </div>
                  </div>
                  <div class="column is-one-fifth">
                    <div class="field">
                      <label class="label"> Instrument Model </label>
                      <div class="control">
                        <input class="input" type="text" v-model="data.model" required />
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
            <button
              type="button"
              class="btn btn-primary"
              @click="validateCoords"
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
  .content-block {
    font-family: monospace;
    max-width: 100rem;
    background-color: #3C3C3C; 
    padding: 30px;
    margin-top: 20px;
    border: 2px solid #E6E6E6; 
    margin-left: auto;
    margin-right: auto;
  }

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
  display: flex;
  max-width: 800px;
  margin: 0 auto;
}

@media (min-width: 180px) and (max-width: 900px) {
  .container {
    /* flex-wrap: wrap; */
    flex-direction: column;
  }
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



#image-upload,
.status-message {
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
    margin-top: 0.5rem;
  }
}
</style>

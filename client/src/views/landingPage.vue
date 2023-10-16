
<script setup>
import config from "../../config/config.json";
let data = {
    imageSrc: "src/assets/YourMoon.png"
}
async function google() {
    window.open(config.backend_url+"/api/auth/google", "_self")
}

async function github() {
    window.open(config.backend_url+"/api/auth/github", "_self")
}
</script>
<template>
    <div id="landing-page">
      <div class="header">
        <h1>Welcome to Your Moon!</h1>
        <p>A student led data collection project for the development of Moon Trek AR.</p>
      </div>
      <div class="content-block">
        <h2>About Your Moon</h2>
        <p>Your Moon is a website that is developed and run by Cal State LA students that is open to the public in collaboration with the Jet Propulsion Laboratory (JPL). CSULA students are currently working on an AR application that will display overlays provided by NASA’s MoonTrek website images taken by telescope users. Just like this!</p>
        <img v-if="data.imageSrc" :src="data.imageSrc" alt="Moon Trek AR Example" />
        <p>
            To learn more about MoonTrek, visit:
            <a href="https://trek.nasa.gov/moon/">Moon Trek</a>
        <br>
        In order to develop this application so that it works for everyone’s Moon we need images of the Moon taken from telescopes from around the world. We are building this site in order to gather images from a wide range of locations and times in order to test and develop different models that students here at Cal State LA are creating.
        </p>
        <p>
        (To ensure the universal functionality of this application, the acquisition of lunar images captured by telescopes worldwide is paramount. Our objective in constructing this platform is to assemble a diverse collection of lunar imagery from various geographic locations and timeframes. This invaluable dataset serves as a foundational resource for rigorous testing and refinement of multiple models, which are being developed by students at Cal State LA. Through this collaborative effort, we aim to offer an application that caters to the lunar exploration needs of individuals worldwide)
        </p>
        <p>
        Your Moon collectively obtains user images of the Moon, allowing students to gather images that have meta data. Images uploaded by citizen scientists will be stored, in addition to metadata extracted from them. Metadata will then be used to show users their location as well as their latitude and longitude while also providing further information. Extracting metadata will also allow students to use it for 2023-2024 senior design MoonTrek. Your Moon is the foundation of MoonTrek AR. 
        </p>
        <p>
        Don’t fret, all of your data is anonymized and your image cannot be traced back to you!
        </p>
        <p>
        Given the nature of the project we ask that you please verify yourself with a google account before uploading.
            

        </p>
        <div class="login-container">
        <button class="google-btn" @click="google">
            <img src="@/assets/google_logo.svg" alt="Google Logo" class="google-logo">
            Sign in with Google
        </button>
        </div>
    <div class="credit-section">
      <p>GIF courtesy of <a href="https://www.newgrounds.com/art/view/gold356/the-moon-in-pixel-art-32x32">gold356</a></p>
    </div>
      </div>
    </div>
  </template>
  
  
  <style scoped>
  #landing-page {
    font-family: 'Arial', sans-serif;
    background-color: black; 
    color: #E6E6E6; 
    padding: 20px;
  }
  
  .header {
    background-color: #4A4A4A;
    max-width: 100rem; 
    padding: 20px;
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }

  
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
  
  h1, h2 {
    color: #00bd7e; 
  }
  
  p {
    font-size: 16px;
    margin-top: 20px;
  }
  
  img {
    max-width: 100%;
    height: auto;
    margin-top: 20px;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height:100;
    }
    .google-btn {
        display: flex;
        align-items: center;
        padding: 10px 20px;
        border: none;
        background-color: #4285F4;
        color: white;
        font-family: Arial, sans-serif;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;
        height: 75px;
        width: 200;
    }
    .google-btn:hover {
        background-color: #357ABD;
    }
    .google-logo {
        width: 24px;
        height: 24px;
        margin-right: 10px;
        margin-top:auto;
        margin-bottom:auto;
    }
    .credit-section {
        margin-top: 30px;
        font-size: 12px;
        text-align: center;
    }

    .credit-section a {
        color: #FFD700;
        text-decoration: none;
    }
        
  </style>
<script setup>
import config from "../../config/config.json";


async function google() {
    window.open(config.backend_url + "/api/auth/google", "_self");
}

async function github() {
    window.open(config.backend_url + "/api/auth/github", "_self");
}
</script>

<template>
  <main class="main">
    <div class="columns">
      <div class="column is-two-thirds-desktop is-6-tablet has-text-white custom-box">
        <h1 class="mt-4">Welcome</h1>
        <p>
          Welcome to YourMoon, a web application inviting users to submit images of their Moon. Explore your lunar captures with labels from NASA JPL's MoonTrek, aiding the 'MoonTrek AR' team in gathering data.
        </p>
        <h1>What is YourMoon?</h1>
        <p>
          YourMoon is a vital component of an ongoing Capstone Senior Design project, a collaborative effort between NASA's JPL and California State University, Los Angeles (CSULA). The primary objective is to create a user-friendly interface for <a href='https://yourlinktomoontrek.com'>Moon Trek</a>, a powerful NASA tool empowering users to delve into the mysteries of the lunar by offering user-friendly tools that simplify browsing, data layering, and detailed feature searches. YourMoon invites users to contribute their Moon images and utilize NASA JPL's MoonTrek data, aiding the 'MoonTrek AR' team in their data collection endeavors. The metadata provided by users is kept anonymous and used strictly for research purposes.
          <img src="../assets/moon_overlay.png" alt="moon" class="moon_img">
        </p> 
      </div>

      <div class="column is-one-third-desktop is-6-tablet has-text-white custom-box">
        <article class="message">
          <div class="message-header">
            <p class="message-title has-text-white">UPLOAD YOUR MOON IMAGES</p>
          </div>
          <div class="message-body has-text-white">
            <p>
              For enhanced security measures, we kindly ask you to log in using your 
              preferred email address. This ensures a secure interaction for both you 
              and our system. Thank you.
              <br /><br />
              <div style="text-align: center;">
                <button class="button is-warning is-rounded" @click="google">Sign in</button>
              </div>
            </p>
          </div>
        </article>
        <article class="message">
          <div class="message-header">
            <p class="message-title has-text-white">MoonTrek AR</p>
          </div>
          <div class="message-body has-text-white">
            <p>
              MoonTrek AR, an innovative project, aims to advance lunar education and exploration using augmented reality (AR). 
              It generates precise 3D models, allowing users to immerse themselves in the Moon's surface at the time of their photos.
              By integrating NASA's Moon Trek data, it offers overlays from missions and telescopes. Explore past and current lunar missions, 
              historic landmarks, and craters in an interactive portal. To learn more, visit
              <a href="https://ascent.cysun.org/project/project/view/208">
                <button class="button is-warning is-rounded">MoonTrek AR</button>
              </a>
            </p>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<style>
.main {
  padding: 20px;
  padding-left: 75px;
  padding-right: 75px;
  background-image: url("../assets/galaxy_01.png");
}

.custom-box {
  padding-top: 1px;
  padding-bottom: 10px;
  padding-left: 20px;
  margin-bottom: 20px;
  background-color: #050608;
  border: 2px solid #3a3a3a;
  border-radius: 5px;
}

.moon_img {
  max-width: 100%;
  height: auto;
  display: block;
  margin-top: 1.5rem;
  margin-right: auto;
}

.button {
  margin-left: auto;
  margin-right: auto;
  background-color: #645394;
  color: #ffffff;
}

.columns {
  display: flex;
  flex-wrap: wrap;
}

.column {
  flex: 1 0 100%;
}

@media (min-width: 769px) {
  .column {
    flex: 1 0 50%;
  }
}

.message {
  padding-top: 20px;
  padding-left: 10px;
  padding-right: 10px;
  background-color: rgba(2, 4, 3, 0.7);
  margin-bottom: 2px;
  color: #ffffff;
}

.message-header {
  background-color: #232022;
  font-size: 1.25rem;
  font-weight: bold;
  font-family: 'Roboto', monospace;

}

.message-body {
  background-color: #101026;
}
</style>

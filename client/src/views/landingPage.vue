<script setup>
import config from "../../config/config.json";
import { onBeforeMount, ref } from "vue";
import Cookies from "js-cookie";
const authenticated = ref(false);

onBeforeMount(() => {
  authenticated.value = Cookies.get("token") ? true : false;
});

const isExpanded = ref(false);
const isOptIn = ref(false);

async function google() {
  window.open(
    config.backend_url + `/api/auth/google?isOptIn=${isOptIn.value}`,
    "_self"
  );
}

async function github() {
  window.open(
    config.backend_url + `/api/auth/github?isOptIn=${isOptIn.value}`,
    "_self"
  );
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}
</script>

<template>
  <body class="bodywrap">
    <div class="page-wrap">
      <div class="the-content">
        <div class="row">
          <!-- LeftHand Column -->
          <div class="col-xs-12 col-md-8">
            <h1>Welcome</h1>
            <p>
              Welcome to YourMoon, a web application inviting users to submit
              images of their Moon. Explore your lunar captures with labels from
              NASA JPL's MoonTrek, aiding the 'MoonTrek AR' team in gathering
              data.
            </p>

            <h1>What is YourMoon?</h1>
            <p>
              YourMoon is a vital component of an ongoing Capstone Senior Design
              project, a collaborative effort between NASA's JPL and California
              State University, Los Angeles (CSULA). The primary objective is to
              create a user-friendly interface for
              <a target="_blank" href="https://trek.nasa.gov/moon/">Moon Trek</a
              >, a powerful NASA tool empowering users to delve into the
              mysteries of the lunar by offering user-friendly tools that
              simplify browsing, data layering, and detailed feature searches.
              YourMoon invites users to contribute their Moon images and utilize
              NASA JPL's MoonTrek data, aiding the 'MoonTrek AR' team in their
              data collection endeavors. The metadata provided by users is kept
              anonymous and used strictly for research purposes.
            </p>
            <p class="moonImageContainer">
              <img
                src="../assets/moon_overlay.png"
                alt="moon"
                class="moon_img"
              />
            </p>
          </div>

          <!-- RightHand Column -->
          <div class="col-xs-6 col-md-4">
            <!-- Upload Card -->
            <div v-if="!authenticated" class="card">
              <div class="card-header text-left">UPLOAD YOUR MOON</div>
              <div
                class="card-body d-flex justify-content-center align-items-center flex-column"
              >
                <p class="card-text">
                  For enhanced security measures, we kindly ask you to log in
                  using your preferred email address. This ensures a secure
                  interaction for both you and our system. Thank you.
                </p>
                <button
                  type="button"
                  class="btn btn-secondary mt-1 btn-md btn-block btn-warning"
                  @click="google"
                >
                  Sign in with Google
                </button>
                <button
                  type="button"
                  class="btn btn-secondary mt-1 btn-md btn-block btn-warning"
                  @click="github"
                >
                  Sign in with GitHub
                </button>
                <input type="checkbox" id="isOptIn" v-model="isOptIn" />
                <label for="isOptIn"
                  >Opt in to receive future emails on the project</label
                >
              </div>
            </div>

            <!-- Additional Card -->
            <div class="card mt-4">
              <div class="card-header text-left">MOONTREK AR TEAM</div>
              <div
                class="card-body d-flex justify-content-center align-items-center flex-column"
              >
                <p class="card-text">
                  For enhanced security measures, we kindly ask you to log in
                  using your preferred email address. This ensures a secure
                  interaction for both you and our system. Thank you.
                </p>

                <div v-if="isExpanded">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Integer nec odio. Praesent libero. Sed cursus ante dapibus
                    diam.
                  </p>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Integer nec odio. Praesent libero. Sed cursus ante dapibus
                    diam.
                  </p>
                  <p>
                    Lorem ipsum dorlor sit amet, consectetur adipiscing elit.
                    Integer nec odio. Praesent libero. Sed cursus ante dapibus
                    diam.
                  </p>
                </div>
                <button
                  type="button"
                  class="btn btn-secondary mt-1btn-md btn-block btn-warning"
                  @click="toggleExpand"
                >
                  {{ isExpanded ? "Read Less" : "Read More" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</template>

<style scoped>
body,
html {
  background: #212529;
  margin: 0;
}

.the-content {
  width: 100%;
}

.row {
  padding-top: 25px;
  padding-left: 55px;
  padding-right: 30px;
  color: #ffff;
  background: #212529;
  width: 100%;
}

.upload h4 {
  color: #ffff;
  font-size: 1.5rem;
}

.card {
  border: none;
  background-color: #303639;
  font-weight: bold;
  text-align: left;
  margin: 0px -16px;
  padding-bottom: 20px;
  width: calc(100% + 32px);
}

p {
  margin: 0 0 1.5em 0;
  margin-bottom: 1.5em;
  padding-right: 25px;
}

.wrap {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  padding: 0 16px;
}

.moon_img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
}
</style>

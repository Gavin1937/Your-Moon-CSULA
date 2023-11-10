
import { createRouter, createWebHistory } from "vue-router";
import uploadPage from "../views/uploadPage.vue";
import landingPage from "../views/landingPage.vue";

import axios from 'axios';
import config from "../../config/config.json";
const routes = [
    {path: '/upload', name: 'Upload', component: uploadPage, meta:{requiresAuth:true}},
    {path: '/', name: 'LandingPage', component: landingPage}
]

const isAuthenticated = async () => {
  try {
    const res = await axios.get(config.backend_url + '/api/verifyUser', {
      withCredentials: true
    });

    if (res.status === 200) {
      console.log('Call succeeded');
      return true;
    } else {
      console.error('Failed to check authentication');
      return false;
    }

  } catch (error) {
    console.error('Failed to check authentication', error);
    return false;
  }
};
  



const router = createRouter({
    history: createWebHistory(),
    routes
})


router.beforeEach(async (to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      next({
        path: '/',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next(); 
  }
});
export default router


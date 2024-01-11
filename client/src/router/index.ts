
import { createRouter, createWebHistory } from "vue-router";
import uploadPage from "../views/uploadPage.vue";
import landingPage from "../views/landingPage.vue";
// EDIT SJ create contact page and route 
import contactPage from "../views/contactPage.vue";

import axios from 'axios';
import config from "../../config/config.json";
const routes = [
    {path: '/upload', name: 'Upload', component: uploadPage, meta:{requiresAuth:false}},
    {path: '/', name: 'LandingPage', component: landingPage},
    {path: '/contact', name: 'ContactPage', component: contactPage}
]

const isAuthenticated = async () => {
  try {
    const res = await axios.get(config.backend_url + '/api/verifyUser', {
      withCredentials: true
    });
    
    return (res.status === 200 && res.data.verified);
    
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
      console.log('Bad authentication');
      next({
        path: '/',
        query: { redirect: to.fullPath }
      });
    } else {
      console.log('Good authentication');
      next();
    }
  } else {
    console.log('No authentication needed');
    next(); 
  }
});
export default router


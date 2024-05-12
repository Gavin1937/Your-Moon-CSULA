import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { checkCookie } from "./authUtils";
import Cookies from "js-cookie";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("@/views/landingPage.vue"),
    },
    {
      path: "/contact",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("@/views/contactPage.vue"),
    },
    {
      path: "/upload",
      component: () => import("@/views/uploadPage.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/authenticate",
      component: () => import("@/views/authPage.vue"),
    },
  ],
});

router.beforeEach(async (to, from) => {
  const auth = useAuthStore();
  try {
    const token = Cookies.get("token");
    //if token exists by default we assume it's valid
    //true if token is non empty string, false if token is undefined
    let authenticated = token ? true : false;
    console.log(authenticated);
    const currTime = Date.now();

    const timeSinceSignIn = currTime - auth.signInTime;

    //We only check if cookie is still valid after 1 hour passed since user logged in
    //(1 hour is cookie life of guest user). We do this to limit verifyUser endpoint
    //which checks if cookie is still valid
    //3,600,000 ms in an hour
    if (timeSinceSignIn > 3_600_000) authenticated = await checkCookie();

    if (to.meta.requiresAuth && !authenticated) return { path: "/" };
  } catch (error) {
    console.log(error);
    return { path: "/" };
  }
});

export default router;

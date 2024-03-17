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
    let authenticated = false;
    const token = Cookies.get("token");
    const currTime = Date.now();
    const timeSinceSignIn = currTime - auth.signInTime;
    //3_600_000ms in 1 hour, if 1 hour passed since user logged in and cookie still exist
    //we verify if cookie is still valid(cookie only expires after 1 hour for guest users
    // and 2 days for regular users). We implement this to limit calling the verifyUser
    //endpoint which checks if the cookie is valid
    if (token && timeSinceSignIn < 3_600_000) authenticated = true;
    else authenticated = await checkCookie();
    if (to.meta.requiresAuth && !authenticated) {
      return { path: "/" };
    }
  } catch (error) {
    console.log(error);
    return { path: "/" };
  }
});

export default router;

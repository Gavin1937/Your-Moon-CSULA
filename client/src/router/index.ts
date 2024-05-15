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
    //if page requires auth and token doesn't exist or
    //auth.signInTime is 0 (user didn't login, probably just manually added token) kick to homepage,
    //go to authUtils file to see implementation of checkCookie
    if (to.meta.requiresAuth) {
      const token = Cookies.get("token");
      if (!token || auth.signInTime == 0) {
        auth.signOut(); //clears authStore in session storage and token in cookie
        return { path: "/" };
      } else {
        const isValid = await checkCookie(token, auth.signInTime);
        if (!isValid) {
          auth.signOut();
          return { path: "/" };
          //if cookie has been verified and over 1 hour has passed, set auth.signInTime to current time/time since
          //cookie verified
        } else if (isValid == "update time")
          auth.signInTime = Math.floor(Date.now() / 1000);
      }
    }
  } catch (error) {
    console.log(error);
    return { path: "/" };
  }
});

export default router;

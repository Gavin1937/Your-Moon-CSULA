import { createRouter, createWebHistory } from "vue-router";
// import { useAuthStore } from "@/stores/authStore";
import { checkCookie } from "./authUtils";

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
  try {
    const authenticated = await checkCookie();

    if (to.meta.requiresAuth && !authenticated)
      //if not authenticated return to home page
      return {
        path: "/",
      };
  } catch (error) {
    console.log(error);
    return {
      path: "/",
    };
  }
});

export default router;

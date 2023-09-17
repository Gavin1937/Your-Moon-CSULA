import { createRouter, createWebHistory } from "vue-router";
import uploadPage from "../views/uploadPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "upload",
      component: () => import("../views/uploadPage.vue"),
    },

  ],
});

export default router;





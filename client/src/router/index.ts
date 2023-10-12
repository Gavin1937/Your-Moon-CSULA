import { createRouter, createWebHistory } from "vue-router";
import uploadPage from "../views/uploadPage.vue";
import loginPage from "../views/loginPage.vue";


// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes: [
//     {
//       path: "/",
//       name: "upload",
//       component: () => import("../views/uploadPage.vue"),
//     },
//     {
//       path: "/login",
//       name: "login",
//       component: () => import("../views/loginPage.vue")
//     }
//   ],
// });

// export default router;

const routes = [
    {path: '/upload', name: 'Upload', component: uploadPage},
    {path: '/login', name: 'Login', component: loginPage}
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router


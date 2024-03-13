<script setup>
import { useRouter } from "vue-router";
import { onBeforeMount } from "vue";
import { useAuthStore } from "@/stores/authStore.js";
import axios from "axios";
import config from "../../config/config.json";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import checkCookie from "../router/checkCookie.js";

// const auth = useAuthStore();
// const router = useRouter();
// onBeforeMount(aysnc() => {
//   const authenticated = await checkCookie()
//   if(authenticated)
// })
// onBeforeMount(async () => {
//   const token = Cookies.get("token");
//   console.log(token);
//   if (token != null || token != undefined) {
//     // const res = await axios.get(`${config.backend_url}/api/verifyUser`, {
//     //   headers: {
//     //     Authorization: `Basic ${token}`,
//     //   },
//     const res = await axios.get(`${config.backend_url}/api/verifyUser`, {
//       withCredentials: true,
//     });
//     console.log(res);
//     if (res.status === 200) router.push({ path: "/upload" });
//     else console.log(error);
//   }
// });

// function checkUserType() {
//   const token = Cookies.get("token");
//   const user = jwtDecode(token);
//   auth.userType = user.user_type;
//   auth.isAuthenticated = true;
//   router.push({ path: "/upload" });
// }
</script>
<template>Authenticating...</template>
../router/authUtils.js

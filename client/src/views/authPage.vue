<script setup>
import { useRouter } from "vue-router";
import { onBeforeMount } from "vue";
import { useAuthStore } from "@/stores/authStore.js";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const auth = useAuthStore();
const router = useRouter();

onBeforeMount(checkUserType);

function checkUserType() {
  const token = Cookies.get("token");
  const user = jwtDecode(token);
  // console.log(user.user_id);
  if (typeof user.user_id === "number") {
    auth.userType = "regular";
    auth.isAuthenticated = true;
  } else if (user.user_id.includes("sess")) {
    auth.userType = "guest";
    auth.isAuthenticated = true;
  }
  router.push({ path: "/upload" });
}
</script>
<template>Authenticating...</template>

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
  console.log(user.user_id);
  auth.userType = user.user_type;
  auth.isAuthenticated = true;
  router.push({ path: "/upload" });
}
</script>
<template>Authenticating...</template>

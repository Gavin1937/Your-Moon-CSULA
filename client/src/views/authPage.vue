<script setup>
import { useRouter } from "vue-router";
import { onBeforeMount } from "vue";
import { useAuthStore } from "@/stores/authStore.js";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const auth = useAuthStore();
const router = useRouter();

onBeforeMount(() => {
  const token = Cookies.get("token");
  const decoded = jwtDecode(token);
  auth.signInTime = decoded.iat;
  // auth.signInTime = token.iat;
  router.push({ path: "/upload" });
});
</script>
<template>Authenticating...</template>

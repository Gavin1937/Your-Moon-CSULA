<script setup>
import { useRouter } from "vue-router";
import { onBeforeMount } from "vue";
import { useAuthStore } from "@/stores/authStore.js";

const auth = useAuthStore();
const router = useRouter();

onBeforeMount(() => {
  auth.getCurrTime();
  router.push({ path: "/upload" });
});
</script>
<template>Authenticating...</template>

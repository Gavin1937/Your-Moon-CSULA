<script setup>
import { RouterView } from "vue-router";
import NavBar from "./components/NavBar.vue";
</script>

<template>
  <Suspense>
    <NavBar />
  </Suspense>
  <RouterView />
</template>

<style>
 {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Roboto", sans-serif;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 15px;
}
</style>

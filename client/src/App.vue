<script setup lang="ts">
  import NavBar from "./components/NavBar.vue";

  // export default {
  //         name: 'App',
  //         components: {
  //             NavBar
  //         }
  //     }
</script>


<template>

  <body>

    <NavBar />

    <RouterView />
    
  </body>

  <router-link to="/">About</router-link>
  <router-link to="/login">Login</router-link>


  
</template>

<style scoped>
body {
	background-color: black;
}






</style>



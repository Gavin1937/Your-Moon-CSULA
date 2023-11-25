<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const isBurgerActive = ref(false);

const toggleBurger = () => {
  isBurgerActive.value = !isBurgerActive.value;
};
</script>

<template>
  <header>
    <nav class="navbar">
      <div class="navbar-brand">
        <img src="../assets/yourmoon_circle.png" alt="logo" style="max-height: 80px"/>
        <a class="navbar-item is-flex is-align-items-center">
          <h1 class="your-text">Your</h1><h1 class="moon-text">Moon</h1>
        </a>
        <a @click="toggleBurger" class="navbar-burger is-size-6" :class="{ 'is-active': isBurgerActive }">
          <span></span>
          <span></span>
          <span></span>
        </a>
      </div>

      <div :class="{ 'is-active': isBurgerActive }" class="navbar-menu is-size-5 has-text-centered" id="nav-links">
        <div class="navbar-end">
          <RouterLink class="navbar-item is-warning" to="/" @click="toggleBurger">Home</RouterLink>
          <RouterLink class="navbar-item is-warning" to="/upload" @click="toggleBurger"> Upload</RouterLink>
        </div>
      </div>
    </nav>
  </header>
</template>

<style>
.navbar {
  background-color: #050608; 
}
.navbar-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  padding-left: 20px;
}
.navbar-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  text-decoration: none;
}
.navbar-burger {
  size: 10px;
}
.your-text {
  color: #fdba37;
  text-decoration: none; 
}
.moon-text {
  color: #ffffff;
  text-decoration: none; 
}
.navbar-item:hover {
  background-color: #645394;
  color: #ffffff;
}
.navbar-item:active {
  background-color: #645394;
  color: #ffffff;
}
.navbar-item:focus {
  background-color: #645394;
  color: #ffffff;
}
</style>

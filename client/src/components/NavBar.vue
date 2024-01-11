<script setup>
import { ref } from 'vue';

const isBurgerActive = ref(false);

const toggleBurger = () => {
  isBurgerActive.value = !isBurgerActive.value;
};
</script>

<template>
  <nav class="navbar navbar-expand-lg">
    <a href="/" class="navbar-brand">
      <img src="../assets/moon_phase.gif" alt="moon gif" style="max-height: 70px; margin-right: 8px;">
      <span class="brand-your" style="color: #ffb703;">Your</span>
      <span class="brand-moon" style="color: #fefae0;">Moon</span>
    </a>

    <button class="navbar-toggler" @click="toggleBurger" :class="{ 'is-active': isBurgerActive }">
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
    </button>
    <div :class="{ 'show': isBurgerActive }" class="collapse navbar-collapse justify-content-end" id="navbar-collapse">
      <ul class="nav navbar-nav">
        <li class="nav-item">
          <a class="nav-link" href="/">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/upload">Upload</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/contact">Contact</a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: #001219;
  padding: 0.5rem 1rem;
  font-weight: bold;
  color: #ffffff; 
}
.navbar-brand {
  font-size: 1.5rem;
  font-weight: bold;
  padding-left: 25px;
  font-family: 'Quicksand', monospace;
  justify-content: flex;
  align-items: center; 
  display: flex;
}
.brand-your {
  font-weight: bold;
}
.brand-moon {
  font-weight: bold;
}
.navbar-toggler {
  border: none; 
  background-color: transparent;
  color: #ffb703; 
}
.nav-link {
  color: #ffb703;
  font-size: 1.0rem;
  font-weight: bold;
  font-family: 'Quicksand', monospace;
}
.icon-bar {
  display: block;
  width: 22px;
  height: 2px;
  background-color: #ffb703;
  margin: 4px 0;
}
</style>

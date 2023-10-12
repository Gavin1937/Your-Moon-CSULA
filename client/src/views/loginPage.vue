

<template>
    <div class="container">
        <p>Login</p>
        <a @click="google">Login with Google</a>
        <a @click="facebook">Login with Facebook</a>
        <a @click="github">Login with GitHub</a>
    </div>
</template>

<script setup>
    async function google() {
        window.open("http://localhost:3001/auth/google", "_self")
        // await axios.get("http://localhost:3001/auth/google")
    }

    async function github() {
        window.open("http://localhost:3001/auth/github", "_self")
    }
</script>

<style>
    .container{
        background-color: aliceblue;
        display: flex;
        flex-direction:column;
    }
</style>
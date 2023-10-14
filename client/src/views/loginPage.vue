

<template>
    <div class="login-container">
    <button class="google-btn" @click="google">
        <img src="@/assets/google_logo.svg" alt="Google Logo" class="google-logo">
        Sign in with Google
    </button>
    </div>

</template>

<script setup>
    import config from "../../config/config.json";
    async function google() {
        window.open(config.backend_url+"/api/auth/google", "_self")
    }

    async function github() {
        window.open(config.backend_url+"/api/auth/github", "_self")
    }
</script>

<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height:100;
    }
    .google-btn {
            display: flex;
            align-items: center;
            padding: 10px 20px;
            border: none;
            background-color: #4285F4;
            color: white;
            font-family: Arial, sans-serif;
            cursor: pointer;
            border-radius: 4px;
            transition: background-color 0.2s;
            height: 75px;
            width: 200;
        }
        .google-btn:hover {
            background-color: #357ABD;
        }
        .google-logo {
            width: 24px;
            height: 24px;
            margin-right: 10px;
        }
</style>
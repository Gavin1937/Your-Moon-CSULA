import { defineStore } from 'pinia'
import { ref } from 'vue'
import config from "../../config/config.json";


export const useAuthStore = defineStore('AuthStore', () =>{
    const isAuthenticated = ref(false)
    const userType = ref('')
    function logout(){
        isAuthenticated.value = false
        userType.value = ""
        document.cookie = `token=${document.cookie.split('=')[1]}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
        window.location.href = config.backend_url + '/api/auth/logout'
    }
    return { isAuthenticated, userType, logout }
})
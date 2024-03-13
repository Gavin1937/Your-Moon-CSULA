import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore(
  "AuthStore",
  () => {
    const isAuthenticated = ref(false);
    const router = useRouter();
    const userType = ref("");
    function logout() {
      isAuthenticated.value = false;
      userType.value = "";
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push({ path: "/" });
    }
    return { isAuthenticated, userType, logout };
  },
  {
    persist: {
      storage: sessionStorage, //stores in session storage/same as cookie
      //so expires when session/cookie expires
    },
  }
);

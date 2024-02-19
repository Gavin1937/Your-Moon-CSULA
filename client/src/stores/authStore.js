import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";
import Cookies from "js-cookie";

export const useAuthStore = defineStore("AuthStore", () => {
  const isAuthenticated = ref(false);
  const router = useRouter();
  const userType = ref("");
  function logout() {
    isAuthenticated.value = false;
    userType.value = "";
    // Cookies.remove("token");
    // Cookies.remove("connect.sid")
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    router.push({ path: "/" });

  }
  return { isAuthenticated, userType, logout };
});

import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore(
  "AuthStore",
  () => {
    const signInTime = ref(0);

    function getCurrTime() {
      //saves time since January 1, 1970, UTC in milliseconds
      signInTime.value = Date.now();
    }

    function signOut() {
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      sessionStorage.removeItem("AuthStore");
    }

    return { signInTime, getCurrTime, signOut };
  },
  {
    persist: {
      storage: sessionStorage, //stores in session storage/same as cookie
      //so expires when session/cookie expires
    },
  }
);

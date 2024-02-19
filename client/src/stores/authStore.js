import { defineStore } from "pinia";

export const useAuthStore = defineStore("AuthStore", {
  state: () => ({
    isAuthenticated: false,
    userType: "",
  }),
  actions: {
    setAuthenticated() {
      this.isAuthenticated = true;
    },
    setUserType(type) {
      this.userType = type;
    },
    logout() {
      this.isAuthenticated = false;
      this.userType = "";
    },
  },
  persist: true,
});

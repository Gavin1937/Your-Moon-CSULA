import axios from "axios";
import config from "../../config/config.json";
import Cookies from "js-cookie";
// import { useRouter } from "vue-router";

// const router = useRouter();

export const checkCookie = async () => {
  const token = Cookies.get("token");
  console.log(token);
  if (token != null || token != undefined) {
    const res = await axios.get(`${config.backend_url}/api/verifyUser`, {
      withCredentials: true,
    });
    // console.log(res);
    if (res.status === 200) return true;
  }
  return false;
};

export const deleteCookie = () => {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  // router.push({ path: "/" });
};

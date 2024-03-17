import axios from "axios";
import config from "../../config/config.json";
import Cookies from "js-cookie";

export const checkCookie = async () => {
  const token = Cookies.get("token");

  if (token != null || token != undefined) {
    const res = await axios.get(`${config.backend_url}/api/verifyUser`, {
      withCredentials: true,
    });

    if (res.status === 200) return true;
  }
  return false;
};

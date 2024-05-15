import axios from "axios";
import config from "../../config/config.json";
import { jwtDecode } from "jwt-decode";

const isCookieValid = (cookie) => {
  try {
    const token = jwtDecode(cookie);

    if (token.user_type && token.user_type == "regular") {
      //check hashed_email field exists in token, if
      //user_id field is Number type and if iat is equal
      //to sign in time set by auth page
      if (token.hashed_email && typeof token.user_id === Number && token.iat)
        return true;
    } else if (token.user_type && token.user_type == "guest") {
      //check if user_id field starts with sess
      //and if iat is equal to sign in time
      if (token.user_id && token.user_id.startsWith("sess") && token.iat)
        return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const checkCookie = async (cookie, signInTime) => {
  if (isCookieValid(cookie)) {
    //if cookie is valid but 1 hour since logged in then verify token,
    //else let them pass

    const currTimeInS = Math.floor(Date.now() / 1000); // 1000ms in 1s
    const timePassed = currTimeInS - signInTime;
    if (timePassed > 3_600) {
      const res = await axios.get(`${config.backend_url}/api/verifyUser`, {
        withCredentials: true,
      });
      //router which has access to authStore to update sign in time to current time
      if (res.status === 200) return "update time";
      else return false;
    }
    return true;
  }

  return false;
};

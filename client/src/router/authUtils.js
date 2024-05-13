import axios from "axios";
import config from "../../config/config.json";
import { jwtDecode } from "jwt-decode";

const isCookieValid = (cookie, signInTime) => {
  const token = jwtDecode(cookie);

  if (token.user_type && token.user_type == "regular") {
    //check hashed_email field exists in token, if
    //user_id field is Number type and if iat is equal
    //to sign in time set by auth page
    if (
      token.hashed_email &&
      typeof token.user_id === Number &&
      token.iat == signInTime
    )
      return true;
  } else if (token.user_type && token.user_type == "guest") {
    //check if user_id field starts with sess
    //and if iat is equal to sign in time
    if (
      token.user_id &&
      token.user_id.startsWith("sess") &&
      token.iat == signInTime
    )
      return true;
  }
  return false;
};

export const checkCookie = async (cookie, signInTime) => {
  if (isCookieValid(cookie, signInTime)) {
    //if cookie is valid but 1 hour since logged in then verify token,
    //else let them pass
    const currTime = Date.now();
    const timePassed = currTime - signInTime;
    if (timePassed > 3_600_000) {
      const res = await axios.get(`${config.backend_url}/api/verifyUser`, {
        withCredentials: true,
      });

      if (res.status === 200) return true;
      else return false;
    }
    return true;
  }

  return false;
};

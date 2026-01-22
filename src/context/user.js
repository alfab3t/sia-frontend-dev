import Cookies from "js-cookie";
import { decryptId } from "../lib/encryptor";

const COOKIE_USER_DATA = "userData";
const COOKIE_SSO_DATA = "ssoData";

function getDecryptedCookie(name) {
  const cookieValue = Cookies.get(name);
  if (!cookieValue) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(cookieValue);
    const decrypted = decryptId(decoded);

    if (
      !decrypted ||
      typeof decrypted !== "string" ||
      decrypted.trim() === ""
    ) {
      return null;
    }

    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

export const getUserData = () => getDecryptedCookie(COOKIE_USER_DATA);
export const getSSOData = () => getDecryptedCookie(COOKIE_SSO_DATA);

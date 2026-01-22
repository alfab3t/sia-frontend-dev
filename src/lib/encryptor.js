import CryptoJS from "crypto-js";
import { ASTRATECH_KEY } from "./constant";

export const encryptId = (text) => {
  if (text === null || text === undefined) {
    return null;
  }
  return CryptoJS.AES.encrypt(text.toString(), ASTRATECH_KEY).toString();
};

export const decryptId = (cipherText) => {
  if (!cipherText) {
    return null;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ASTRATECH_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      return null;
    }
    return decryptedText;
  } catch {
    return null;
  }
};

export const encryptIdUrl = (text) => {
  if (text === null || text === undefined) {
    return null;
  }
  const encrypted = CryptoJS.AES.encrypt(
    text.toString(),
    ASTRATECH_KEY
  ).toString();
  return encrypted
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
};

export const decryptIdUrl = (encryptedText) => {
  if (!encryptedText) {
    return null;
  }

  try {
    let encrypted = encryptedText.replaceAll("-", "+").replaceAll("_", "/");

    while (encrypted.length % 4) {
      encrypted += "=";
    }

    const decrypted = CryptoJS.AES.decrypt(encrypted, ASTRATECH_KEY);
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      return null;
    }
    return decryptedText;
  } catch {
    return null;
  }
};

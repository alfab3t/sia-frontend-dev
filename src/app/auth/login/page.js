"use client";

import "./style.css";
import { useState, useEffect, useCallback } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Img from "@/components/common/Img";
import Toast from "@/components/common/Toast";
import fetch from "@/lib/fetch";
import Cookies from "js-cookie";
import { API_LINK } from "@/lib/constant";
import { useRouter } from "next/navigation";
import { encryptId } from "@/lib/encryptor";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateCaptcha = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0];
      code += chars.charAt(randomIndex % chars.length);
    }
    setCaptchaCode(code);
    setCaptchaInput("");
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!username || !password || !captchaInput) {
        Toast.error("Username, password, dan kode captcha wajib diisi.");
        return;
      }

      if (captchaInput !== captchaCode) {
        Toast.error("Kode captcha salah.");
        generateCaptcha();
        setPassword("");
        return;
      }

      setIsLoading(true);
      generateCaptcha();

      try {
        const data = await fetch(API_LINK + "auth/login", {
          username: username,
          password: password,
          jenisAplikasi: "Public",
        });

        if (data?.errorMessage === "") {
          Toast.success("Login Berhasil.");
          const dataUser = {
            listAplikasi: data.listAplikasi,
            username: username,
            nama: data.nama,
          };

          Cookies.set("ssoData", encryptId(JSON.stringify(dataUser)));
          Cookies.set("jwtToken", data.token);

          router.push("./sso");
        } else {
          Toast.error(data.message || "Username atau password tidak valid.");
          setPassword("");
          setIsLoading(false);
        }
      } catch {
        Toast.error("Login gagal. Periksa koneksi Anda.");
        setPassword("");
        setIsLoading(false);
      }
    },
    [username, password, captchaInput, captchaCode, router, generateCaptcha]
  );

  return (
    <div className="gradient-bg">
      <div className="login-card mx-4">
        <div className="row">
          <div
            className="col-lg-6"
            style={{ backgroundColor: "transparent", color: "#aaa" }}
          >
            <Img
              src={"../images/IMG_Logo.png"}
              className="img-logo mb-3"
              width={"180"}
              fluid
            />
            <Img
              src={"../images/model.png"}
              width={"420"}
              className="img-model text-center pt-5 mb-0 pb-0"
              fluid
            />
          </div>
          <div className="col-lg-6">
            <h3 className="login-title">Masuk ke SSO</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <Input
                  type="text"
                  id={"username"}
                  label={"Username"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="mb-3">
                <Input
                  type="password"
                  id={"password"}
                  label={"Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="mb-2">
                <p className="form-label">Verifikasi Captcha</p>
                <div className="captcha-container">
                  <div className="captcha-box">{captchaCode}</div>
                  <Button
                    type="button"
                    classType="primary"
                    size="md"
                    title="Perbarui Captcha"
                    onClick={generateCaptcha}
                    iconName="arrow-counterclockwise"
                    isDisabled={isLoading}
                  ></Button>
                </div>
              </div>

              <div className="mb-3">
                <Input
                  type="text"
                  id={"captcha"}
                  placeholder="Masukkan kode captcha"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                classType="success btn-login w-100"
                label={isLoading ? "Memproses..." : "Masuk"}
                title="Masuk ke SSO"
                isDisabled={isLoading}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

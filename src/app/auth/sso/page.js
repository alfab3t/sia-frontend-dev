"use client";

import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import Toast from "@/components/common/Toast";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { useRouter } from "next/navigation";
import { getSSOData } from "@/context/user";
import Button from "@/components/common/Button";
import { encryptId } from "@/lib/encryptor";

function AppFooter() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <footer className="bg-light border-top py-3 mt-auto">
      <div className="container text-center">
        <small className="text-muted">
          © {new Date().getFullYear()} Pusat Sistem Informasi - Politeknik Astra
          — in design collaboration with{" "}
          <span className="position-relative">
            <Button
              className="btn btn-link text-decoration-none text-primary p-0"
              style={{ fontSize: "13px" }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              label="ASTRAtech Students"
              aria-label="Lihat nama anggota: Revalina Azahra Prinawan, Riffy Khoirunnisa, Nida Husna Mufidah"
            />

            {showTooltip && (
              <div
                className="position-absolute bg-dark text-white rounded px-2 py-1"
                style={{
                  bottom: "125%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                  zIndex: 1000,
                }}
              >
                Revalina Azahra Prinawan
                <br />
                Riffy Khoirunnisa
                <br />
                Nida Husna Mufidah
              </div>
            )}
          </span>
        </small>
      </div>
    </footer>
  );
}

const SsoPage = () => {
  const router = useRouter();
  const [groupedApps, setGroupedApps] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ssoData = useMemo(() => getSSOData(), []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleLogout = useCallback(() => {
    Cookies.remove("ssoData");
    Cookies.remove("userData");
    Cookies.remove("jwtToken");
    Cookies.remove("permissionData");
    router.push("./login");
  }, [router]);

  useEffect(() => {
    setIsClient(true);

    if (!ssoData?.listAplikasi) {
      Toast.error("Sesi Anda tidak valid. Silakan login kembali.");
      handleLogout();
      return;
    }

    try {
      const grouped = ssoData.listAplikasi.reduce((acc, app) => {
        if (!acc[app.namaAplikasi]) {
          acc[app.namaAplikasi] = [];
        }
        acc[app.namaAplikasi].push(app);
        return acc;
      }, {});
      setGroupedApps(grouped);
    } catch {
      Toast.error("Terjadi kesalahan saat memuat aplikasi.");
    }
  }, [ssoData, handleLogout]);

  const getPermissionUser = useCallback(async () => {
    if (!selectedRole) return;

    setIsLoading(true);

    try {
      const data = await fetchData(API_LINK + "auth/getpermission", {
        username: ssoData.username,
        appId: selectedRole.appId,
        roleId: selectedRole.roleId,
      });

      if (data?.errorMessage === "") {
        Cookies.set("jwtToken", data.token);
        const userData = {
          //permission: data.listPermission,
          nama: ssoData.nama,
          role: selectedRole.namaRole,
          aplikasi: selectedRole.namaAplikasi,
          appId: selectedRole.appId,
          roleId: selectedRole.roleId,
        };
        Cookies.set("userData", encryptId(JSON.stringify(userData)));
        localStorage.setItem("permissionData", JSON.stringify(data.listPermission));
        //Cookies.set("permissionData", JSON.stringify(data.listPermission));
        Toast.success(
          "Berhasil login ke " +
            ` ${selectedRole.namaAplikasi} sebagai ${selectedRole.namaRole}`
        );
        router.push("../sample");
      } else {
        Toast.error(
          data.message || "Gagal mendapatkan izin. Silakan coba lagi."
        );
        setIsLoading(false);
      }
    } catch {
      Toast.error("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  }, [selectedRole, ssoData, router]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <header
        style={{ top: 0, position: "fixed", width: "100%", zIndex: 1000 }}
        className="header-gradient mb-5 d-flex justify-content-between align-items-center py-3 px-4 shadow-sm bg-white"
      >
        <img
          src="../images/logo-white.png"
          alt="Logo"
          className="img-fluid"
          style={{ maxWidth: "150px" }}
        />
        <button
          className="btn btn-danger d-flex align-items-center gap-2 fw-semibold shadow-sm"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-left" />
          <span className="d-none d-sm-inline">Logout</span>
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="container py-5 flex-grow-1"
      >
        <div className="text-center mb-5 pt-5">
          <h1 className="fw-bold text-primary mb-2">
            Selamat Datang, {isClient ? ssoData?.nama || "User" : "User"}
          </h1>
          <p className="text-muted mb-4">
            Silakan pilih aplikasi dan peran Anda.
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {Object.keys(groupedApps).map((namaAplikasi, idx) => {
            const firstApp = groupedApps[namaAplikasi][0];
            const iconName = firstApp.appIcon || "grid-1x2-fill";

            return (
              <motion.div
                key={namaAplikasi + "-" + idx}
                className="col-sm-6 col-md-6 col-lg-3 col-11"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <div
                  className="card h-100 border-0 shadow-lg rounded-4 overflow-hidden"
                  style={{
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                >
                  <div className="card-body text-center p-4 d-flex flex-column justify-content-between ">
                    <div>
                      <i
                        className={`bi bi-${iconName} display-5 text-primary mb-3`}
                      />
                      <h5 className="fw-bold text-primary mt-2">
                        {namaAplikasi}
                      </h5>
                    </div>

                    <div className="mt-3 text-start">
                      <h6 className="fw-semibold mb-2 fs-6 text-secondary">
                        Pilih Peran:
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {groupedApps[namaAplikasi].map((role) => (
                          <motion.span
                            key={`${role.appId}-${role.roleId}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRoleSelect(role)}
                            className={`badge rounded-pill fw-medium px-3 py-2 ${
                              selectedRole?.roleId === role.roleId &&
                              selectedRole?.appId === role.appId
                                ? "bg-primary text-white shadow"
                                : "bg-light text-dark border"
                            }`}
                            style={{ cursor: "pointer", userSelect: "none" }}
                          >
                            {role.namaRole}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="d-flex justify-content-center mt-5">
          <button
            className="btn btn-primary d-flex align-items-center justify-content-center gap-2 fw-semibold shadow-sm px-4 py-2 rounded-pill"
            disabled={!selectedRole || isLoading}
            onClick={getPermissionUser}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  aria-hidden="true"
                ></span>
                <output className="ms-2">Memproses...</output>
              </>
            ) : (
              <>
                <span>Lanjutkan</span>
                <i className="bi bi-arrow-right-circle fs-5"></i>
              </>
            )}
          </button>
        </div>
      </motion.div>

      <AppFooter />
    </div>
  );
};

export default SsoPage;

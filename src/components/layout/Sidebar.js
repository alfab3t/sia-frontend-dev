"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import MenuItem from "./MenuItem";
import Image from "next/image";
import Link from "next/link";
import Icon from "../common/Icon";
import Button from "../common/Button";
import Input from "../common/Input";
import PropTypes from "prop-types";
import fetch from "@/lib/fetch";
import Cookies from "js-cookie";
import Toast from "../common/Toast";
import { API_LINK } from "@/lib/constant";
import { getSSOData, getUserData } from "@/context/user";

const mapMenuToComponentFormat = (menuArray) => {
  if (!Array.isArray(menuArray)) return [];
  return menuArray.map((item) => ({
    icon: item.icon,
    label: item.label,
    href: item.href.startsWith("#") ? item.href : `/pages/${item.href}`,
    children:
      item.children && item.children.length > 0
        ? mapMenuToComponentFormat(item.children)
        : undefined,
  }));
};

export default function Sidebar({
  collapsed,
  isMobile,
  open,
  onClose,
  setCollapsed,
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [dynamicMenu, setDynamicMenu] = useState([]);
  const pathname = usePathname();
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const width = collapsed ? 63 : 215;

  const processedMenus = useMemo(
    () => mapMenuToComponentFormat(dynamicMenu),
    [dynamicMenu]
  );

  useEffect(() => {
    if (!ssoData || !userData) {
      Toast.error("Sesi tidak valid, silakan login kembali.");
      Cookies.remove("ssoData");
      Cookies.remove("userData");
      Cookies.remove("jwtToken");
      Cookies.remove("permissionData");
      router.push("/auth/login");
      return;
    }

    const fetchMenu = async () => {
      try {
        const data = await fetch(API_LINK + "auth/getmenu", {
          username: ssoData.username,
          appId: userData.appId,
          roleId: userData.roleId,
        });

        if (data.error) {
          throw new Error(data.message || "Gagal terhubung ke server.");
        }

        if (data.errorMessage && data.errorMessage !== "") {
          throw new Error(data.errorMessage);
        }

        if (data.listMenu && data.listMenu.length > 0) {
          setDynamicMenu(data.listMenu);
        } else {
          Toast.warn("Menu tidak ditemukan atau kosong.");
          setDynamicMenu([]);
        }
      } catch (error) {
        Toast.error(error.message);
      }
    };

    fetchMenu();
  }, [ssoData, userData, router]);

  useEffect(() => {
    const activeParent = processedMenus.find((item) =>
      item.children?.some((child) => child.href === pathname)
    );
    if (activeParent) {
      setOpenMenu(activeParent.label);
    } else {
      setOpenMenu(null);
    }
  }, [pathname, processedMenus]);

  const handleToggle = useCallback(
    (label) => {
      if (collapsed) {
        setCollapsed(false);
        setOpenMenu(label);
      } else {
        setOpenMenu((prev) => (prev === label ? null : label));
      }
    },
    [collapsed, setCollapsed]
  );

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value.toLowerCase());
  }, []);

  const handleLogout = useCallback(
    (e) => {
      e.preventDefault();
      Cookies.remove("ssoData");
      Cookies.remove("userData");
      Cookies.remove("jwtToken");
      Cookies.remove("permissionData");
      router.push("/auth/login");
    },
    [router]
  );

  const gotoSSO = useCallback(
    (e) => {
      e.preventDefault();
      Cookies.remove("userData");
      Cookies.remove("permissionData");
      router.push("/auth/sso");
    },
    [router]
  );

  const filteredMenus = useMemo(() => {
    if (searchTerm === "") {
      return processedMenus;
    }
    return processedMenus
      .map((item) => {
        if (item.children) {
          const matchedChildren = item.children.filter((child) =>
            child.label.toLowerCase().includes(searchTerm)
          );
          if (
            item.label.toLowerCase().includes(searchTerm) ||
            matchedChildren.length > 0
          ) {
            return { ...item, children: matchedChildren };
          }
          return null;
        } else {
          return item.label.toLowerCase().includes(searchTerm) ? item : null;
        }
      })
      .filter(Boolean);
  }, [processedMenus, searchTerm]);

  useEffect(() => {
    if (!isMobile) onClose?.();
  }, [isMobile, onClose]);

  return (
    <nav
      className={` rounded-end-3 position-fixed h-100 d-flex flex-column align-items-center transition-all ${
        isMobile ? "mobile-sidebar" : ""
      }`}
      style={{
        boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.2)",
        backgroundColor: "#0059AB",
        width: `${width}px`,
        left: (() => {
          if (!isMobile) return "0";
          return open ? "0" : `-${width}px`;
        })(),
        transition: "left 0.3s ease, width 0.3s ease",
        zIndex: 1050,
        maxWidth: 215,
      }}
    >
      <div
        className={
          "p-3 border-bottom border-grey border-0 w-100" +
          (isMobile ? "" : " text-center")
        }
        style={{ height: 65 }}
      >
        <Image
          src={
            collapsed ? "/images/logo-icon-white.png" : "/images/logo-white.png"
          }
          alt="ASTRAtech"
          width={collapsed ? 30 : 135}
          height={30}
          priority
        />
        {isMobile && (
          <Button
            classType={"border-0 position-absolute end-0 me-2 bg-primary"}
            cssIcon="fs-2 text-white"
            iconName="list"
            onClick={onClose}
            iconOnly={true}
          />
        )}
      </div>

      <nav
        className="sidebar flex-column flex-grow-1 ps-2 pt-2 w-100"
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          justifyItems: collapsed ? "center" : "",
        }}
      >
        {!collapsed && (
          <Input
            type="text"
            size="sm"
            className="mx-2 mt-2 text-white"
            placeholder="Cari Menu"
            onChange={handleSearchChange}
            value={searchTerm}
          />
        )}
        {collapsed && (
          <button
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setCollapsed(false);
              }
            }}
            data-tooltip-id="menu-tooltip"
            data-tooltip-content={collapsed ? "Cari Menu" : ""}
            onClick={() => setCollapsed(false)}
            className={`d-flex align-items-center border-0 flex-grow-1 w-100 ${
              collapsed ? "justify-content-center" : ""
            }`}
            aria-label="Cari Menu"
            style={{ background: "none", color: "white" }}
          >
            <Icon name="search" cssClass="text-white mb-1 me-2" />
          </button>
        )}

        {filteredMenus.map((item) => (
          <MenuItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            href={item.href}
            collapsed={collapsed}
            menuItems={item.children}
            open={openMenu === item.label}
            onToggle={() => handleToggle(item.label)}
          />
        ))}
      </nav>

      <div className="border-top bg-white w-100 rounded-top-3">
        <Link
          href="#"
          onClick={handleLogout}
          data-tooltip-id="menu-tooltip"
          data-tooltip-content={collapsed ? "Keluar" : ""}
          className="text-danger text-decoration-none py-1  border-bottom d-flex align-items-center justify-content-center sidebar-exit-item ms-1"
        >
          <Icon name="box-arrow-right" cssClass="me-2 fs-6" />
          {!collapsed && (
            <span className="fw-bold" style={{ fontSize: "12px" }}>
              Keluar
            </span>
          )}
        </Link>

        <Link
          href="#"
          onClick={gotoSSO}
          data-tooltip-id="menu-tooltip"
          data-tooltip-content={collapsed ? "Halaman SSO" : ""}
          className="text-primary text-decoration-none py-1 d-flex align-items-center justify-content-center sidebar-exit-item"
        >
          <Icon name="arrow-repeat" cssClass="me-2 fs-6" />
          {!collapsed && (
            <span className="fw-bold" style={{ fontSize: "12px" }}>
              Halaman SSO
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  isMobile: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  setCollapsed: PropTypes.func,
};

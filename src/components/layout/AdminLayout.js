"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PropTypes from "prop-types";
import { Tooltip } from "react-tooltip";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (globalThis.window === undefined) {
      return;
    }

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const sidebarWidth = useMemo(() => (collapsed ? 63 : 215), [collapsed]);
  const mainMarginLeft = useMemo(
    () => (isMobile ? "0" : `${sidebarWidth}px`),
    [isMobile, sidebarWidth]
  );

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  return (
    <div>
      <Tooltip id="menu-tooltip" />

      <Sidebar
        setCollapsed={setCollapsed}
        collapsed={collapsed}
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={closeSidebar}
      />

      {isMobile && sidebarOpen && (
        <button
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 border-0"
          style={{ zIndex: 1040 }}
          onClick={closeSidebar}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
              e.preventDefault();
              closeSidebar();
            }
          }}
          aria-label="Tutup sidebar"
        ></button>
      )}

      <div
        className="flex-grow-1 transition-all"
        style={{
          marginLeft: mainMarginLeft,
          transition: "margin-left 0.3s ease",
        }}
      >
        <Topbar marginLeft={mainMarginLeft} onToggle={handleToggle} />
        <main style={{ paddingTop: "65px" }}>{children}</main>
      </div>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

"use client";

import { useState, useRef, useEffect, memo } from "react";
import Icon from "../common/Icon";
import Link from "next/link";

// SEMENTARA
const notifications = [
  { id: 1, title: "Jadwal kuliah baru sudah tersedia", time: "5 menit lalu" },
  { id: 2, title: "Perubahan ruang kelas B207", time: "1 jam lalu" },
  { id: 3, title: "Nilai UTS telah diunggah", time: "2 jam lalu" },
  { id: 4, title: "Pendaftaran wisuda dibuka", time: "Kemarin" },
  { id: 5, title: "Maintenance server malam ini", time: "2 hari lalu" },
];

function NotificationIcon() {
  const [open, setOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={notifRef}
      className="position-relative d-flex align-items-center me-4"
      style={{ cursor: "pointer" }}
    >
      <button
        className="notification-icon position-relative d-flex align-items-center border-0"
        style={{ backgroundColor: "transparent" }}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        aria-label="Buka notifikasi"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Icon name="bell" cssClass="fs-5 text-primary " />
        <span
          className="position-absolute translate-middle badge rounded-pill bg-danger text-white fw-semibold shadow-sm"
          style={{
            top: "25%",
            left: "100%",
            transform: "translate(-50%, -50%)",
            fontSize: "0.65rem",
            padding: "0.3em 0.45em",
          }}
        >
          {notifications.length}
        </span>
      </button>

      {open && (
        <div
          className="position-absolute bg-white shadow-lg rounded-3 border overflow-hidden"
          style={{
            width: "300px",
            right: 0,
            top: "100%",
            marginTop: "10px",
            zIndex: 9999,
            animation: "fadeIn 0.2s ease",
          }}
          role="menu"
        >
          <div
            className="p-2 border-bottom bg-light fw-semibold text-primary"
            style={{ fontSize: "14px" }}
          >
            Notifikasi Terbaru
          </div>

          <div
            className="list-group list-group-flush"
            style={{ maxHeight: "250px", overflowY: "auto" }}
          >
            {notifications.map((notif) => (
              <Link
                key={notif.id}
                href={`/pages/notifikasi/${notif.id}`}
                onClick={() => setOpen(false)}
                className="list-group-item list-group-item-action d-flex flex-column text-decoration-none"
                style={{
                  fontSize: "13px",
                }}
              >
                <span className="fw-semibold text-dark">{notif.title}</span>
                <small className="text-muted">{notif.time}</small>
              </Link>
            ))}
          </div>

          <div className="border-top text-center p-2 bg-light">
            <Link
              href="/pages/notifikasi"
              className="btn btn-sm btn-outline-primary w-100"
              onClick={() => setOpen(false)}
            >
              Lihat Semua Notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(NotificationIcon);

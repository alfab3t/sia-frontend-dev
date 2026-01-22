import { Barlow } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import BootstrapClient from "./bootsrap-client";
import "./custom.scss";
import PropTypes from "prop-types";

const barlow = Barlow({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME,
  },
  authors: [{ name: "Pusat Sistem Informasi" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0059AB",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={barlow.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
        />
        <link rel="preload" href="/images/IMG_Logo.png" as="image" />
      </head>

      <body className={`${barlow.className} antialiased`}>
        <BootstrapClient />
        <main className="min-vh-100 d-flex flex-column">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              color: "#222",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              fontSize: "14px",
              padding: "12px 16px",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

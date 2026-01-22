/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5234/api/:path*", // Alamat API sesuaikan dengan alamat di backend
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  env: {
    APP_NAME: "ASTRATECH-APPS",
    APP_VERSION: "1.0.0",
  },

  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;

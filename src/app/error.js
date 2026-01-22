"use client";

import PropTypes from "prop-types";
import Link from "next/link";

export default function ErrorPage({ error, reset }) {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <div
                    className="bg-danger bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i
                      className="bi bi-exclamation-triangle text-white"
                      style={{ fontSize: "2.5rem" }}
                    ></i>
                  </div>
                </div>

                <h3 className="fw-bold text-dark mb-3">Terjadi Kesalahan</h3>
                <p className="text-muted mb-4">
                  Silakan coba kembali atau hubungi tim Pusat Sistem Informasi
                  jika masalah masih berlanjut.
                </p>

                {process.env.NODE_ENV === "development" && (
                  <div className="alert alert-danger text-start mb-4">
                    <small>
                      <strong>Error Details (Development Only):</strong>
                      <br />
                      {error?.message || "Unknown error occurred"}
                    </small>
                  </div>
                )}

                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  <button
                    onClick={reset}
                    className="btn btn-outline-success px-4"
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i> Coba Lagi
                  </button>

                  <Link href="/" className="btn btn-primary px-4">
                    <i className="bi bi-house me-2"></i> Kembali ke Halaman
                    Utama
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ErrorPage.propTypes = {
  error: PropTypes.object,
  reset: PropTypes.func,
};

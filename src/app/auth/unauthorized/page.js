import Link from "next/link";

export default function Unauthorized() {
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
                      className="bi bi-shield-lock-fill text-white"
                      style={{ fontSize: "2.5rem" }}
                    ></i>
                  </div>
                </div>

                <h3 className="fw-bold text-dark mb-3">Akses Ditolak</h3>
                <p className="text-muted mb-4">
                  Maaf, Anda tidak memiliki izin untuk mengakses halaman atau
                  fungsi ini.
                </p>

                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  <Link href="/auth/sso" className="btn btn-primary px-4">
                    Kembali ke Halaman SSO
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

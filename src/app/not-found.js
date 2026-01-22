import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <div
                    className="bg-warning bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i
                      className="bi bi-question-circle text-white"
                      style={{ fontSize: "2.5rem" }}
                    ></i>
                  </div>
                </div>

                <h3 className="fw-bold text-dark mb-3">
                  Halaman Tidak Ditemukan
                </h3>
                <p className="text-muted mb-4">
                  Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman
                  mungkin telah dipindahkan, dihapus, atau URL yang Anda
                  masukkan salah.
                </p>

                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
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

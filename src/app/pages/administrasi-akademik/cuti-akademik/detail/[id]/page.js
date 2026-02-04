"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import { useRouter, useParams } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";
import { getUserData } from "@/context/user";
import Cookies from "js-cookie";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = Cookies.get("jwtToken");
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export default function DetailCutiAkademikPage() {
  const router = useRouter();
  const params = useParams();
  const userData = useMemo(() => getUserData(), []);

  const realId = useMemo(() => {
    try {
      return decryptIdUrl(params?.id || "");
    } catch {
      return "";
    }
  }, [params]);

  const getStatusBadge = (status) => {
    if (!status) return <span className="badge bg-light text-dark">Tidak Diketahui</span>;
    
    const statusLower = status.toLowerCase();
    
    // Status badge mapping consistent with page.js
    const statusBadgeMap = {
      // Draft status
      'draft': 'badge bg-info-subtle text-info',
      
      // Disetujui status
      'disetujui': 'badge bg-success-subtle text-success',
      
      // Belum Disetujui statuses - use warning styling
      'belum disetujui wadir 1': 'badge bg-warning-subtle text-warning',
      'belum disetujui finance': 'badge bg-warning-subtle text-warning', 
      'belum disetujui prodi': 'badge bg-warning-subtle text-warning',
      'menunggu persetujuan': 'badge bg-warning-subtle text-warning',
      
      // Ditolak statuses - use danger styling
      'ditolak wadir1': 'badge bg-danger-subtle text-danger',
      'ditolak prodi': 'badge bg-danger-subtle text-danger',
      'ditolak finance': 'badge bg-danger-subtle text-danger',
      'ditolak': 'badge bg-danger-subtle text-danger',
      
      // Additional status variations
      'menunggu upload sk': 'badge bg-warning-subtle text-warning',
      'disetujui prodi': 'badge bg-info-subtle text-info',
      'dalam proses': 'badge bg-primary-subtle text-primary',
    };
    
    const badgeClass = statusBadgeMap[statusLower] || 'badge bg-light text-dark';
    
    return (
      <span className={badgeClass}>
        {status}
      </span>
    );
  };

  const canViewApprovalStatus = () => {
    const userRole = userData?.role?.toLowerCase();
    return ['nda+prodi', 'user_finance', 'admin'].includes(userRole);
  };



  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);

      if (!realId) {
        Toast.error("ID tidak valid.");
        router.push("/pages/administrasi-akademik/cuti-akademik");
        return;
      }

      const url = `${API_LINK}CutiAkademik/GetDetailCutiAkademik?id=${encodeURIComponent(realId)}`;

      const [response] = await Promise.all([
        fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        }),
        new Promise(resolve => setTimeout(resolve, 300))
      ]);

      const raw = await response.text();

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        Toast.error("Server mengirim response tidak valid.");
        return;
      }

      if (!data?.id) {
        Toast.error("Data tidak ditemukan.");
        return;
      }

      setDetail(data);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [realId, router]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleBack = () =>
    router.push("/pages/administrasi-akademik/cuti-akademik");

  const handleViewProfile = () => {
    if (!detail?.mhsId) {
      Toast.error("ID Mahasiswa tidak tersedia.");
      return;
    }
    
    try {
      const encryptedMhsId = encryptIdUrl(detail.mhsId);
      router.push(`/pages/Profil_Mahasiswa/${encryptedMhsId}`);
    } catch {
      Toast.error("Gagal membuka profil mahasiswa.");
    }
  };

  const handleDownload = async (fileName) => {
    if (!fileName) {
      Toast.error("File tidak ditemukan.");
      return;
    }

    try {
      const token = Cookies.get("jwtToken");
      const downloadUrl = `${API_LINK}CutiAkademik/DownloadFileCutiAkademik/${fileName}`;

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Create blob from response
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      globalThis.URL.revokeObjectURL(url);
      
    } catch (error) {
      Toast.error(`Gagal mendownload file: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <MainContent 
        title="Detail Cuti Akademik" 
        layout="Admin"
        loading={loading}
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Cuti Akademik" },
          { label: "Detail Pengajuan" },
        ]}
      >
        <div className="text-center py-4">
          <div className="spinner-border" aria-live="polite">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Memuat detail pengajuan...</p>
        </div>
      </MainContent>
    );
  }

  if (!detail) {
    return (
      <MainContent 
        title="Detail Cuti Akademik" 
        layout="Admin"
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Cuti Akademik" },
          { label: "Detail Pengajuan" },
        ]}
      >
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="fas fa-exclamation-triangle fa-3x text-muted"></i>
          </div>
          <h5 className="text-muted">Data tidak tersedia</h5>
          <p className="text-muted">Detail pengajuan tidak dapat ditemukan.</p>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent
      title="Detail Cuti Akademik"
      layout="Admin"
      breadcrumb={[
        { label: "Sistem Informasi Akademik" },
        { label: "Administrasi Akademik" },
        { label: "Cuti Akademik" },
        { label: "Detail Pengajuan" },
      ]}
    >
      <div className="card p-4">

        <h4 className="fw-bold">Detail Pengajuan Cuti Akademik</h4>
        <hr />

        <div className="row">
          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">Nomor Pengajuan</h6>
            <p>{detail?.id || "-"}</p>
          </div>

          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">Tahun Akademik</h6>
            <p>{detail?.tahunAjaran || "-"}</p>
          </div>

          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">Mengajukan Cuti untuk Semester</h6>
            <p>{detail?.semester || "-"}</p>
          </div>

          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">Status</h6>
            <div>{getStatusBadge(detail?.status)}</div>
          </div>

          {/* Tambahan field persetujuan di bagian status utama */}
          {detail?.approvalProdi && (
            <div className="col-lg-6 mb-3">
              <h6 className="fw-semibold mb-1">Persetujuan Prodi oleh</h6>
              <p>{detail.approvalProdi}</p>
            </div>
          )}

          {detail?.approvalDir1 && (
            <div className="col-lg-6 mb-3">
              <h6 className="fw-semibold mb-1">Persetujuan Wakil Direktur 1 oleh</h6>
              <p>{detail.approvalDir1}</p>
            </div>
          )}
        </div>

        {canViewApprovalStatus() && (
          <>
            <br />
            <h5 className="fw-bold">Status Persetujuan</h5>

            <div className="row">
              <div className="col-lg-6 mb-3">
                <h6 className="fw-semibold mb-1">Status Approval Prodi</h6>
                <div>
                  {detail?.approvalProdi && detail?.appProdiDate ? (
                    <span className="badge bg-success">Disetujui</span>
                  ) : (
                    <span className="badge bg-warning">Menunggu Persetujuan</span>
                  )}
                </div>
              </div>
              
              <div className="col-lg-6 mb-3">
                <h6 className="fw-semibold mb-1">Persetujuan Prodi Oleh</h6>
                <p>{detail?.approvalProdi || "Belum disetujui"}</p>
              </div>
              
              <div className="col-lg-6 mb-3">
                <h6 className="fw-semibold mb-1">Tanggal Persetujuan Prodi</h6>
                <p>{detail?.appProdiDate || "Belum disetujui"}</p>
              </div>
              
              <div className="col-lg-6 mb-3">
                <h6 className="fw-semibold mb-1">Status Approval Wakil Direktur</h6>
                <div>
                  {detail?.approvalDir1 && detail?.appDir1Date ? (
                    <span className="badge bg-success">Disetujui</span>
                  ) : (
                    <span className="badge bg-warning">Menunggu Persetujuan</span>
                  )}
                </div>
              </div>
              
              <div className="col-lg-6 mb-3">
                <h6 className="fw-semibold mb-1">Persetujuan Wakil Direktur Oleh</h6>
                <p>{detail?.approvalDir1 || "Belum disetujui"}</p>
              </div>
              
              <div className="col-lg-6 mb-3">
                <h6 className="fw-semibold mb-1">Tanggal Persetujuan Wakil Direktur</h6>
                <p>{detail?.appDir1Date || "Belum disetujui"}</p>
              </div>
              
              {detail?.menimbang && (
                <div className="col-lg-12 mb-3">
                  <h6 className="fw-semibold mb-1">Pertimbangan</h6>
                  <div className="text-muted" dangerouslySetInnerHTML={{ __html: detail.menimbang }} />
                </div>
              )}
              
              {detail?.sk && (
                <div className="col-lg-12 mb-3">
                  <h6 className="fw-semibold mb-1">Surat Keputusan</h6>
                  <div>
                    <Button
                      classType="success"
                      label="📄 Download SK Cuti Akademik"
                      onClick={() => handleDownload(detail.sk)}
                    />
                    {detail?.srtNo && (
                      <p className="mt-2 mb-0 text-muted">
                        <small>Nomor: {detail.srtNo}</small>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <br />

        <div className="row">
          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">NIM</h6>
            <p>{detail?.mhsId || "-"}</p>
          </div>

          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">Nama Mahasiswa</h6>
            <p>{detail?.mahasiswa || "-"}</p>
          </div>

          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">Program Studi</h6>
            <p>{detail?.prodiNama || "-"}</p>
          </div>

          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">Konsentrasi</h6>
            <p>{detail?.konsentrasi || "-"}</p>
          </div>

          <div className="col-lg-12 mb-3">
            <button
              type="button"
              className="btn btn-link text-primary text-decoration-underline p-0"
              onClick={handleViewProfile}
            >
              Lihat Profil Mahasiswa
            </button>
          </div>
        </div>

        <div className="row">

          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">Surat Pernyataan</h6>
            <div>
              {detail?.lampiranSP ? (
                <button
                  className="btn btn-outline-primary rounded-pill px-4 py-2"
                  onClick={() => handleDownload(detail.lampiranSP)}
                >
                  Download Surat Pernyataan
                </button>
              ) : (
                <span>Tidak ada file</span>
              )}
            </div>
          </div>

          <div className="col-lg-6 mb-3">
            <h6 className="fw-semibold mb-1">Lampiran</h6>
            <div>
              {detail?.lampiran ? (
                <button
                  className="btn btn-outline-primary rounded-pill px-4 py-2"
                  onClick={() => handleDownload(detail.lampiran)}
                >
                  Download Lampiran
                </button>
              ) : (
                <span>Tidak ada file</span>
              )}
            </div>
          </div>

        </div>

        <div className="d-flex justify-content-end mt-4">
          <Button
            classType="secondary"
            label="Kembali"
            onClick={handleBack}
          />
        </div>

      </div>
    </MainContent>
  );
}
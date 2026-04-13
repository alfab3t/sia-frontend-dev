"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import { useRouter, useParams } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";
import { getSSOData } from "@/context/user";
import Cookies from "js-cookie";

const statusBadgeMap = {
  'draft': 'badge bg-info-subtle text-info',
  'disetujui': 'badge bg-success-subtle text-success',
  'belum disetujui wadir 1': 'badge bg-warning-subtle text-warning',
  'belum disetujui finance': 'badge bg-warning-subtle text-warning',
  'belum disetujui prodi': 'badge bg-warning-subtle text-warning',
  'menunggu persetujuan': 'badge bg-warning-subtle text-warning',
  'ditolak wadir1': 'badge bg-danger-subtle text-danger',
  'ditolak prodi': 'badge bg-danger-subtle text-danger',
  'ditolak finance': 'badge bg-danger-subtle text-danger',
  'ditolak': 'badge bg-danger-subtle text-danger',
  'menunggu upload sk': 'badge bg-warning-subtle text-warning',
  'disetujui prodi': 'badge bg-info-subtle text-info',
  'dalam proses': 'badge bg-primary-subtle text-primary',
};

const getStatusBadge = (status) => {
  if (!status) return <span className="badge bg-light text-dark">Tidak Diketahui</span>;
  const cls = statusBadgeMap[status.toLowerCase()] || 'badge bg-light text-dark';
  return <span className={cls}>{status}</span>;
};

export default function DetailCutiAkademikPage() {
  const router = useRouter();
  const params = useParams();
  const ssoData = useMemo(() => getSSOData(), []);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const realId = useMemo(() => {
    try { return decryptIdUrl(params?.id || ""); } catch { return ""; }
  }, [params]);

  const loadDetail = useCallback(async () => {
    if (!realId) {
      Toast.error("ID tidak valid.");
      router.push("/pages/administrasi-akademik/cuti-akademik");
      return;
    }
    try {
      setLoading(true);
      const data = await fetchData(
        `${API_LINK}CutiAkademik/GetDetailCutiAkademik?id=${encodeURIComponent(realId)}`,
        {}, "GET"
      );
      if (!data?.id) { Toast.error("Data tidak ditemukan."); return; }
      setDetail(data);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [realId, router]);

  useEffect(() => {
    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("/auth/login");
      return;
    }
    loadDetail();
  }, [ssoData, router, loadDetail]);

  const handleBack = useCallback(() => {
    router.push("/pages/administrasi-akademik/cuti-akademik");
  }, [router]);

  const handleViewProfile = useCallback(() => {
    if (!detail?.mhsId) { Toast.error("ID Mahasiswa tidak tersedia."); return; }
    try {
      router.push(`/pages/Profil_Mahasiswa/${encryptIdUrl(detail.mhsId)}`);
    } catch {
      Toast.error("Gagal membuka profil mahasiswa.");
    }
  }, [detail, router]);

  const handleDownload = useCallback(async (fileName) => {
    if (!fileName) { Toast.error("File tidak ditemukan."); return; }
    try {
      const token = Cookies.get("jwtToken");
      const response = await fetch(`${API_LINK}CutiAkademik/DownloadFileCutiAkademik/${fileName}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': '*/*' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      Toast.error(`Gagal mendownload file: ${error.message}`);
    }
  }, []);

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
      {detail && (
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

          {detail?.menimbang && (
            <div className="row">
              <div className="col-lg-12 mb-3">
                <h6 className="fw-semibold mb-1">Pertimbangan</h6>
                <div className="text-muted" dangerouslySetInnerHTML={{ __html: detail.menimbang }} />
              </div>
            </div>
          )}

          {detail?.sk && (
            <div className="row">
              <div className="col-lg-12 mb-3">
                <h6 className="fw-semibold mb-1">Surat Keputusan</h6>
                <Button classType="success" label="📄 Download SK Cuti Akademik" onClick={() => handleDownload(detail.sk)} />
                {detail?.srtNo && <p className="mt-2 mb-0 text-muted"><small>Nomor: {detail.srtNo}</small></p>}
              </div>
            </div>
          )}

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
              <button type="button" className="btn btn-link text-primary text-decoration-underline p-0" onClick={handleViewProfile}>
                Lihat Profil Mahasiswa
              </button>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6 mb-3">
              <h6 className="fw-semibold mb-1">Surat Pernyataan</h6>
              {detail?.lampiranSP ? (
                <button className="btn btn-outline-primary rounded-pill px-4 py-2" onClick={() => handleDownload(detail.lampiranSP)}>
                  Download Surat Pernyataan
                </button>
              ) : <span>Tidak ada file</span>}
            </div>
            <div className="col-lg-6 mb-3">
              <h6 className="fw-semibold mb-1">Lampiran</h6>
              {detail?.lampiran ? (
                <button className="btn btn-outline-primary rounded-pill px-4 py-2" onClick={() => handleDownload(detail.lampiran)}>
                  Download Lampiran
                </button>
              ) : <span>Tidak ada file</span>}
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4 gap-2">
            <Button classType="secondary" label="Kembali" onClick={handleBack} />
          </div>
        </div>
      )}
    </MainContent>
  );
}

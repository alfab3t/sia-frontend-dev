"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import { useRouter, useParams } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { getSSOData } from "@/context/user";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";
import Cookies from "js-cookie";

const statusBadgeMap = {
  'draft': 'badge bg-info-subtle text-info',
  'disetujui': 'badge bg-success-subtle text-success',
  'belum disetujui wadir 1': 'badge bg-warning-subtle text-warning',
  'belum disetujui finance': 'badge bg-warning-subtle text-warning',
  'belum disetujui prodi': 'badge bg-warning-subtle text-warning',
  'ditolak wadir1': 'badge bg-danger-subtle text-danger',
  'ditolak prodi': 'badge bg-danger-subtle text-danger',
  'ditolak finance': 'badge bg-danger-subtle text-danger',
  'ditolak': 'badge bg-danger-subtle text-danger',
  'menunggu upload sk': 'badge bg-warning-subtle text-warning',
};

const getStatusBadgeClass = (status) => {
  if (!status) return 'badge bg-light text-dark';
  return statusBadgeMap[status.toLowerCase()] || 'badge bg-light text-dark';
};

export default function DetailMeninggalDunia() {
  const router = useRouter();
  const params = useParams();
  const ssoData = useMemo(() => getSSOData(), []);
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState(null);

  const recordId = useMemo(() => {
    if (!params?.id) return null;
    try { return decryptIdUrl(decodeURIComponent(params.id)); } catch {
      try { return decodeURIComponent(params.id); } catch { return params.id; }
    }
  }, [params?.id]);

  const loadData = useCallback(async () => {
    if (!recordId) {
      Toast.error("ID tidak valid.");
      router.push("/pages/administrasi-akademik/meninggal-dunia");
      return;
    }
    try {
      setLoading(true);
      const data = await fetchData(
        `${API_LINK}MeninggalDunia/GetDetailMeninggalDunia/${encodeURIComponent(recordId)}`,
        {}, "GET"
      );
      if (!data || typeof data !== 'object') throw new Error("Data tidak valid.");
      setDetailData(data);
    } catch (err) {
      Toast.error(`Gagal memuat detail pengajuan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [recordId, router]);

  useEffect(() => {
    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("/auth/login");
      return;
    }
    loadData();
  }, [ssoData, router, loadData]);

  const handleBack = useCallback(() => {
    router.push("/pages/administrasi-akademik/meninggal-dunia");
  }, [router]);

  const handleViewProfile = useCallback(() => {
    if (!detailData?.mhsId) { Toast.error("ID Mahasiswa tidak tersedia."); return; }
    try { router.push(`/pages/Profil_Mahasiswa/${encryptIdUrl(detailData.mhsId)}`); }
    catch { Toast.error("Gagal membuka profil mahasiswa."); }
  }, [detailData, router]);

  const handleDownloadFile = useCallback(async (filename) => {
    if (!filename) { Toast.error("File tidak tersedia."); return; }
    try {
      const token = Cookies.get("jwtToken");
      const response = await fetch(`${API_LINK}MeninggalDunia/DownloadFileMeninggalDunia/${filename}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': '*/*' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      Toast.error(`Gagal mendownload file: ${err.message}`);
    }
  }, []);

  return (
    <MainContent
      title="Detail Pengajuan Meninggal Dunia"
      layout="Admin"
      loading={loading}
      breadcrumb={[
        { label: "Sistem Informasi Akademik" },
        { label: "Administrasi Akademik" },
        { label: "Meninggal Dunia" },
        { label: "Detail Pengajuan" },
      ]}
    >
      {detailData && (
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">Informasi Pengajuan Meninggal Dunia</h5>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-12">
                <h6 className="text-primary border-bottom pb-2 mb-3">Data Mahasiswa</h6>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">ID Mahasiswa:</h6>
                <p className="form-control-plaintext">{detailData.mhsId || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">Nama Mahasiswa:</h6>
                <p className="form-control-plaintext">{detailData.mhsNama || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">Program Studi:</h6>
                <p className="form-control-plaintext">{detailData.konNama || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">Tahun Angkatan:</h6>
                <p className="form-control-plaintext">{detailData.mhsAngkatan || '-'}</p>
              </div>
              <div className="col-md-12 mb-3">
                <button type="button" className="btn btn-link p-0 text-primary text-decoration-underline" onClick={handleViewProfile}>
                  Lihat Profil Mahasiswa
                </button>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12">
                <h6 className="text-primary border-bottom pb-2 mb-3">Data Pengajuan</h6>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">Status:</h6>
                <p className="form-control-plaintext">
                  <span className={getStatusBadgeClass(detailData.status)}>{detailData.status || '-'}</span>
                </p>
              </div>
              <div className="col-md-12 mb-3">
                <h6 className="fw-bold">Lampiran File:</h6>
                <p className="form-control-plaintext mb-2">{detailData.lampiran || 'Tidak ada file'}</p>
                {detailData.lampiran && (
                  <Button classType="outline-primary" label="Download Lampiran" onClick={() => handleDownloadFile(detailData.lampiran)} size="sm" />
                )}
              </div>
            </div>

            {(detailData.approveDir1Date || detailData.approveDir1By) && (
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="text-primary border-bottom pb-2 mb-3">Data Persetujuan</h6>
                </div>
                <div className="col-md-6 mb-3">
                  <h6 className="fw-bold">Tanggal Persetujuan Wadir 1:</h6>
                  <p className="form-control-plaintext">{detailData.approveDir1Date || '-'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <h6 className="fw-bold">Disetujui Oleh:</h6>
                  <p className="form-control-plaintext">{detailData.approveDir1By || '-'}</p>
                </div>
              </div>
            )}

            {(detailData.suratNo || detailData.sk || detailData.spkb) && (
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="text-primary border-bottom pb-2 mb-3">Data Surat & Dokumen</h6>
                </div>
                <div className="col-md-6 mb-3">
                  <h6 className="fw-bold">Nomor Surat:</h6>
                  <p className="form-control-plaintext">{detailData.suratNo || '-'}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <h6 className="fw-bold">Nomor SPKB:</h6>
                  <p className="form-control-plaintext">{detailData.noSpkb || '-'}</p>
                </div>
                {detailData.sk && (
                  <div className="col-md-6 mb-3">
                    <h6 className="fw-bold">File SK:</h6>
                    <p className="form-control-plaintext mb-2">{detailData.sk}</p>
                    <Button classType="outline-success" label="Download SK" onClick={() => handleDownloadFile(detailData.sk)} size="sm" />
                  </div>
                )}
                {detailData.spkb && (
                  <div className="col-md-6 mb-3">
                    <h6 className="fw-bold">File SPKB:</h6>
                    <p className="form-control-plaintext mb-2">{detailData.spkb}</p>
                    <Button classType="outline-success" label="Download SPKB" onClick={() => handleDownloadFile(detailData.spkb)} size="sm" />
                  </div>
                )}
              </div>
            )}

            <div className="d-flex justify-content-end mt-4">
              <Button classType="secondary" label="Kembali" onClick={handleBack} />
            </div>
          </div>
        </div>
      )}
    </MainContent>
  );
}

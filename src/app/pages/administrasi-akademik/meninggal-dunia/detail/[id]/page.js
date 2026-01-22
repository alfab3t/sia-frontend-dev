"use client";

import { useState, useMemo, useEffect } from "react";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import { useRouter, useParams } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import { getUserData } from "@/context/user";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";

export default function DetailMeninggalDunia() {
  const router = useRouter();
  const params = useParams();
  const userData = useMemo(() => getUserData(), []);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const recordId = useMemo(() => {
    if (!params?.id) return null;
    
    try {
      const urlDecodedId = decodeURIComponent(params.id);
      const decryptedId = decryptIdUrl(urlDecodedId);
      return decryptedId;
    } catch {
      try {
        const decodedId = decodeURIComponent(params.id);
        return decodedId;
      } catch {
        return params.id;
      }
    }
  }, [params?.id]);

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      setError("ID tidak valid");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const encodedRecordId = encodeURIComponent(recordId);

        const response = await fetch(`${API_LINK}MeninggalDunia/${encodedRecordId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
          }
          
          throw new Error(errorMessage);
        }

        const responseText = await response.text();

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error("Invalid JSON response from server");
        }
        
        if (!data || typeof data !== 'object') {
          throw new Error("Invalid data structure received from server");
        }
        
        setDetailData(data);
        
      } catch (error) {
        setError(error.message);
        Toast.error(`Gagal memuat detail pengajuan: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [recordId]);

  const handleBack = () => {
    router.push("/pages/administrasi-akademik/meninggal-dunia");
  };

  const handleViewProfile = () => {
    if (!detailData?.mhsId) {
      Toast.error("ID Mahasiswa tidak tersedia.");
      return;
    }
    
    try {
      const encryptedMhsId = encryptIdUrl(detailData.mhsId);
      router.push(`/pages/Profil_Mahasiswa/${encryptedMhsId}`);
    } catch {
      Toast.error("Gagal membuka profil mahasiswa.");
    }
  };

  const handleDownloadReport = () => {
    if (!recordId || !detailData?.lampiran) {
      Toast.error("File lampiran tidak tersedia untuk didownload.");
      return;
    }
    
    const filename = detailData.lampiran;
    const downloadUrl = `${API_LINK}MeninggalDunia/file/${filename}`;
    window.open(downloadUrl, "_blank");
  };

  const handleDownloadSK = () => {
    if (!recordId || !detailData?.sk) {
      Toast.error("File SK tidak tersedia untuk didownload.");
      return;
    }
    
    const filename = detailData.sk;
    const downloadUrl = `${API_LINK}MeninggalDunia/file/${filename}`;
    window.open(downloadUrl, "_blank");
  };

  const handleDownloadSPKB = () => {
    if (!recordId || !detailData?.spkb) {
      Toast.error("File SPKB tidak tersedia untuk didownload.");
      return;
    }
    
    const filename = detailData.spkb;
    const downloadUrl = `${API_LINK}MeninggalDunia/file/${filename}`;
    window.open(downloadUrl, "_blank");
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'badge bg-light text-dark';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'draft':
        return 'badge bg-secondary';
      case 'disetujui':
        return 'badge bg-success';
      case 'ditolak':
        return 'badge bg-danger';
      case 'belum disetujui prodi':
        return 'badge bg-warning text-dark';
      case 'belum disetujui wadir 1':
        return 'badge bg-warning text-dark';
      case 'belum disetujui finance':
        return 'badge bg-warning text-dark';
      case 'menunggu upload sk':
        return 'badge bg-info';
      default:
        return 'badge bg-light text-dark';
    }
  };

  if (!mounted) {
    return (
      <MainContent
        title="Detail Pengajuan Meninggal Dunia"
        layout="Admin"
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Meninggal Dunia" },
          { label: "Detail Pengajuan" },
        ]}
      >
        <div className="text-center py-4">
          <div className="spinner-border" aria-live="polite">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Memuat halaman...</p>
        </div>
      </MainContent>
    );
  }

  if (loading) {
    return (
      <MainContent
        title="Detail Pengajuan Meninggal Dunia"
        layout="Admin"
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Meninggal Dunia" },
          { label: "Detail Pengajuan" },
        ]}
      >
        <div className="text-center py-4">
          <div className="spinner-border" aria-live="polite">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Memuat data pengajuan...</p>
        </div>
      </MainContent>
    );
  }

  if (error || !detailData) {
    return (
      <MainContent
        title="Detail Pengajuan Meninggal Dunia"
        layout="Admin"
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Meninggal Dunia" },
          { label: "Detail Pengajuan" },
        ]}
      >
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>
          </div>
          <h5 className="text-muted">Data tidak ditemukan</h5>
          <p className="text-muted">
            {error || "Pengajuan meninggal dunia tidak dapat ditemukan."}
          </p>
          <div className="mt-3">
            <Button
              classType="primary"
              label="Kembali"
              onClick={handleBack}
            />
          </div>
          <div className="mt-3">
            <small className="text-muted">
              ID yang dicari: {recordId}
            </small>
          </div>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent
      title="Detail Pengajuan Meninggal Dunia"
      layout="Admin"
      breadcrumb={[
        { label: "Sistem Informasi Akademik" },
        { label: "Administrasi Akademik" },
        { label: "Meninggal Dunia" },
        { label: "Detail Pengajuan" },
      ]}
    >
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <i className="fas fa-info-circle me-2"></i>
            <span>Informasi Pengajuan Meninggal Dunia</span>
          </h5>
        </div>
        <div className="card-body">
          {/* Data Mahasiswa */}
          <div className="row mb-4">
            <div className="col-12">
              <h6 className="text-primary border-bottom pb-2 mb-3">
                <i className="fas fa-user me-2"></i>Data Mahasiswa
              </h6>
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
              <h6 className="fw-bold">Singkatan Prodi:</h6>
              <p className="form-control-plaintext">{detailData.konSingkatan || '-'}</p>
            </div>
            <div className="col-md-6 mb-3">
              <h6 className="fw-bold">Tahun Angkatan:</h6>
              <p className="form-control-plaintext">{detailData.mhsAngkatan || '-'}</p>
            </div>
            <div className="col-md-12 mb-3">
              <button 
                type="button"
                className="btn btn-link p-0 text-primary text-decoration-underline" 
                onClick={handleViewProfile}
              >
                Lihat Profil Mahasiswa
              </button>
            </div>
          </div>

          {/* Data Pengajuan */}
          <div className="row mb-4">
            <div className="col-12">
              <h6 className="text-primary border-bottom pb-2 mb-3">
                <i className="fas fa-file-alt me-2"></i>Data Pengajuan
              </h6>
            </div>
            <div className="col-md-6 mb-3">
              <h6 className="fw-bold">Status:</h6>
              <p className="form-control-plaintext">
                <span className={getStatusBadgeClass(detailData.status)}>
                  {detailData.status || 'Status tidak diketahui'}
                </span>
              </p>
            </div>
            <div className="col-md-6 mb-3">
              <h6 className="fw-bold">Dibuat Oleh:</h6>
              <p className="form-control-plaintext">
                {(() => {
                  const createdBy = detailData.createdBy || '';
                  
                  if (createdBy.toLowerCase() === 'system') {
                    if (userData?.username) {
                      return userData.username;
                    }
                    if (userData?.nama) {
                      return userData.nama;
                    }
                    return 'System';
                  }
                  
                  if (createdBy && createdBy !== '-') {
                    return createdBy;
                  }
                  
                  if (userData?.username) {
                    return userData.username;
                  }
                  
                  return '-';
                })()}
              </p>
            </div>
            <div className="col-md-12 mb-3">
              <h6 className="fw-bold">Lampiran File:</h6>
              <p className="form-control-plaintext mb-2">
                {detailData.lampiran || 'Tidak ada file'}
              </p>
              {detailData.lampiran && (
                <Button
                  classType="outline-primary"
                  label="Download Lampiran"
                  onClick={handleDownloadReport}
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Data Persetujuan */}
          {(detailData.approveDir1Date || detailData.approveDir1By) && (
            <div className="row mb-4">
              <div className="col-12">
                <h6 className="text-primary border-bottom pb-2 mb-3">
                  <i className="fas fa-check-circle me-2"></i>Data Persetujuan
                </h6>
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

          {/* Data Surat & Dokumen */}
          {(detailData.suratNo || detailData.noSpkb || detailData.sk || detailData.spkb) && (
            <div className="row mb-4">
              <div className="col-12">
                <h6 className="text-primary border-bottom pb-2 mb-3">
                  <i className="fas fa-file-contract me-2"></i>Data Surat & Dokumen
                </h6>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">Nomor Surat:</h6>
                <p className="form-control-plaintext">{detailData.suratNo || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">Nomor SPKB:</h6>
                <p className="form-control-plaintext">{detailData.noSpkb || '-'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">File SK:</h6>
                <p className="form-control-plaintext mb-2">
                  {detailData.sk ? detailData.sk : 'Belum ada file SK'}
                </p>
                {detailData.sk && (
                  <Button
                    classType="outline-success"
                    label="Download SK"
                    onClick={handleDownloadSK}
                    size="sm"
                  />
                )}
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">File SPKB:</h6>
                <p className="form-control-plaintext mb-2">
                  {detailData.spkb ? detailData.spkb : 'Belum ada file SPKB'}
                </p>
                {detailData.spkb && (
                  <Button
                    classType="outline-success"
                    label="Download SPKB"
                    onClick={handleDownloadSPKB}
                    size="sm"
                  />
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="d-flex justify-content-end mt-4">
            <Button
              classType="secondary"
              label="Kembali"
              onClick={handleBack}
            />
          </div>
        </div>
      </div>
    </MainContent>
  );
}
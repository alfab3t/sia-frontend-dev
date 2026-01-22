"use client";

import { useState, useMemo, useEffect } from "react";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";
import { useRouter, useParams } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import { decryptIdUrl } from "@/lib/encryptor";

export default function EditMeninggalDunia() {
  const router = useRouter();
  const params = useParams();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingData, setExistingData] = useState(null);

  const [formData, setFormData] = useState({
    lampiranMeninggal: null,
    existingLampiran: "", 
    mhsId: "", 
  });

  const [errors, setErrors] = useState({});

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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      Toast.error("ID tidak valid");
      return;
    }

    const loadExistingData = async () => {
      setLoading(true);
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        setExistingData(data);
        
        setFormData({
          lampiranMeninggal: null,
          existingLampiran: data.lampiran || "",
          mhsId: data.mhsId || "",
        });
        
      } catch (error) {
        Toast.error(`Gagal memuat data: ${error.message}`);
        router.push("/pages/administrasi-akademik/meninggal-dunia");
      } finally {
        setLoading(false);
      }
    };

    loadExistingData();
  }, [recordId, router]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files?.[0]) {
      const file = files[0];
      const maxSize = 10 * 1024 * 1024;
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      if (file.size > maxSize) {
        Toast.error(`File ${file.name} terlalu besar. Maksimal 10MB.`);
        e.target.value = '';
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        Toast.error(`Format file ${file.name} tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG.`);
        e.target.value = '';
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.lampiranMeninggal && !formData.existingLampiran) {
      newErrors.lampiranMeninggal = "Lampiran file meninggal dunia wajib di-upload.";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      Toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    try {
      const fd = new FormData();
      
      fd.append("MhsId", formData.mhsId);
      
      if (formData.lampiranMeninggal && formData.lampiranMeninggal instanceof File) {
        fd.append("LampiranFile", formData.lampiranMeninggal, formData.lampiranMeninggal.name);
      }

      const encodedRecordId = encodeURIComponent(recordId);
      const res = await fetch(`${API_LINK}MeninggalDunia/${encodedRecordId}`, {
        method: "PUT",
        body: fd,
      });

      const raw = await res.text();

      let result;
      try {
        result = JSON.parse(raw);
      } catch {
        if (res.ok) {
          Toast.success("Data berhasil diperbarui.");
          router.push("/pages/administrasi-akademik/meninggal-dunia");
          return;
        } else {
          Toast.error("Server mengirim response tidak valid:\n\n" + raw);
          return;
        }
      }

      if (res.ok) {
        Toast.success(result?.message || "Data berhasil diperbarui.");
        router.push("/pages/administrasi-akademik/meninggal-dunia");
      } else {
        Toast.error(result?.message || "Gagal memperbarui data.");
      }
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.back();

  if (!mounted) {
    return (
      <MainContent
        title="Edit Pengajuan Meninggal Dunia"
        layout="Admin"
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Meninggal Dunia" },
          { label: "Edit Pengajuan" },
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
        title="Edit Pengajuan Meninggal Dunia"
        layout="Admin"
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Meninggal Dunia" },
          { label: "Edit Pengajuan" },
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

  if (!existingData) {
    return (
      <MainContent
        title="Edit Pengajuan Meninggal Dunia"
        layout="Admin"
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Meninggal Dunia" },
          { label: "Edit Pengajuan" },
        ]}
      >
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>
          </div>
          <h5 className="text-muted">Data tidak ditemukan</h5>
          <p className="text-muted">Pengajuan meninggal dunia tidak dapat ditemukan.</p>
          <div className="mt-3">
            <Button
              classType="primary"
              label="Kembali"
              onClick={handleCancel}
            />
          </div>
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent
      title="Edit Pengajuan Meninggal Dunia"
      layout="Admin"
      breadcrumb={[
        { label: "Sistem Informasi Akademik" },
        { label: "Administrasi Akademik" },
        { label: "Meninggal Dunia" },
        { label: "Edit Pengajuan" },
      ]}
    >
      <form onSubmit={handleSubmit}>
        <div className="row mt-3">
          <div className="col-lg-12">
            <Label
              text="Lampiran File Meninggal Dunia"
              htmlFor="lampiranMeninggal"
              required={true}
            />
            
            <input
              type="file"
              id="lampiranMeninggal"
              name="lampiranMeninggal"
              className="form-control rounded-4 blue-element"
              onChange={handleChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            
            {formData.existingLampiran && (
              <div className="mt-2">
                <small className="text-muted">File saat ini: </small>
                <span className="text-dark">{formData.existingLampiran}</span>
              </div>
            )}
            
            {errors.lampiranMeninggal && (
              <span className="fw-normal text-danger">{errors.lampiranMeninggal}</span>
            )}
            <small className="text-muted d-block mt-1">
              Format yang didukung: PDF, JPG, JPEG, PNG (Maksimal 10MB)
              {formData.existingLampiran && <br />}
              {formData.existingLampiran && ""}
            </small>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4 gap-2">
          <Button
            classType="secondary"
            label="Batal"
            type="button"
            onClick={handleCancel}
            isDisabled={saving}
          />
          <Button
            classType="primary"
            iconName="save"
            label={saving ? "Menyimpan..." : "Simpan Editor"}
            type="submit"
            isDisabled={saving}
          />
        </div>
      </form>
    </MainContent>
  );
}
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";
import { useRouter, useParams } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";
import Cookies from "js-cookie";

const maxFileSizeMB = 10 * 1024 * 1024;
const allowedFileTypes = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);

const validateFile = (file) => {
  if (file.size > maxFileSizeMB) {
    Toast.error(`File ${file.name} terlalu besar. Maksimal 10MB.`);
    return false;
  }
  if (!allowedFileTypes.has(file.type)) {
    Toast.error(`Format file ${file.name} tidak didukung. Gunakan PDF, JPG, atau PNG.`);
    return false;
  }
  return true;
};

export default function EditMeninggalDunia() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    lampiranMeninggal: null, existingLampiran: "", mhsId: "",
  });
  const [errors, setErrors] = useState({});

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
      setFormData({
        lampiranMeninggal: null,
        existingLampiran: data?.lampiran || "",
        mhsId: data?.mhsId || "",
      });
    } catch (err) {
      Toast.error(`Gagal memuat data: ${err.message}`);
      router.push("/pages/administrasi-akademik/meninggal-dunia");
    } finally {
      setLoading(false);
    }
  }, [recordId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = useCallback((e) => {
    const { name, value, files } = e.target;
    if (files?.[0]) {
      const file = files[0];
      if (!validateFile(file)) { e.target.value = ''; return; }
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.mhsId?.trim()) newErrors.mhsId = "ID Mahasiswa wajib diisi.";
    if (!formData.lampiranMeninggal && !formData.existingLampiran) {
      newErrors.lampiranMeninggal = "Lampiran file meninggal dunia wajib di-upload.";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return false;
    }
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("MhsId", formData.mhsId);
      if (formData.lampiranMeninggal instanceof File) {
        fd.append("Lampiran", formData.lampiranMeninggal.name);
        fd.append("LampiranFile", formData.lampiranMeninggal, formData.lampiranMeninggal.name);
      } else if (formData.existingLampiran) {
        fd.append("Lampiran", formData.existingLampiran);
      }
      const token = Cookies.get("jwtToken");
      const res = await fetch(`${API_LINK}MeninggalDunia/UpdateMeninggalDunia/${encodeURIComponent(recordId)}`, {
        method: "PUT",
        headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: fd,
      });
      if (!res.ok) {
        const errorText = await res.text();
        let msg = `HTTP ${res.status}`;
        try { const e = JSON.parse(errorText); msg = e.message || msg; } catch { /* use default */ }
        throw new Error(msg);
      }
      const raw = await res.text();
      let result;
      try { result = JSON.parse(raw); } catch { /* non-JSON success */ }
      Toast.success(result?.message || "Data berhasil diperbarui.");
      router.push("/pages/administrasi-akademik/meninggal-dunia");
    } catch (err) {
      Toast.error(`Gagal memperbarui data: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [saving, validate, formData, recordId, router]);

  const handleCancel = useCallback(() => router.back(), [router]);

  return (
    <MainContent
      title="Edit Pengajuan Meninggal Dunia"
      layout="Admin"
      loading={loading}
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
            <Label text="Lampiran File Meninggal Dunia" htmlFor="lampiranMeninggal" required={true} />
            <input
              type="file"
              id="lampiranMeninggal"
              name="lampiranMeninggal"
              className="form-control rounded-4 blue-element"
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {formData.existingLampiran && (
              <div className="mt-2">
                <small className="text-muted">File saat ini: </small>
                <span className="text-dark">{formData.existingLampiran}</span>
              </div>
            )}
            {errors.lampiranMeninggal && <span className="fw-normal text-danger">{errors.lampiranMeninggal}</span>}
            <small className="text-muted d-block mt-1">
              Format yang didukung: PDF, JPG, JPEG, PNG (Maksimal 10MB)
              {formData.existingLampiran && " — Kosongkan jika tidak ingin mengubah file"}
            </small>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4 gap-2">
          <Button classType="secondary" label="Batal" type="button" onClick={handleCancel} isDisabled={saving} />
          <Button classType="primary" iconName="save" label={saving ? "Menyimpan..." : "Simpan Perubahan"} type="submit" isDisabled={saving} />
        </div>
      </form>
    </MainContent>
  );
}

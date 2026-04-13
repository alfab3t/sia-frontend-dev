"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import DropDown from "@/components/common/Dropdown";
import Label from "@/components/common/Label";
import Input from "@/components/common/Input";
import { useRouter, useParams } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";
import { getUserData } from "@/context/user";
import Cookies from "js-cookie";

const Editor = dynamic(() => import("@/components/common/Editor"), {
  ssr: false,
  loading: () => <div className="p-3 border rounded text-muted">Loading Editor...</div>,
});

const maxFileSizeMB = 10 * 1024 * 1024;
const allowedFileTypes = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);

const validateFile = (file) => {
  if (file.size > maxFileSizeMB) {
    Toast.error(`File ${file.name} terlalu besar. Maksimal 10MB.`);
    return false;
  }
  if (!allowedFileTypes.has(file.type)) {
    Toast.error(`Format file ${file.name} tidak didukung. Gunakan PDF, JPG, JPEG, atau PNG.`);
    return false;
  }
  return true;
};

const generateTahunAkademik = (angkatan) => {
  if (!angkatan) {
    const y = new Date().getFullYear();
    return [
      { Value: `${y-1}/${y}`, Text: `${y-1}/${y}` },
      { Value: `${y}/${y+1}`, Text: `${y}/${y+1}` },
      { Value: `${y+1}/${y+2}`, Text: `${y+1}/${y+2}` },
    ];
  }
  const base = new Date().getFullYear() - 1;
  const angkatanInt = Number.parseInt(angkatan, 10);
  const list = [];
  for (let i = base; i <= angkatanInt + 3; i++) {
    list.push({ Value: `${i}/${i+1}`, Text: `${i}/${i+1}` });
  }
  return list;
};

const semesterData = [
  { Value: "Ganjil", Text: "Ganjil" },
  { Value: "Genap", Text: "Genap" },
];

export default function EditCutiAkademikPage() {
  const router = useRouter();
  const params = useParams();
  const userData = useMemo(() => getUserData(), []);

  const roleId = userData?.roleId || "";
  const isProdi = roleId === "ROL71";
  const isMahasiswa = roleId === "ROL23";

  const realId = useMemo(() => {
    try { return decryptIdUrl(params?.id || ""); } catch { return ""; }
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prodiList, setProdiList] = useState([]);
  const [tahunAjaranData, setTahunAjaranData] = useState([]);
  const [formData, setFormData] = useState({
    tahunAjaran: "", semester: "", suratPernyataan: null, lampiran: null,
    oldSurat: "", oldLampiran: "", konId: "", mhsId: "", angkatan: "",
    menimbang: "", prodiNama: "", mahasiswaNama: "",
  });
  const [errors, setErrors] = useState({});

  const tahunAjaranRef = useRef();
  const semesterRef = useRef();

  // Load prodi list for prodi role
  useEffect(() => {
    const username = userData?.username || userData?.nama;
    if (!isProdi || !username) return;
    const load = async () => {
      try {
        const data = await fetchData(
          `${API_LINK}CutiAkademik/GetKonsentrasiBySekprod?username=${username}`,
          {}, "GET"
        );
        setProdiList((Array.isArray(data) ? data : []).map(item => ({
          Value: item.id, Text: item.nama,
        })));
      } catch {
        Toast.error("Terjadi kesalahan saat memuat daftar program studi.");
      }
    };
    load();
  }, [isProdi, userData?.username, userData?.nama]);

  // Load mahasiswa angkatan for mahasiswa role
  useEffect(() => {
    if (!isMahasiswa || !userData || !realId) return;
    const load = async () => {
      const mhsId = userData?.nama || userData?.mhsId || userData?.userid || userData?.username || "";
      if (!mhsId) return;
      try {
        const data = await fetchData(
          `${API_LINK}CutiAkademik/GetDetailMahasiswa?mahasiswaId=${mhsId}`,
          {}, "GET"
        );
        setFormData(prev => ({ ...prev, angkatan: data?.mhsAngkatan?.toString() || "" }));
      } catch {
        // silently fail
      }
    };
    load();
  }, [isMahasiswa, userData, realId]);

  // Generate tahun ajaran options
  useEffect(() => {
    if (formData.tahunAjaran) {
      setTahunAjaranData([{ Value: formData.tahunAjaran, Text: formData.tahunAjaran }]);
    } else if (formData.angkatan) {
      setTahunAjaranData(generateTahunAkademik(formData.angkatan));
    } else {
      setTahunAjaranData(generateTahunAkademik(null));
    }
  }, [formData.angkatan, formData.tahunAjaran]);

  // Load detail data
  const loadDetailFromApi = useCallback(async () => {
    if (!realId) {
      Toast.error("ID tidak valid.");
      router.push("/pages/administrasi-akademik/cuti-akademik");
      return;
    }
    try {
      const data = await fetchData(
        `${API_LINK}CutiAkademik/GetDetailCutiAkademik?id=${encodeURIComponent(realId)}`,
        {}, "GET"
      );
      if (!data?.id) return;
      setFormData(prev => ({
        ...prev,
        tahunAjaran: data.tahunAjaran || "",
        semester: data.semester || "",
        oldSurat: data.lampiranSP || "",
        oldLampiran: data.lampiran || "",
        suratPernyataan: null, lampiran: null,
        mhsId: data.mhsId || "",
        menimbang: data.menimbang || "",
        prodiNama: data.prodiNama || data.kon_nama || data.konsentrasi || "",
        mahasiswaNama: data.mahasiswaNama || data.mhs_nama || data.mahasiswa || "",
        angkatan: data.angkatan || data.mhs_angkatan || "",
      }));
    } catch (err) {
      Toast.error("Gagal memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [realId, router]);

  useEffect(() => {
    loadDetailFromApi();
  }, [loadDetailFromApi]);

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

  const handleEditorChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (isProdi) {
      if (!formData.menimbang || formData.menimbang.trim() === "" || formData.menimbang === "<p></p>") {
        newErrors.menimbang = "Menimbang/pertimbangan wajib diisi.";
      }
    }
    if (!formData.tahunAjaran) newErrors.tahunAjaran = "Tahun akademik wajib diisi.";
    if (!formData.semester) newErrors.semester = "Semester wajib diisi.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return false;
    }
    return true;
  }, [formData, isProdi]);

  const buildFormData = useCallback(() => {
    const fd = new FormData();
    fd.append("Id", realId);
    fd.append("TahunAjaran", formData.tahunAjaran);
    fd.append("Semester", formData.semester);
    if (formData.suratPernyataan instanceof File) {
      fd.append("LampiranSuratPengajuan", formData.suratPernyataan, formData.suratPernyataan.name);
    }
    if (formData.lampiran instanceof File) {
      fd.append("Lampiran", formData.lampiran, formData.lampiran.name);
    }
    if (isProdi) {
      fd.append("MhsId", formData.mhsId);
      fd.append("Menimbang", formData.menimbang);
    }
    const modifiedBy = userData?.mhsId || userData?.userid || userData?.username || userData?.nama || "SYSTEM";
    fd.append("ModifiedBy", modifiedBy);
    return fd;
  }, [realId, formData, isProdi, userData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    try {
      const fd = buildFormData();
      const token = Cookies.get("jwtToken");
      const res = await fetch(`${API_LINK}CutiAkademik/UpdateCutiAkademik/${realId}`, {
        method: "PUT",
        headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: fd,
      });
      const raw = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const e = JSON.parse(raw); msg = e.message || e.error || msg; } catch { /* use default */ }
        Toast.error(`Gagal menyimpan: ${msg}`);
        return;
      }
      let result;
      try { result = JSON.parse(raw); } catch {
        Toast.error("Response server tidak valid.");
        return;
      }
      if (result?.message?.toLowerCase().includes("berhasil")) {
        Toast.success("Perubahan berhasil disimpan.");
        router.push("/pages/administrasi-akademik/cuti-akademik");
      } else {
        Toast.error(result?.message || "Gagal menyimpan perubahan.");
      }
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }, [saving, validate, buildFormData, realId, router]);

  const handleCancel = useCallback(() => router.back(), [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title={isProdi ? "Edit Pengajuan Cuti Akademik (Prodi)" : "Edit Pengajuan Cuti Akademik"}
      breadcrumb={[
        { label: "Sistem Informasi Akademik" },
        { label: "Administrasi Akademik" },
        { label: "Cuti Akademik" },
        { label: isProdi ? "Edit Pengajuan (Prodi)" : "Edit Pengajuan" },
      ]}
    >
      <form onSubmit={handleSubmit}>
        {isProdi && (
          <div className="row mt-3">
            <div className="col-lg-4">
              <Input label="Program Studi" name="konId" value={formData.prodiNama || prodiList.find(p => p.Value === formData.konId)?.Text || ""} onChange={() => {}} disabled={true} required={true} />
            </div>
            <div className="col-lg-4">
              <Input label="Mahasiswa" name="mhsId" value={formData.mahasiswaNama || ""} onChange={() => {}} disabled={true} required={true} />
            </div>
            <div className="col-lg-4">
              <Input label="Angkatan" name="angkatan" value={formData.angkatan} onChange={() => {}} disabled={true} required={false} />
            </div>
          </div>
        )}

        <div className="row mt-3">
          <div className="col-lg-6">
            <DropDown
              ref={tahunAjaranRef}
              forInput="tahunAjaran"
              label="Tahun Akademik Mulai Cuti"
              type="pilih"
              arrData={tahunAjaranData}
              value={formData.tahunAjaran}
              onChange={handleChange}
              isRequired={true}
              errorMessage={errors.tahunAjaran}
              isDisabled={(isProdi && !formData.mhsId) || (isMahasiswa && !formData.angkatan)}
            />
            {isMahasiswa && !formData.angkatan && (
              <small className="text-muted">Memuat opsi tahun akademik...</small>
            )}
          </div>
          <div className="col-lg-6">
            <DropDown
              ref={semesterRef}
              forInput="semester"
              label="Semester Mulai Cuti"
              type="pilih"
              arrData={semesterData}
              value={formData.semester}
              onChange={handleChange}
              isRequired={true}
              errorMessage={errors.semester}
            />
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-lg-6">
            <Label text={isProdi ? "Berkas Surat Pernyataan" : "Surat Pernyataan"} htmlFor="suratPernyataan" required={false} />
            <input type="file" className="form-control rounded-4 blue-element" name="suratPernyataan" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
            {errors.suratPernyataan && <span className="fw-normal text-danger">{errors.suratPernyataan}</span>}
            <small className="text-muted">File sebelumnya: {formData.oldSurat || "-"}</small><br />
            <small className="text-muted">Upload file baru jika ingin mengganti. Format: PDF, JPG, JPEG, PNG (Maks 10MB)</small>
          </div>
          <div className="col-lg-6">
            <Label text={isProdi ? "Berkas Lampiran" : "Lampiran"} htmlFor="lampiran" required={false} />
            <input type="file" className="form-control rounded-4 blue-element" name="lampiran" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
            {errors.lampiran && <span className="fw-normal text-danger">{errors.lampiran}</span>}
            <small className="text-muted">File sebelumnya: {formData.oldLampiran || "-"}</small><br />
            <small className="text-muted">Upload file baru jika ingin mengganti. Format: PDF, JPG, JPEG, PNG (Maks 10MB)</small>
          </div>
        </div>

        {isProdi && (
          <div className="row mt-4">
            <div className="col-lg-12">
              <Editor label="Menimbang" name="menimbang" value={formData.menimbang} onChange={handleEditorChange} error={errors.menimbang} />
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end mt-4 gap-2">
          <Button classType="secondary" label="Batal" type="button" onClick={handleCancel} isDisabled={saving} />
          <Button classType="primary" iconName="save" label={saving ? "Menyimpan..." : "Simpan"} type="submit" isDisabled={saving} />
        </div>
      </form>
    </MainContent>
  );
}

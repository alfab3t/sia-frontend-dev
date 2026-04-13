"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";
import Input from "@/components/common/Input";
import { useRouter } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { getUserData } from "@/context/user";
import Cookies from "js-cookie";

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

export default function AddMeninggalDunia() {
  const router = useRouter();
  const userData = useMemo(() => getUserData(), []);

  const roleId = userData?.roleId || "";
  const isProdi = roleId === "ROL71";

  const [saving, setSaving] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [filteredStudentList, setFilteredStudentList] = useState([]);
  const [prodiKonsentrasi, setProdiKonsentrasi] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMahasiswa, setSearchMahasiswa] = useState("");
  const [formData, setFormData] = useState({
    mhsId: "", prodi: "", tahunAngkatan: "", lampiranMeninggal: null,
  });
  const [errors, setErrors] = useState({});

  const mahasiswaRef = useRef();

  // Load konsentrasi for prodi role
  useEffect(() => {
    if (!isProdi || !userData) return;
    const username = userData?.username || userData?.nama;
    if (!username) return;
    const load = async () => {
      try {
        const data = await fetchData(
          `${API_LINK}MeninggalDunia/GetKonsentrasiBySekprod?username=${username}`,
          {}, "GET"
        );
        if (Array.isArray(data) && data.length > 0) {
          setProdiKonsentrasi(data[0].nama || "");
        }
      } catch {
        // silently fail
      }
    };
    load();
  }, [isProdi, userData]);

  // Load student list
  useEffect(() => {
    const load = async () => {
      try {
        const username = userData?.username || userData?.nama;
        let students = [];

        if (isProdi && username) {
          const data = await fetchData(
            `${API_LINK}MeninggalDunia/GetMahasiswaByKonsentrasi?username=${username}`,
            {}, "GET"
          );
          students = (Array.isArray(data) ? data : []).map((item, i) => ({
            Value: item.mhsId || `mhs-${i}`,
            Text: item.mhsNama || `Mahasiswa ${i + 1}`,
          }));
        } else {
          const data = await fetchData(
            `${API_LINK}MeninggalDunia/GetMahasiswaDropdownForMeninggalDunia`,
            {}, "GET"
          );
          const usedValues = new Set();
          students = (Array.isArray(data) ? data : []).map((item, i) => {
            let val = item.mhsId || item.id || item.nim || `student-${i}`;
            while (usedValues.has(val)) val = `${val}_${i}`;
            usedValues.add(val);
            return { Value: val, Text: item.mhsNama || item.nama || `Mahasiswa ${i + 1}` };
          });
        }

        setStudentList(students);
      } catch {
        Toast.error("Terjadi kesalahan saat memuat daftar mahasiswa.");
      }
    };
    load();
  }, [isProdi, prodiKonsentrasi, userData]);

  useEffect(() => {
    setFilteredStudentList(studentList);
  }, [studentList]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mahasiswaRef.current && !mahasiswaRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleStudentSelect = useCallback(async (mhsId) => {
    setFormData(prev => ({ ...prev, mhsId, prodi: "", tahunAngkatan: "" }));
    setShowDropdown(false);
    setSearchMahasiswa("");
    if (!mhsId) return;
    try {
      const data = await fetchData(
        `${API_LINK}MeninggalDunia/GetMahasiswaDetailForMeninggalDunia/${mhsId}`,
        {}, "GET"
      );
      setFormData(prev => ({
        ...prev,
        mhsId,
        prodi: data?.programStudi || data?.konsentrasi || "",
        tahunAngkatan: data?.mhsAngkatan || "",
      }));
    } catch {
      Toast.error("Terjadi kesalahan saat memuat detail mahasiswa.");
    }
  }, []);

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
    if (!formData.mhsId) newErrors.mhsId = "Mahasiswa harus dipilih.";
    if (!formData.prodi) newErrors.prodi = "Program studi harus diisi (otomatis dari mahasiswa).";
    if (!formData.tahunAngkatan) newErrors.tahunAngkatan = "Tahun angkatan harus diisi (otomatis dari mahasiswa).";
    if (!formData.lampiranMeninggal) newErrors.lampiranMeninggal = "Lampiran file meninggal dunia wajib di-upload.";
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
        fd.append("LampiranFile", formData.lampiranMeninggal, formData.lampiranMeninggal.name);
      }
      const token = Cookies.get("jwtToken");
      const res = await fetch(`${API_LINK}MeninggalDunia/CreateMeninggalDunia`, {
        method: "POST",
        headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: fd,
      });
      const raw = await res.text();
      let result;
      try { result = JSON.parse(raw); } catch {
        Toast.error("Server mengirim response tidak valid.");
        return;
      }
      if (result?.id) {
        if (isProdi) {
          const apps = JSON.parse(sessionStorage.getItem('prodiCreatedMeninggalApps') || '[]');
          if (!apps.includes(result.id)) {
            apps.push(result.id);
            sessionStorage.setItem('prodiCreatedMeninggalApps', JSON.stringify(apps));
          }
          Toast.success("Pengajuan Meninggal Dunia berhasil dibuat untuk mahasiswa.");
        } else {
          Toast.success("Pengajuan Meninggal Dunia berhasil dibuat.");
        }
        router.push("/pages/administrasi-akademik/meninggal-dunia");
      } else {
        Toast.error(result?.message || "Gagal membuat pengajuan.");
      }
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }, [saving, validate, formData, isProdi, router]);

  const handleCancel = useCallback(() => router.back(), [router]);

  return (
    <MainContent
      title={isProdi ? "Tambah Pengajuan Meninggal Dunia (Prodi)" : "Tambah Pengajuan Meninggal Dunia"}
      layout="Admin"
      breadcrumb={[
        { label: "Sistem Informasi Akademik" },
        { label: "Administrasi Akademik" },
        { label: "Meninggal Dunia" },
        { label: "Tambah Pengajuan" },
      ]}
    >
      <form onSubmit={handleSubmit}>
        <div className="row mt-3">
          <div className="col-lg-12">
            <Label required={true} text="Mahasiswa" htmlFor="mhsId" />
            <div style={{ position: 'relative' }} ref={mahasiswaRef}>
              <button
                type="button"
                className="form-select rounded-4 text-start"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#e8eaf6', borderColor: '#d1d5e8', color: '#5f6368' }}
              >
                <span style={{ color: formData.mhsId ? '#5f6368' : '#9e9e9e' }}>
                  {formData.mhsId ? studentList.find(s => s.Value === formData.mhsId)?.Text || '-- Pilih Mahasiswa --' : '-- Pilih Mahasiswa --'}
                </span>
              </button>
              {showDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, backgroundColor: 'white', border: '1px solid #ced4da', borderRadius: '0.375rem', marginTop: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid #dee2e6' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cari mahasiswa..."
                      value={searchMahasiswa}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSearchMahasiswa(v);
                        setFilteredStudentList(v.trim() === "" ? studentList : studentList.filter(s => s.Text.toLowerCase().includes(v.toLowerCase())));
                      }}
                      autoFocus
                      style={{ fontSize: '0.9rem', backgroundColor: '#f0f4ff' }}
                    />
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: '250px' }}>
                    <div style={{ padding: '0.5rem 0.75rem', color: '#6c757d', backgroundColor: '#e9ecef', borderBottom: '1px solid #dee2e6', fontSize: '0.95rem' }}>-- Pilih Mahasiswa --</div>
                    {filteredStudentList.length > 0 ? filteredStudentList.map(s => (
                      <button key={s.Value} type="button" onClick={() => handleStudentSelect(s.Value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', cursor: 'pointer', backgroundColor: formData.mhsId === s.Value ? '#e3f2fd' : 'white', border: 'none', borderBottom: '1px solid #f0f0f0', fontSize: '0.95rem', textAlign: 'left', color: '#212529' }}>
                        {s.Text}
                      </button>
                    )) : (
                      <div style={{ padding: '0.5rem 0.75rem', color: '#6c757d', fontSize: '0.95rem' }}>
                        {studentList.length > 0 ? 'Tidak ada data ditemukan' : 'Memuat data mahasiswa...'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.mhsId && <span className="fw-normal text-danger">{errors.mhsId}</span>}
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-lg-6">
            <Input label="Program Studi" name="prodi" value={formData.prodi} onChange={() => {}} disabled={true} required={true} error={errors.prodi} />
          </div>
          <div className="col-lg-6">
            <Input label="Tahun Angkatan" name="tahunAngkatan" value={formData.tahunAngkatan} onChange={() => {}} disabled={true} required={true} error={errors.tahunAngkatan} />
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-lg-12">
            <Label text="Lampiran File Meninggal Dunia" htmlFor="lampiranMeninggal" required={true} />
            <input type="file" id="lampiranMeninggal" name="lampiranMeninggal" className="form-control rounded-4 blue-element" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
            {errors.lampiranMeninggal && <span className="fw-normal text-danger">{errors.lampiranMeninggal}</span>}
            <small className="text-muted">Format yang didukung: PDF, JPG, JPEG, PNG (Maksimal 10MB)</small>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4 gap-2">
          <Button classType="secondary" label="Batal" type="button" onClick={handleCancel} isDisabled={saving} />
          <Button classType="primary" iconName="save" label={saving ? "Menyimpan..." : "Simpan"} type="submit" isDisabled={saving} />
        </div>
      </form>
    </MainContent>
  );
}

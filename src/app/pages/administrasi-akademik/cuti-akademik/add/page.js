"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import DropDown from "@/components/common/Dropdown";
import Label from "@/components/common/Label";
import { useRouter } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { getUserData } from "@/context/user";
import Cookies from "js-cookie";

const Editor = dynamic(() => import("@/components/common/Editor"), {
  ssr: false,
  loading: () => <div className="p-3 border rounded text-muted">Loading Editor...</div>,
});

const maxFileSizeMB = 10 * 1024 * 1024;
const allowedFileTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/jpg', 'image/png',
]);

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

const mapProdiData = (data) => {
  const mapped = data.map((item, i) => ({
    Value: item.id || item.konId || `prodi-${i}`,
    Text: item.nama || `Program Studi ${i + 1}`,
  }));
  return mapped.filter((p, i, self) => i === self.findIndex(x => x.Value === p.Value));
};

const mapStudentData = (data) => {
  const mapped = data.map((item, i) => ({
    Value: item.mhsId || `student-${i}`,
    Text: item.mhsNama || `Mahasiswa ${i + 1}`,
  }));
  return mapped.filter((s, i, self) => i === self.findIndex(x => x.Value === s.Value));
};

const generateTahunAkademikOptions = (angkatan) => {
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
  return list.filter((item, i, self) => i === self.findIndex(t => t.Value === item.Value));
};

const semesterData = [
  { Value: "Ganjil", Text: "Ganjil" },
  { Value: "Genap", Text: "Genap" },
];

export default function AddCutiAkademik() {
  const router = useRouter();
  const userData = useMemo(() => getUserData(), []);

  const roleId = userData?.roleId || "";
  const isProdi = roleId === "ROL71";
  const isMahasiswa = roleId === "ROL23";

  const [saving, setSaving] = useState(false);
  const [prodiList, setProdiList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [loadingProdi, setLoadingProdi] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [bebasTanggunganStatus, setBebasTanggunganStatus] = useState(null);
  const [existingCutiData, setExistingCutiData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMahasiswa, setSearchMahasiswa] = useState("");
  const [filteredStudentList, setFilteredStudentList] = useState([]);
  const [tahunAjaranData, setTahunAjaranData] = useState([]);
  const [formData, setFormData] = useState({
    tahunAjaran: "", semester: "", suratPernyataan: null,
    lampiran: null, konId: "", mhsId: "", angkatan: "", menimbang: "",
  });
  const [errors, setErrors] = useState({});

  const prodiRef = useRef();
  const mahasiswaRef = useRef();
  const tahunAjaranRef = useRef();
  const semesterRef = useRef();

  const extractArrayFromResponse = useCallback((data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      for (const prop of ['data', 'items', 'result']) {
        if (Array.isArray(data[prop])) return data[prop];
      }
      const key = Object.keys(data).find(k => Array.isArray(data[k]));
      return key ? data[key] : [];
    }
    return [];
  }, []);

  const isTahunAkademikUsed = useCallback((tahun) => {
    return existingCutiData.some(item => {
      const t = item.tahunAjaran || item.cak_tahun_ajaran || "";
      return t === tahun;
    });
  }, [existingCutiData]);

  const getAvailableTahunAkademik = useCallback((all) => {
    return all.filter(opt => !isTahunAkademikUsed(opt.Value));
  }, [isTahunAkademikUsed]);

  const loadStudentsForKonId = useCallback(async (konId) => {
    if (!konId) { setStudentList([]); return; }
    setLoadingStudents(true);
    try {
      const username = userData?.username || userData?.nama;
      const data = await fetchData(
        `${API_LINK}CutiAkademik/GetMahasiswaByKonsentrasi?username=${username}`,
        {}, "GET"
      );
      setStudentList(mapStudentData(Array.isArray(data) ? data : []));
    } catch {
      Toast.error("Terjadi kesalahan saat memuat daftar mahasiswa.");
      setStudentList([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [userData]);

  useEffect(() => {
    const username = userData?.username || userData?.nama;
    if (!isProdi || !username) return;

    const loadProdi = async () => {
      setLoadingProdi(true);
      try {
        const data = await fetchData(
          `${API_LINK}CutiAkademik/GetKonsentrasiBySekprod?username=${username}`,
          {}, "GET"
        );
        const uniqueProdi = mapProdiData(Array.isArray(data) ? data : []);
        setProdiList(uniqueProdi);
        if (uniqueProdi.length === 1) {
          setFormData(prev => ({ ...prev, konId: uniqueProdi[0].Value }));
          loadStudentsForKonId(uniqueProdi[0].Value);
        }
      } catch {
        Toast.error("Terjadi kesalahan saat memuat daftar program studi.");
      } finally {
        setLoadingProdi(false);
      }
    };
    loadProdi();
  }, [isProdi, userData?.username, userData?.nama, loadStudentsForKonId]);

  useEffect(() => {
    if (!isMahasiswa || !userData) return;
    const loadMahasiswaData = async () => {
      const mhsId = userData?.mhsId || userData?.userid || userData?.username || userData?.nama || "";
      if (!mhsId) return;
      try {
        const data = await fetchData(
          `${API_LINK}CutiAkademik/GetDetailMahasiswa?mahasiswaId=${mhsId}`,
          {}, "GET"
        );
        setFormData(prev => ({
          ...prev, mhsId, angkatan: data?.mhsAngkatan?.toString() || "",
        }));
      } catch {
        Toast.error("Terjadi kesalahan saat memuat data mahasiswa.");
      }
    };
    loadMahasiswaData();
  }, [isMahasiswa, userData]);

  useEffect(() => {
    let targetMhsId = "";
    if (isMahasiswa) {
      targetMhsId = userData?.mhsId || userData?.userid || userData?.username || userData?.nama || "";
    } else if (isProdi && formData.mhsId) {
      targetMhsId = formData.mhsId;
    }
    if (!targetMhsId) { setExistingCutiData([]); return; }

    const check = async () => {
      try {
        const data = await fetchData(
          `${API_LINK}CutiAkademik/GetAllCutiAkademik?mhsId=${targetMhsId}&pageNumber=1&pageSize=100`,
          {}, "GET"
        );
        const actual = extractArrayFromResponse(data);
        setExistingCutiData(actual.filter(item => {
          const s = item.status || item.cak_status || "";
          return s !== "Ditolak";
        }));
      } catch {
        setExistingCutiData([]);
      }
    };
    check();
  }, [isMahasiswa, isProdi, formData.mhsId, userData, extractArrayFromResponse]);

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

  useEffect(() => {
    if ((isProdi || isMahasiswa) && formData.angkatan) {
      const all = generateTahunAkademikOptions(formData.angkatan);
      const available = getAvailableTahunAkademik(all);
      setTahunAjaranData(available);
      if (formData.tahunAjaran && !available.some(i => i.Value === formData.tahunAjaran)) {
        setFormData(prev => ({ ...prev, tahunAjaran: "" }));
      }
    } else {
      setTahunAjaranData(generateTahunAkademikOptions(null));
    }
  }, [formData.angkatan, isProdi, isMahasiswa, getAvailableTahunAkademik, formData.tahunAjaran]);

  const handleProdiChange = useCallback(async (e) => {
    const konId = e.target.value;
    setFormData(prev => ({ ...prev, konId, mhsId: "", angkatan: "" }));
    setSearchMahasiswa("");
    setShowDropdown(false);
    await loadStudentsForKonId(konId);
  }, [loadStudentsForKonId]);

  const handleStudentSelect = useCallback(async (mhsId) => {
    setFormData(prev => ({ ...prev, mhsId, angkatan: "" }));
    setShowDropdown(false);
    setSearchMahasiswa("");
    setBebasTanggunganStatus(null);
    if (!mhsId) return;
    try {
      if (isProdi) {
        const btData = await fetchData(
          `${API_LINK}CutiAkademik/CheckBebasTanggungan?userId=${mhsId}`,
          {}, "GET"
        );
        setBebasTanggunganStatus(btData?.status || null);
      }
      const detail = await fetchData(
        `${API_LINK}CutiAkademik/GetDetailMahasiswa?mahasiswaId=${mhsId}`,
        {}, "GET"
      );
      setFormData(prev => ({ ...prev, angkatan: (detail?.mhsAngkatan || "").toString() }));
    } catch {
      Toast.error("Terjadi kesalahan saat memuat detail mahasiswa.");
    }
  }, [isProdi]);

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
      if (!formData.konId) newErrors.konId = "Program studi harus dipilih.";
      if (!formData.mhsId) newErrors.mhsId = "Mahasiswa harus dipilih.";
      if (!formData.menimbang || formData.menimbang.trim() === "" || formData.menimbang === "<p></p>") {
        newErrors.menimbang = "Menimbang/pertimbangan wajib diisi.";
      }
    }
    if (!formData.tahunAjaran) {
      newErrors.tahunAjaran = "Tahun akademik wajib diisi.";
    } else if (isTahunAkademikUsed(formData.tahunAjaran)) {
      newErrors.tahunAjaran = `Mahasiswa sudah pernah mengajukan cuti di tahun ${formData.tahunAjaran}.`;
    }
    if (!formData.semester) newErrors.semester = "Semester wajib diisi.";
    if (!formData.suratPernyataan) newErrors.suratPernyataan = "Surat pernyataan wajib di-upload.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return false;
    }
    return true;
  }, [formData, isProdi, isTahunAkademikUsed]);

  const buildFormData = useCallback(() => {
    const fd = new FormData();
    if (isProdi) {
      const approvalProdi = userData?.nama || userData?.username || userData?.userid || "";
      fd.append("MhsId", formData.mhsId);
      fd.append("TahunAjaran", formData.tahunAjaran);
      fd.append("Semester", formData.semester);
      fd.append("Menimbang", formData.menimbang);
      fd.append("ApprovalProdi", approvalProdi);
      fd.append("CreatedBy", approvalProdi);
    } else {
      const mhsId = userData?.mhsId || userData?.userid || userData?.username || userData?.nama || "";
      if (!mhsId) { Toast.error("User tidak valid."); return null; }
      fd.append("MhsId", mhsId);
      fd.append("TahunAjaran", formData.tahunAjaran);
      fd.append("Semester", formData.semester);
      fd.append("CreatedBy", mhsId);
    }
    if (formData.suratPernyataan instanceof File) {
      fd.append("LampiranSuratPengajuan", formData.suratPernyataan, formData.suratPernyataan.name);
    }
    if (formData.lampiran instanceof File) {
      fd.append("Lampiran", formData.lampiran, formData.lampiran.name);
    }
    return fd;
  }, [isProdi, formData, userData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    try {
      const fd = buildFormData();
      if (!fd) return;

      const endpoint = isProdi
        ? `${API_LINK}CutiAkademik/CreateDraftCutiAkademikByProdi`
        : `${API_LINK}CutiAkademik/CreateDraftCutiAkademik`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${Cookies.get("jwtToken")}` },
        body: fd,
      });

      const raw = await res.text();
      let result;
      try { result = JSON.parse(raw); } catch {
        Toast.error("Server mengirim response tidak valid.");
        return;
      }

      if (result?.draftId) {
        if (isProdi) {
          const apps = JSON.parse(sessionStorage.getItem('prodiCreatedApps') || '[]');
          if (!apps.includes(result.draftId)) {
            apps.push(result.draftId);
            sessionStorage.setItem('prodiCreatedApps', JSON.stringify(apps));
          }
          Toast.success("Pengajuan Cuti berhasil dibuat untuk mahasiswa.");
        } else {
          Toast.success("Pengajuan Cuti berhasil dibuat.");
        }
        router.push("/pages/administrasi-akademik/cuti-akademik");
      } else {
        Toast.error(result?.message || "Gagal membuat pengajuan.");
      }
    } catch {
      Toast.error("Gagal mengambil data Cuti Akademik");
    } finally {
      setSaving(false);
    }
  }, [saving, validate, buildFormData, isProdi, router]);

  const handleCancel = useCallback(() => router.back(), [router]);

  return (
    <MainContent
      title={isProdi ? "Tambah Pengajuan Cuti Akademik (Prodi)" : "Tambah Pengajuan Cuti Akademik"}
      layout="Admin"
      breadcrumb={[
        { label: "Sistem Informasi Akademik" },
        { label: "Administrasi Akademik" },
        { label: "Cuti Akademik" },
        { label: isProdi ? "Tambah Pengajuan (Prodi)" : "Tambah Pengajuan" },
      ]}
    >
      {isProdi && formData.mhsId && bebasTanggunganStatus === "NOK" && (
        <div className="mb-3">
          <div className="alert alert-warning mb-2" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Mahasiswa belum menyelesaikan administrasi bebas tanggungan</strong>
          </div>
          <button
            type="button"
            className="btn btn-link p-0 text-primary text-decoration-underline"
            onClick={() => router.push('/pages/administrasi-akademik/bebas-tanggungan')}
          >
            <i className="fas fa-eye me-1"></i>{" "}Lihat Administrasi Bebas Tanggungan
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {isProdi && (
          <div className="row mt-3">
            <div className="col-lg-4">
              <DropDown
                ref={prodiRef}
                forInput="konId"
                label="Program Studi"
                type="pilih"
                arrData={prodiList}
                value={formData.konId}
                onChange={handleProdiChange}
                isRequired={true}
                isDisabled={loadingProdi}
                errorMessage={errors.konId}
                searchable={true}
              />
            </div>
            <div className="col-lg-4">
              <Label required={true} text="Mahasiswa" htmlFor="mhsId" />
              <div style={{ position: 'relative' }} ref={mahasiswaRef}>
                <button
                  type="button"
                  className="form-select rounded-4 text-start"
                  onClick={() => {
                    if (formData.konId && !loadingStudents) setShowDropdown(!showDropdown);
                  }}
                  disabled={!formData.konId || loadingStudents}
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
            <div className="col-lg-4">
              <Label text="Angkatan" htmlFor="angkatan" required={false} />
              <input type="text" className="form-control rounded-4 blue-element" value={formData.angkatan} disabled />
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
            />
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

        <div className="row mt-3">
          <div className="col-lg-6">
            <Label text={isProdi ? "Berkas Surat Pernyataan" : "Surat Pernyataan"} htmlFor="suratPernyataan" required={true} />
            <input type="file" name="suratPernyataan" className="form-control rounded-4 blue-element" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
            {errors.suratPernyataan && <span className="fw-normal text-danger">{errors.suratPernyataan}</span>}
            <small className="text-muted">Format yang didukung: PDF, JPG, JPEG, PNG (Maksimal 10MB)</small>
          </div>
          <div className="col-lg-6">
            <Label text={isProdi ? "Berkas Lampiran" : "Lampiran"} htmlFor="lampiran" required={false} />
            <input type="file" name="lampiran" className="form-control rounded-4 blue-element" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
            <small className="text-muted">Format yang didukung: PDF, JPG, JPEG, PNG (Maksimal 10MB)</small>
          </div>
        </div>

        {isProdi && (
          <div className="row mt-4">
            <div className="col-lg-12">
              <Editor label="Menimbang" name="menimbang" value={formData.menimbang} onChange={handleEditorChange} error={errors.menimbang} />
              <small className="text-muted">Masukkan pertimbangan/alasan untuk pengajuan cuti akademik mahasiswa.</small>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end mt-4 gap-2">
          <Button classType="secondary" label="Batal" type="button" onClick={handleCancel} isDisabled={saving} />
          {!(isProdi && formData.mhsId && bebasTanggunganStatus === "NOK") && (
            <Button classType="primary" iconName="save" label={saving ? "Menyimpan..." : "Simpan"} type="submit" isDisabled={saving} />
          )}
        </div>
      </form>
    </MainContent>
  );
}

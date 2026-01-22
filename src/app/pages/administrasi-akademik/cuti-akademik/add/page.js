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
import { getUserData } from "@/context/user";

const Editor = dynamic(() => import("@/components/common/Editor"), {
  ssr: false,
  loading: () => (
    <div className="p-3 border rounded text-muted">Loading Editor...</div>
  ),
});

const validateFileSize = (file, maxSize = 10 * 1024 * 1024) => {
  if (file.size > maxSize) {
    Toast.error(`File ${file.name} terlalu besar. Maksimal 10MB.`);
    return false;
  }
  return true;
};

const validateFileType = (file) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    Toast.error(`Format file ${file.name} tidak didukung. Gunakan PDF, JPG, atau PNG.`);
    return false;
  }
  return true;
};

const mapProdiData = (data) => {
  const mappedProdi = data.map((item, index) => ({
    Value: item.id || item.konId || `prodi-${index}`,
    Text: item.nama || `Program Studi ${index + 1}`
  }));
  
  return mappedProdi.filter((prodi, index, self) => 
    index === self.findIndex(p => p.Value === prodi.Value)
  );
};

const mapStudentData = (data) => {
  const mappedStudents = data.map((item, index) => ({
    Value: item.mhsId || `student-${index}`,
    Text: item.mhsNama || `Mahasiswa ${index + 1}`
  }));
  
  return mappedStudents.filter((student, index, self) => 
    index === self.findIndex(s => s.Value === student.Value)
  );
};

const generateTahunAkademikOptions = (angkatan) => {
  if (!angkatan) {
    const currentYear = new Date().getFullYear();
    return [
      { Value: `${currentYear-1}/${currentYear}`, Text: `${currentYear-1}/${currentYear}` },
      { Value: `${currentYear}/${currentYear+1}`, Text: `${currentYear}/${currentYear+1}` },
      { Value: `${currentYear+1}/${currentYear+2}`, Text: `${currentYear+1}/${currentYear+2}` },
    ];
  }

  const tahunSekarang = new Date().getFullYear() - 1;
  const angkatanInt = Number.parseInt(angkatan, 10);
  const tahunAkademikList = [];

  for (let i = tahunSekarang; i <= angkatanInt + 3; i++) {
    const tahunAkademik = `${i}/${i + 1}`;
    tahunAkademikList.push({
      Value: tahunAkademik,
      Text: tahunAkademik
    });
  }

  return tahunAkademikList.filter((item, index, self) => 
    index === self.findIndex(t => t.Value === item.Value)
  );
};

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

  const prodiRef = useRef();
  const mahasiswaRef = useRef();
  const tahunAjaranRef = useRef();
  const semesterRef = useRef();

  const [formData, setFormData] = useState({
    tahunAjaran: "",
    semester: "",
    suratPernyataan: null,
    lampiran: null,
    konId: "",
    mhsId: "",
    angkatan: "",
    menimbang: "",
  });

  const [errors, setErrors] = useState({});
  const [bebasTanggunganStatus, setBebasTanggunganStatus] = useState(null);
  const [existingCutiData, setExistingCutiData] = useState([]);

  const extractArrayFromResponse = useCallback((data) => {
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data && typeof data === 'object') {
      const arrayProperties = ['data', 'items', 'result'];
      for (const prop of arrayProperties) {
        if (data[prop] && Array.isArray(data[prop])) {
          return data[prop];
        }
      }
      
      const firstArrayProp = Object.keys(data).find(key => Array.isArray(data[key]));
      return firstArrayProp ? data[firstArrayProp] : [];
    }
    
    return [];
  }, []);

  const filterValidCutiData = useCallback((data) => {
    return data.filter(item => {
      const status = item.status || item.cak_status || "";
      return status !== "Ditolak";
    });
  }, []);

  const fetchCutiData = useCallback(async (mhsId) => {
    const params = new URLSearchParams({
      mhsId: mhsId,
      pageNumber: '1',
      pageSize: '100'
    });

    const response = await fetch(`${API_LINK}CutiAkademik?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch existing cuti data");
    }

    return response.json();
  }, []);

  const checkExistingCutiData = useCallback(async (mhsId) => {
    if (!mhsId) {
      setExistingCutiData([]);
      return;
    }

    try {
      const data = await fetchCutiData(mhsId);
      const actualData = extractArrayFromResponse(data);
      const validCutiData = filterValidCutiData(actualData);
      setExistingCutiData(validCutiData);
    } catch (error) {
      console.error("Error checking existing cuti data:", error);
      setExistingCutiData([]);
    }
  }, [fetchCutiData, extractArrayFromResponse, filterValidCutiData]);

  const isTahunAkademikUsed = useCallback((tahunAkademik) => {
    return existingCutiData.some(item => {
      const existingTahun = item.tahunAjaran || item.cak_tahun_ajaran || "";
      return existingTahun === tahunAkademik;
    });
  }, [existingCutiData]);

  const getAvailableTahunAkademik = useCallback((allOptions) => {
    return allOptions.filter(option => !isTahunAkademikUsed(option.Value));
  }, [isTahunAkademikUsed]);           

  const loadStudentsForKonId = useCallback(async (konId) => {
    if (!konId) {
      setStudentList([]);
      return;
    }

    setLoadingStudents(true);
    try {
      const response = await fetch(`${API_LINK}Mahasiswa/GetByKonsentrasi?konId=${konId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const uniqueStudents = mapStudentData(data);
        setStudentList(uniqueStudents);
      } else {
        Toast.error("Gagal memuat daftar mahasiswa.");
        setStudentList([]);
      }
    } catch {
      Toast.error("Terjadi kesalahan saat memuat daftar mahasiswa.");
      setStudentList([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    const username = userData?.username || userData?.nama;
    
    if (!isProdi || !username) {
      return;
    }
    
    const loadProdi = async () => {
      setLoadingProdi(true);
      try {
        const response = await fetch(`${API_LINK}Mahasiswa/GetKonsentrasiList?username=${username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const uniqueProdi = mapProdiData(data);
          
          setProdiList(uniqueProdi);
          
          if (uniqueProdi.length === 1) {
            setFormData(prev => ({
              ...prev,
              konId: uniqueProdi[0].Value
            }));
            
            loadStudentsForKonId(uniqueProdi[0].Value);
          }
        } else {
          Toast.error("Gagal memuat daftar program studi.");
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
      try {
        const mhsId = userData?.nama || userData?.mhsId || userData?.userid || userData?.username || "";
        
        if (!mhsId) {
          return;
        }

        const response = await fetch(`${API_LINK}Mahasiswa/GetDetail?mhsId=${mhsId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          setFormData(prev => ({
            ...prev,
            mhsId: mhsId,
            angkatan: data.mhsAngkatan?.toString() || ""
          }));
          
        } else {
          Toast.error("Gagal memuat data mahasiswa. Pastikan Anda login dengan akun yang benar.");
        }
      } catch {
        Toast.error("Terjadi kesalahan saat memuat data mahasiswa.");
      }
    };

    loadMahasiswaData();
  }, [isMahasiswa, userData]);

  useEffect(() => {
    let targetMhsId = "";
    
    if (isMahasiswa) {
      targetMhsId = userData?.mhsId || userData?.nama || userData?.userid || userData?.username || "";
    } else if (isProdi && formData.mhsId) {
      targetMhsId = formData.mhsId;
    }
    
    if (targetMhsId) {
      checkExistingCutiData(targetMhsId);
    }
  }, [isMahasiswa, isProdi, formData.mhsId, userData, checkExistingCutiData]);

  const handleProdiChange = async (e) => {
    const konId = e.target.value;
    setFormData(prev => ({
      ...prev,
      konId: konId,
      mhsId: "",
      angkatan: ""
    }));

    await loadStudentsForKonId(konId);
  };

  const handleStudentChange = async (e) => {
    const mhsId = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      mhsId: mhsId,
      angkatan: ""
    }));

    setBebasTanggunganStatus(null);

    if (!mhsId) {
      return;
    }

    try {
      if (isProdi) {
        const btResponse = await fetch(`${API_LINK}Mahasiswa/CheckBebasTanggungan?userId=${mhsId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (btResponse.ok) {
          const btData = await btResponse.json();
          setBebasTanggunganStatus(btData.status);
        }
      }

      const response = await fetch(`${API_LINK}Mahasiswa/GetDetail?mhsId=${mhsId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const detailData = await response.json();
        
        const angkatan = detailData.mhsAngkatan || "";
        
        setFormData(prev => ({
          ...prev,
          angkatan: angkatan.toString()
        }));
      } else {
        Toast.error("Gagal memuat detail mahasiswa.");
      }
    } catch {
      Toast.error("Terjadi kesalahan saat memuat detail mahasiswa.");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files?.[0]) {
      const file = files[0];
      
      if (!validateFileSize(file) || !validateFileType(file)) {
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

  const handleEditorChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const validate = () => {
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
      newErrors.tahunAjaran = `Mahasiswa sudah pernah mengajukan cuti akademik di tahun akademik ${formData.tahunAjaran}. Silakan pilih tahun akademik yang lain.`;
    }
    
    if (!formData.semester) newErrors.semester = "Semester wajib diisi.";
    if (!formData.suratPernyataan) newErrors.suratPernyataan = "Surat pernyataan wajib di-upload.";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      Toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return false;
    }
    
    return true;
  };

  const buildProdiFormData = useCallback((fd) => {
    const approvalProdi = userData?.nama || userData?.username || userData?.userid || "";
    
    fd.append("MhsId", formData.mhsId);
    fd.append("TahunAjaran", formData.tahunAjaran);
    fd.append("Semester", formData.semester);
    fd.append("Menimbang", formData.menimbang);
    fd.append("ApprovalProdi", approvalProdi);
  }, [formData, userData]);

  const buildMahasiswaFormData = useCallback((fd) => {
    const mhsId = userData?.mhsId || userData?.nama || userData?.userid || userData?.username || "";
    
    if (!mhsId) {
      Toast.error("User tidak valid.");
      return false;
    }
    
    fd.append("Step", "STEP1");
    fd.append("MhsId", mhsId);
    fd.append("TahunAjaran", formData.tahunAjaran);
    fd.append("Semester", formData.semester);
    
    return true;
  }, [formData, userData]);

  const appendFilesToFormData = useCallback((fd) => {
    if (formData.suratPernyataan && formData.suratPernyataan instanceof File) {
      fd.append("LampiranSuratPengajuan", formData.suratPernyataan, formData.suratPernyataan.name);
    }
    
    if (formData.lampiran && formData.lampiran instanceof File) {
      fd.append("Lampiran", formData.lampiran, formData.lampiran.name);
    }
  }, [formData]);

  const handleSubmissionSuccess = useCallback((result) => {
    if (isProdi) {
      const prodiCreatedApps = JSON.parse(sessionStorage.getItem('prodiCreatedApps') || '[]');
      if (!prodiCreatedApps.includes(result.draftId)) {
        prodiCreatedApps.push(result.draftId);
        sessionStorage.setItem('prodiCreatedApps', JSON.stringify(prodiCreatedApps));
      }
      Toast.success("Pengajuan Cuti berhasil dibuat untuk mahasiswa.");
    } else {
      Toast.success("Pengajuan Cuti berhasil dibuat.");
    }
    router.push("/pages/administrasi-akademik/cuti-akademik");
  }, [isProdi, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    try {
      const fd = new FormData();
      
      if (isProdi) {
        buildProdiFormData(fd);
      } else {
        const success = buildMahasiswaFormData(fd);
        if (!success) return;
      }

      appendFilesToFormData(fd);

      const endpoint = isProdi 
        ? `${API_LINK}CutiAkademik/prodi/draft`
        : `${API_LINK}CutiAkademik/draft`;

      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
      });

      const raw = await res.text();

      let result;
      try {
        result = JSON.parse(raw);
      } catch {
        Toast.error("Server mengirim response tidak valid:\n\n" + raw);
        return;
      }

      if (result?.draftId) {
        handleSubmissionSuccess(result);
      } else {
        Toast.error(result?.message || "Gagal membuat pengajuan.");
      }
    } catch {
      Toast.error("Gagal mengambil data Cuti Akademik");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.back();

  const [tahunAjaranData, setTahunAjaranData] = useState([]);

  useEffect(() => {
    if ((isProdi || isMahasiswa) && formData.angkatan) {
      const allTahunAkademikData = generateTahunAkademikOptions(formData.angkatan);
      const availableTahunAkademikData = getAvailableTahunAkademik(allTahunAkademikData);
      setTahunAjaranData(availableTahunAkademikData);
      
      if (formData.tahunAjaran && !availableTahunAkademikData.some(item => item.Value === formData.tahunAjaran)) {
        setFormData(prev => ({
          ...prev,
          tahunAjaran: ""
        }));
      }
    } else if (!isProdi && !isMahasiswa) {
      const defaultTahunAkademik = generateTahunAkademikOptions(null);
      setTahunAjaranData(defaultTahunAkademik);
    }
  }, [formData.angkatan, isProdi, isMahasiswa, getAvailableTahunAkademik, formData.tahunAjaran]);

  useEffect(() => {
    if (!isProdi && !isMahasiswa) {
      const defaultTahunAkademik = generateTahunAkademikOptions(null);
      setTahunAjaranData(defaultTahunAkademik);
    }
  }, [isProdi, isMahasiswa]);

  const semesterData = [
    { Value: "Ganjil", Text: "Ganjil" },
    { Value: "Genap", Text: "Genap" },
  ];

  const getPageTitle = () => {
    if (isProdi) return "Tambah Pengajuan Cuti Akademik (Prodi)";
    if (isMahasiswa) return "Tambah Pengajuan Cuti Akademik (Mahasiswa)";
    return "Tambah Pengajuan Cuti Akademik";
  };

  return (
    <MainContent
      title={getPageTitle()}
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
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/pages/administrasi-akademik/bebas-tanggungan')}
          >
            <i className="fas fa-eye me-1"></i>
            {" "}Lihat Administrasi Bebas Tanggungan
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
              <DropDown
                ref={mahasiswaRef}
                forInput="mhsId"
                label="Mahasiswa"
                type="pilih"
                arrData={studentList}
                value={formData.mhsId}
                onChange={handleStudentChange}
                isRequired={true}
                isDisabled={!formData.konId || loadingStudents}
                errorMessage={errors.mhsId}
                searchable={true}
              />
            </div>
            <div className="col-lg-4">
              <Label
                text="Angkatan"
                htmlFor="angkatan"
                required={false}
              />
              <input
                type="text"
                className="form-control rounded-4 blue-element"
                value={formData.angkatan}
                disabled
                placeholder=""
              />
            </div>
          </div>
        )}

        <div className="row mt-3">
          <div className="col-lg-6">
            {(isProdi || isMahasiswa) ? (
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
                isDisabled={isMahasiswa && !formData.angkatan}
              />
            ) : (
              <>
                <Label
                  text="Tahun Akademik"
                  htmlFor="tahunAjaran"
                  required={true}
                />
                <select
                  name="tahunAjaran"
                  className="form-control rounded-4 blue-element"
                  onChange={handleChange}
                  value={formData.tahunAjaran}
                >
                  <option value="">— Pilih Tahun Akademik —</option>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
                {errors.tahunAjaran && (
                  <span className="fw-normal text-danger">{errors.tahunAjaran}</span>
                )}
              </>
            )}
          </div>

          <div className="col-lg-6">
            {(isProdi || isMahasiswa) ? (
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
            ) : (
              <>
                <Label
                  text="Semester"
                  htmlFor="semester"
                  required={true}
                />
                <select
                  name="semester"
                  className="form-control rounded-4 blue-element"
                  onChange={handleChange}
                  value={formData.semester}
                >
                  <option value="">— Pilih Semester —</option>
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
                {errors.semester && (
                  <span className="fw-normal text-danger">{errors.semester}</span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-lg-6">
            <Label
              text={isProdi ? "Berkas Surat Pernyataan" : "Surat Pernyataan"}
              htmlFor="suratPernyataan"
              required={true}
            />
            <input
              type="file"
              name="suratPernyataan"
              className="form-control rounded-4 blue-element"
              onChange={handleChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            {errors.suratPernyataan && (
              <span className="fw-normal text-danger">{errors.suratPernyataan}</span>
            )}
            <small className="text-muted">Format: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
          </div>

          <div className="col-lg-6">
            <Label
              text={isProdi ? "Berkas Lampiran" : "Lampiran"}
              htmlFor="lampiran"
              required={false}
            />
            <input
              type="file"
              name="lampiran"
              className="form-control rounded-4 blue-element"
              onChange={handleChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <small className="text-muted">Format: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
          </div>
        </div>

        {isProdi && (
          <div className="row mt-4">
            <div className="col-lg-12">
              <Editor
                label="Menimbang"
                name="menimbang"
                value={formData.menimbang}
                onChange={handleEditorChange}
                error={errors.menimbang}
              />
              <small className="text-muted">
                Masukkan pertimbangan/alasan untuk pengajuan cuti akademik mahasiswa.
              </small>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end mt-4 gap-2">
          <Button
            classType="secondary"
            label="Batal"
            type="button"
            onClick={handleCancel}
            isDisabled={saving}
          />
          {!(isProdi && formData.mhsId && bebasTanggunganStatus === "NOK") && (
            <Button
              classType="primary"
              iconName="save"
              label={saving ? "Menyimpan..." : "Simpan Editor"}
              type="submit"
              isDisabled={saving}
            />
          )}
        </div>
      </form>
    </MainContent>
  );
}
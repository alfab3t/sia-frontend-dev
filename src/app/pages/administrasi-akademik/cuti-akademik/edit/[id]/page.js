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
import { decryptIdUrl } from "@/lib/encryptor";
import { getUserData } from "@/context/user";

const Editor = dynamic(() => import("@/components/common/Editor"), {
  ssr: false,
  loading: () => (
    <div className="p-3 border rounded text-muted">Loading Editor...</div>
  ),
});

export default function EditCutiAkademikPage() {
  const router = useRouter();
  const params = useParams();
  const userData = useMemo(() => getUserData(), []);

  const roleId = userData?.roleId || "";
  
  const isProdi = roleId === "ROL71";
  const isMahasiswa = roleId === "ROL23";

  
  const realId = useMemo(() => {
    try {
      return decryptIdUrl(params?.id || "");
    } catch {
      return "";
    }
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prodiList, setProdiList] = useState([]);
  const [studentList, setStudentList] = useState([]);

  const tahunAjaranRef = useRef();
  const semesterRef = useRef();

  const [formData, setFormData] = useState({
    tahunAjaran: "",
    semester: "",
    suratPernyataan: null,
    lampiran: null,
    oldSurat: "",
    oldLampiran: "",
    konId: "",
    mhsId: "",
    angkatan: "",
    menimbang: "",
    tahunAjaranOptions: [], 
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const username = userData?.username || userData?.nama;
    
    if (!isProdi || !username) {
      return;
    }
    
    const loadProdi = async () => {
      try {
        const response = await fetch(`${API_LINK}Mahasiswa/GetKonsentrasiList?username=${username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          const mappedProdi = data.map(item => ({
            Value: item.id,
            Text: item.nama
          }));
          
          setProdiList(mappedProdi);
        } else {
          Toast.error("Gagal memuat daftar program studi.");
        }
      } catch {
        Toast.error("Terjadi kesalahan saat memuat daftar program studi.");
      }
    };

    loadProdi();
  }, [isProdi, userData?.username, userData?.nama]);

  
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
        Toast.error(`Format file ${file.name} tidak didukung. Gunakan PDF, JPG, atau PNG.`);
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

  
  const fetchDetailData = async (realId) => {
    const url = `${API_LINK}CutiAkademik/detail?id=${encodeURIComponent(realId)}`;
    const res = await fetch(url);
    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }

    return data?.id ? data : null;
  };

  
  const updateFormDataFromApi = (data) => {
    setFormData(prev => ({
      ...prev,
      tahunAjaran: data.tahunAjaran || "",
      semester: data.semester || "",
      oldSurat: data.lampiranSP || "",
      oldLampiran: data.lampiran || "",
      suratPernyataan: null,
      lampiran: null,
      mhsId: data.mhsId || "",
      menimbang: data.menimbang || "",
    }));
  };

  const fetchUserKonsentrasiList = async (username) => {
    const konsentrasiResponse = await fetch(`${API_LINK}Mahasiswa/GetKonsentrasiList?username=${username}`);
    if (!konsentrasiResponse.ok) {
      return [];
    }
    return await konsentrasiResponse.json();
  };

  const fetchStudentsForKonsentrasi = async (konsentrasiId) => {
    const studentsResponse = await fetch(`${API_LINK}Mahasiswa/GetByKonsentrasi?konId=${konsentrasiId}`);
    if (!studentsResponse.ok) {
      return [];
    }
    return await studentsResponse.json();
  };

  const filterActiveStudents = (students) => {
    return students.filter(item => {
      const status = (item.mhsStatusKuliah || 
                     item.statusKuliah || 
                     item.status || 
                     item.mhsStatus || 
                     "").toLowerCase().trim();
      
      const inactiveKeywords = [
        'lulus', 'graduated', 'drop', 'keluar', 'meninggal', 'died',
        'tidak aktif', 'nonaktif', 'inactive', 'cuti', 'leave',
        'putus studi', 'mengundurkan diri', 'resign'
      ];
      
      const isInactive = inactiveKeywords.some(keyword => 
        status.includes(keyword)
      );
      
      return !isInactive;
    });
  };

  const fetchStudentDetailAndGenerateOptions = async (mhsId) => {
    try {
      const detailResponse = await fetch(`${API_LINK}Mahasiswa/GetDetail?mhsId=${mhsId}`);
      if (!detailResponse.ok) {
        return null;
      }
      
      const detailData = await detailResponse.json();
      const angkatan = detailData.mhsAngkatan;
      
      if (!angkatan) {
        return null;
      }
      
      const tahunSekarang = new Date().getFullYear() - 1;
      const tahunAjaranOptions = [];
      
      for (let i = tahunSekarang; i <= angkatan + 3; i++) {
        tahunAjaranOptions.push({
          Value: `${i}/${i + 1}`,
          Text: `${i}/${i + 1}`
        });
      }
      
      return {
        angkatan: angkatan.toString(),
        tahunAjaranOptions
      };
    } catch {
      return null;
    }
  };

  const findStudentKonsentrasi = async (mhsId, konsentrasiList, username) => {
    for (const konsentrasi of konsentrasiList) {
      const students = await fetchStudentsForKonsentrasi(konsentrasi.id);
      const activeStudents = filterActiveStudents(students);
      
      const studentFound = activeStudents.find(s => s.mhsId === mhsId);
      if (studentFound) {
        const studentDetail = await fetchStudentDetailAndGenerateOptions(mhsId);
        
        if (studentDetail) {
          setFormData(prev => ({
            ...prev,
            konId: konsentrasi.id,
            angkatan: studentDetail.angkatan,
            tahunAjaranOptions: studentDetail.tahunAjaranOptions
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            konId: konsentrasi.id,
            angkatan: studentFound.angkatan || ""
          }));
        }
        
        setStudentList(activeStudents.map(item => ({
          Value: item.mhsId,
          Text: item.mhsNama
        })));
        
        return true;
      }
    }
    return false;
  };

  const handleProdiDataLoading = async (data) => {
    if (!data.mhsId || !isProdi) {
      return;
    }

    const username = userData?.username || userData?.nama;
    
    if (!username) {
      return;
    }

    try {
      const konsentrasiData = await fetchUserKonsentrasiList(username);
      
      await findStudentKonsentrasi(data.mhsId, konsentrasiData, username);
    } catch {
      
    }
  };

  const loadDetailFromApi = useCallback(async () => {
    try {
      if (!realId) return;

      const data = await fetchDetailData(realId);
      if (!data) return;

      updateFormDataFromApi(data);
      await handleProdiDataLoading(data);

    } finally {
      setLoading(false);
    }
  }, [realId, isProdi, userData]);

  useEffect(() => {
    if (!isMahasiswa || !userData || !realId) return;
    
    const loadMahasiswaDataForEdit = async () => {
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

          setFormData(prev => {
            const newFormData = {
              ...prev,
              angkatan: data.mhsAngkatan?.toString() || ""
            };
            return newFormData;
          });
          
        } else {
          // Error response from API
        }
      } catch {
        
      }
    };

    loadMahasiswaDataForEdit();
  }, [isMahasiswa, userData, realId]);

  
  const generateTahunAkademik = (angkatan) => {
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

    return tahunAkademikList;
  };

  const [tahunAjaranData, setTahunAjaranData] = useState([]);

  useEffect(() => {
    if ((isProdi || isMahasiswa) && formData.angkatan) {
      const newTahunAkademikData = generateTahunAkademik(formData.angkatan);
      setTahunAjaranData(newTahunAkademikData);
    } else if (!isProdi && !isMahasiswa) {
      const defaultTahunAkademik = generateTahunAkademik(null);
      setTahunAjaranData(defaultTahunAkademik);
    }
  }, [formData.angkatan, isProdi, isMahasiswa]);

  useEffect(() => {
    if (!isProdi && !isMahasiswa) {
      const defaultTahunAkademik = generateTahunAkademik(null);
      setTahunAjaranData(defaultTahunAkademik);
    }
  }, [isProdi, isMahasiswa]);

  useEffect(() => {
    if (!realId) {
      Toast.error("ID tidak valid.");
      router.push("/pages/administrasi-akademik/cuti-akademik");
      return;
    }

    const cached = sessionStorage.getItem("editCutiDraft");

    if (cached) {
      const data = JSON.parse(cached);

      setFormData(prev => ({
        ...prev,
        tahunAjaran: data.tahunAjaran || "",
        semester: data.semester || "",
        oldSurat: data.lampiranSP || "",
        oldLampiran: data.lampiran || "",
        suratPernyataan: null,
        lampiran: null,
        mhsId: data.mhsId || "",
        menimbang: data.menimbang || "",
      }));

      setLoading(false);
    } else {
      loadDetailFromApi();
    }
  }, [realId, loadDetailFromApi, router]);

  const validate = () => {
    const newErrors = {};
    
    if (isProdi) {
      if (!formData.konId) newErrors.konId = "Program studi harus dipilih.";
      if (!formData.mhsId) newErrors.mhsId = "Mahasiswa harus dipilih.";
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append("TahunAjaran", formData.tahunAjaran);
      fd.append("Semester", formData.semester);

      if (formData.suratPernyataan && formData.suratPernyataan instanceof File) {
        fd.append("LampiranSuratPengajuan", formData.suratPernyataan, formData.suratPernyataan.name);
      }

      if (formData.lampiran && formData.lampiran instanceof File) {
        fd.append("Lampiran", formData.lampiran, formData.lampiran.name);
      }

      if (isProdi) {
        fd.append("MhsId", formData.mhsId);
        fd.append("Menimbang", formData.menimbang);
      }

      fd.append(
        "ModifiedBy",
        userData?.mhsId || userData?.nama || userData?.userid || userData?.username || "SYSTEM"
      );

      const url = `${API_LINK}CutiAkademik/${realId}`;
      
      const res = await fetch(url, {
        method: "PUT",
        body: fd,
      });

      const raw = await res.text();
      
      let result;

      try {
        result = JSON.parse(raw);
      } catch {
        Toast.error("Response server tidak valid.");
        return;
      }

      if (result?.message?.toLowerCase().includes("berhasil")) {
        Toast.success("Perubahan berhasil disimpan.");
        sessionStorage.removeItem("editCutiDraft");
        router.push("/pages/administrasi-akademik/cuti-akademik");
      } else {
        Toast.error(result?.message || "Gagal menyimpan perubahan.");
      }
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.back();

  const getPageTitle = () => {
    if (isProdi) return "Edit Pengajuan Cuti Akademik (Prodi)";
    if (isMahasiswa) return "Edit Pengajuan Cuti Akademik (Mahasiswa)";
    return "Edit Pengajuan Cuti Akademik";
  };

  const getBreadcrumbLabel = () => {
    if (isProdi) return "Edit Pengajuan (Prodi)";
    if (isMahasiswa) return "Edit Pengajuan (Mahasiswa)";
    return "Edit Pengajuan";
  };

  const semesterData = [
    { Value: "Ganjil", Text: "Ganjil" },
    { Value: "Genap", Text: "Genap" },
  ];


  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title={getPageTitle()}
      breadcrumb={[
        { label: "Sistem Informasi Akademik" },
        { label: "Administrasi Akademik" },
        { label: "Cuti Akademik" },
        { label: getBreadcrumbLabel() },
      ]}
    >
      <form onSubmit={handleSubmit}>
        {isProdi && (
          <div className="row mt-3">
            <div className="col-lg-4">
              <Input
                label="Program Studi"
                name="konId"
                id="konId"
                value={prodiList.find(p => p.Value === formData.konId)?.Text || ""}
                onChange={() => {}}
                disabled={true}
                required={true}
              />
            </div>

            <div className="col-lg-4">
              <Input
                label="Mahasiswa"
                name="mhsId"
                id="mhsId"
                value={studentList.find(s => s.Value === formData.mhsId)?.Text || ""}
                onChange={() => {}}
                disabled={true}
                required={true}
              />
            </div>

            <div className="col-lg-4">
              <Input
                label="Angkatan"
                name="angkatan"
                id="angkatan"
                value={formData.angkatan}
                onChange={() => {}}
                disabled={true}
                required={false}
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
                isDisabled={(isProdi && !formData.mhsId) || (isMahasiswa && !formData.angkatan)}
              />
            ) : (
              <>
                <Label
                  text="Tahun Akademik"
                  htmlFor="tahunAjaran"
                  required={true}
                />
                <select
                  className="form-control rounded-4 blue-element"
                  name="tahunAjaran"
                  value={formData.tahunAjaran}
                  onChange={handleChange}
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
            {isMahasiswa && !formData.angkatan && (
              <small className="text-muted">Memuat opsi tahun akademik...</small>
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
                  className="form-control rounded-4 blue-element"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
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

        <div className="row mt-4">
          <div className="col-lg-6">
            <Label
              text={isProdi ? "Berkas Surat Pernyataan" : "Surat Pernyataan"}
              htmlFor="suratPernyataan"
              required={true}
            />
            <input
              type="file"
              className="form-control rounded-4 blue-element"
              name="suratPernyataan"
              onChange={handleChange}
            />
            <small className="text-muted">File sebelumnya: {formData.oldSurat || "-"}</small>
            <br />
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
              className="form-control rounded-4 blue-element"
              name="lampiran"
              onChange={handleChange}
            />
            <small className="text-muted">File sebelumnya: {formData.oldLampiran || "-"}</small>
            <br />
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
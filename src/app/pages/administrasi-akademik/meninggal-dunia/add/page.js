"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import DropDown from "@/components/common/Dropdown";
import Label from "@/components/common/Label";
import Input from "@/components/common/Input";
import { useRouter } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import { getUserData } from "@/context/user";

export default function AddMeninggalDunia() {
  const router = useRouter();
  const userData = useMemo(() => getUserData(), []);

  useEffect(() => {
    const loadPermission = async () => {
      try {
        const payload = {
          username: userData?.username || "",
          appId: "APP08",
          roleId: userData?.roleId || ""
        };

        await fetch(`${API_LINK}Auth/getpermission`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

      } catch (err) {
        console.error("Error loading permission:", err);
      }
    };

    if (userData?.username) loadPermission();
  }, [userData]);

  const roleId = userData?.roleId || "";
  const isProdi = roleId === "ROL71";

  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [konId, setKonId] = useState("");

  const mahasiswaRef = useRef();

  const [formData, setFormData] = useState({
    mhsId: "",
    prodi: "",
    tahunAngkatan: "",
    lampiranMeninggal: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isProdi || !userData) return;
    
    const loadKonsentrasi = async () => {
      try {
        const username = userData?.username || userData?.nama;
        
        if (!username) {
          return;
        }

        const response = await fetch(`${API_LINK}Mahasiswa/GetKonsentrasiList?username=${username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const userKonId = data[0].id;
            setKonId(userKonId);
          }
        }
      } catch (error) {
        console.error("Error loading konsentrasi:", error);
      }
    };

    loadKonsentrasi();
  }, [isProdi, userData]);

  useEffect(() => {
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        let response;
        
        if (isProdi && konId) {
          response = await fetch(`${API_LINK}Mahasiswa/GetByKonsentrasi?konId=${konId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        } else if (isProdi) {
          setLoadingStudents(false);
          return;
        } else {
          response = await fetch(`${API_LINK}MeninggalDunia/mahasiswa`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        }
        
        if (response.ok) {
          const data = await response.json();
          
          const formattedStudents = data.map(item => {
            const studentData = {
              Value: item.mhsId || item.id || item.nim,
              Text: item.mhsNama || item.nama || item.name || "",
              Prodi: item.programStudi || item.prodi || item.konNama || item.konsentrasi || "",
              Angkatan: item.mhsAngkatan || item.angkatan || item.tahunAngkatan || item.year || ""
            };
            return studentData;
          });
          
          setStudentList(formattedStudents);
        } else {
          Toast.error("Gagal memuat daftar mahasiswa.");
        }
      } catch (error) {
        console.error("Error loading students:", error);
        Toast.error("Terjadi kesalahan saat memuat daftar mahasiswa.");
      } finally {
        setLoadingStudents(false);
      }
    };

    const shouldLoadStudents = (isProdi && konId) || !isProdi;
    
    if (shouldLoadStudents) {
      loadStudents();
    }
  }, [isProdi, konId]);

  const handleStudentChange = async (e) => {
    const mhsId = e.target.value;
    
    if (!mhsId) {
      setFormData(prev => ({
        ...prev,
        mhsId: "",
        prodi: "",
        tahunAngkatan: ""
      }));
      return;
    }

    const selectedStudent = studentList.find(s => s.Value === mhsId);
    
    if (selectedStudent) {
      setFormData(prev => ({
        ...prev,
        mhsId: mhsId,
        prodi: selectedStudent.Prodi || "",
        tahunAngkatan: selectedStudent.Angkatan || ""
      }));
    }

    try {
      const detailResponse = await fetch(`${API_LINK}MeninggalDunia/mahasiswa/${mhsId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        
        try {
          const prodiResponse = await fetch(`${API_LINK}MeninggalDunia/mahasiswa/${mhsId}/prodi`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          let prodiData = null;
          if (prodiResponse.ok) {
            prodiData = await prodiResponse.json();
          }
          
          const finalProdi = prodiData?.nama || prodiData?.prodi || prodiData?.proNama || detailData?.prodi || detailData?.programStudi || detailData?.konNama || selectedStudent?.Prodi || "";
          const finalAngkatan = detailData?.mhsAngkatan || detailData?.angkatan || detailData?.tahunAngkatan || selectedStudent?.Angkatan || "";
          
          setFormData(prev => ({
            ...prev,
            mhsId: mhsId,
            prodi: finalProdi,
            tahunAngkatan: finalAngkatan
          }));
          
        } catch (prodiError) {
          console.error("Error fetching prodi details:", prodiError);
          setFormData(prev => ({
            ...prev,
            mhsId: mhsId,
            prodi: detailData?.prodi || detailData?.programStudi || detailData?.konNama || selectedStudent?.Prodi || prev.prodi,
            tahunAngkatan: detailData?.mhsAngkatan || detailData?.angkatan || detailData?.tahunAngkatan || selectedStudent?.Angkatan || prev.tahunAngkatan
          }));
        }
        
      } else {
        // Keep the data from dropdown if API fails
      }
      
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files?.[0]) {
      const file = files[0];
      const maxSize = 10 * 1024 * 1024; 
      const allowedTypes = [
        'application/pdf',
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

  
  const validate = () => {
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

      const res = await fetch(`${API_LINK}MeninggalDunia`, {
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

      if (result?.id) {
        if (isProdi) {
          const prodiCreatedApps = JSON.parse(sessionStorage.getItem('prodiCreatedMeninggalApps') || '[]');
          if (!prodiCreatedApps.includes(result.id)) {
            prodiCreatedApps.push(result.id);
            sessionStorage.setItem('prodiCreatedMeninggalApps', JSON.stringify(prodiCreatedApps));
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
  };

  const handleCancel = () => router.back();

  if (!mounted) {
    return (
      <MainContent
        title="Tambah Pengajuan Meninggal Dunia"
        layout="Admin"
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Meninggal Dunia" },
          { label: "Tambah Pengajuan" },
        ]}
      >
        <div className="text-center py-4">
          <div className="spinner-border" aria-live="polite" aria-label="Loading">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Memuat halaman...</p>
        </div>
      </MainContent>
    );
  }

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
            <DropDown
              ref={mahasiswaRef}
              forInput="mhsId"
              label="Mahasiswa"
              type="pilih"
              arrData={studentList}
              value={formData.mhsId}
              onChange={handleStudentChange}
              isRequired={true}
              isDisabled={loadingStudents}
              errorMessage={errors.mhsId}
              searchable={isProdi}
            />
            {loadingStudents && (
              <small className="text-muted">Memuat daftar mahasiswa...</small>
            )}
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-lg-6">
            <Input
              label="Program Studi"
              name="prodi"
              id="prodi"
              value={formData.prodi}
              onChange={() => {}}
              disabled={true}
              required={true}
              error={errors.prodi}
            />
          </div>

          <div className="col-lg-6">
            <Input
              label="Tahun Angkatan"
              name="tahunAngkatan"
              id="tahunAngkatan"
              value={formData.tahunAngkatan}
              onChange={() => {}}
              disabled={true}
              required={true}
              error={errors.tahunAngkatan}
            />
          </div>
        </div>

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
            {errors.lampiranMeninggal && (
              <span className="fw-normal text-danger">{errors.lampiranMeninggal}</span>
            )}
            <small className="text-muted">
              Format yang didukung: PDF, DOC, DOCX, JPG, JPEG, PNG (Maksimal 10MB)
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
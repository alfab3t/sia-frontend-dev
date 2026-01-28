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
import Cookies from "js-cookie";

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = Cookies.get("jwtToken");
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function for FormData uploads (no Content-Type header)
const getAuthHeadersForFormData = () => {
  const token = Cookies.get("jwtToken");
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

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
          headers: getAuthHeaders(),
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
  const [prodiKonsentrasi, setProdiKonsentrasi] = useState("");

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

        const url = `${API_LINK}MeninggalDunia/GetKonsentrasiBySekprod?username=${username}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const konsentrasiName = data[0].nama || "";
            setProdiKonsentrasi(konsentrasiName);
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
        // Always use the main endpoint without konId parameter
        const url = `${API_LINK}MeninggalDunia/GetMahasiswaDropdownForMeninggalDunia`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          
          let filteredData = data;
          
          // Ensure each item has a unique value before any filtering
          filteredData = filteredData.map((item, index) => {
            const baseValue = item.value || item.mhsId || item.id || item.nim;
            return {
              ...item,
              value: baseValue || `dropdown_${index}_${Date.now()}`
            };
          });
          
          // If user is Prodi, we need to filter students by their program
          if (isProdi && prodiKonsentrasi) {
            // Since the dropdown API doesn't include program info, we'll need to check each student
            // For now, let's try a different approach - use a filtered endpoint or filter client-side
            
            // Try to get students filtered by konsentrasi ID if we have it
            try {
              const konsentrasiResponse = await fetch(`${API_LINK}MeninggalDunia/GetKonsentrasiBySekprod?username=${userData?.username || userData?.nama}`, {
                method: 'GET',
                headers: getAuthHeaders()
              });
              
              if (konsentrasiResponse.ok) {
                const konsentrasiData = await konsentrasiResponse.json();
                if (konsentrasiData && konsentrasiData.length > 0) {
                  // Use the new GetMahasiswaByKonsentrasi endpoint with username
                  const filteredResponse = await fetch(`${API_LINK}MeninggalDunia/GetMahasiswaByKonsentrasi?username=${userData?.username || userData?.nama}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                  });
                  
                  if (filteredResponse.ok) {
                    const filteredStudentData = await filteredResponse.json();
                    
                    // Convert the filtered data to the same format as the dropdown API
                    filteredData = filteredStudentData.map((item, index) => {
                        // Use mhsId as the primary identifier
                        const mhsId = item.mhsId || `mhs_${index}_${Date.now()}`;
                        const mhsNama = item.mhsNama || `Student ${index}`;
                        
                        // Extract angkatan from NIM (first 4 digits usually represent year)
                        let angkatan = "";
                        if (mhsId && mhsId.length >= 4) {
                          const nimYear = mhsId.substring(0, 4);
                          if (/^\d{4}$/.test(nimYear)) {
                            angkatan = nimYear;
                          }
                        }
                        
                        return {
                          value: mhsId, // Use mhsId directly as value
                          text: mhsNama, // Use mhsNama directly as text
                          nimNama: mhsNama, // mhsNama already contains "NIM - NAME" format
                          programStudi: prodiKonsentrasi || "",
                          angkatan: angkatan
                        };
                    });
                  }
                }
              }
            } catch (filterError) {
              console.error("Could not filter by konsentrasi, showing all students:", filterError);
              // Keep all data if filtering fails
            }
          }
          
          // Create a Set to track used values and ensure uniqueness
          const usedValues = new Set();
          const formattedStudents = filteredData.map((item, index) => {
            // Get base value - prioritize mhsId from filtered data
            let baseValue = item.value || item.mhsId || item.id || item.nim;
            
            // Ensure baseValue is not empty and unique
            if (!baseValue) {
              baseValue = `student_${index}_${Date.now()}`;
            }
            
            // If value is already used, make it unique
            let uniqueValue = baseValue;
            let counter = 1;
            while (usedValues.has(uniqueValue)) {
              uniqueValue = `${baseValue}_${counter}`;
              counter++;
            }
            
            // Add to used values set
            usedValues.add(uniqueValue);
            
            // Extract angkatan from Value if not available
            let angkatan = item.angkatan || "";
            if (!angkatan && uniqueValue && uniqueValue.length >= 4) {
              const nimYear = uniqueValue.substring(0, 4);
              if (/^\d{4}$/.test(nimYear)) {
                angkatan = nimYear;
              }
            }
            
            const studentData = {
              Value: uniqueValue,
              Text: item.text || item.mhsNama || item.nama || item.name || `Student ${index + 1}`,
              Prodi: item.programStudi || item.prodi || item.konNama || item.konsentrasi || item.programStudiNama || prodiKonsentrasi || "",
              Angkatan: angkatan
            };
            
            return studentData;
          });
          
          setStudentList(formattedStudents);
          
          // Final validation - ensure no empty or duplicate Values
          const finalValidation = formattedStudents.every(student => 
            student.Value && student.Value !== "" && typeof student.Value === "string"
          );
          
          if (!finalValidation) {
            console.error("Warning: Some students have invalid Values");
          }
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

    // Load students once component is mounted
    loadStudents();
  }, [isProdi, prodiKonsentrasi]);

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

    // Find the selected student from the dropdown list
    const selectedStudent = studentList.find(s => s.Value === mhsId);
    
    if (selectedStudent) {
      // First, set data from dropdown if available
      setFormData(prev => ({
        ...prev,
        mhsId: mhsId,
        prodi: selectedStudent.Prodi || "",
        tahunAngkatan: selectedStudent.Angkatan || ""
      }));
    }

    // Try to get additional details from the MeninggalDunia endpoint
    try {
      const detailResponse = await fetch(`${API_LINK}MeninggalDunia/GetMahasiswaDetailForMeninggalDunia/${mhsId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        
        // Try to get program studi information
        try {
          const prodiResponse = await fetch(`${API_LINK}MeninggalDunia/GetMahasiswaProdiForMeninggalDunia/${mhsId}`, {
            method: 'GET',
            headers: getAuthHeaders()
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
          // If prodi API fails, use detail data or dropdown data
          setFormData(prev => ({
            ...prev,
            mhsId: mhsId,
            prodi: detailData?.prodi || detailData?.programStudi || detailData?.konNama || selectedStudent?.Prodi || prev.prodi,
            tahunAngkatan: detailData?.mhsAngkatan || detailData?.angkatan || detailData?.tahunAngkatan || selectedStudent?.Angkatan || prev.tahunAngkatan
          }));
        }
        
      } else if (detailResponse.status === 404) {
        // If the specific endpoint doesn't exist, the data from dropdown should be sufficient
      } else {
        // Detail API error
      }
      
    } catch (error) {
      // If APIs fail, keep the data from dropdown
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

      const res = await fetch(`${API_LINK}MeninggalDunia/CreateMeninggalDunia`, {
        method: "POST",
        headers: getAuthHeadersForFormData(),
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
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
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
        // Permission loading failed
        if (err) setPermission(null);
      }
    };

    if (userData?.username) loadPermission();
  }, [userData]);

  const roleId = userData?.roleId || "";
  const isProdi = roleId === "ROL71";

  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [prodiKonsentrasi, setProdiKonsentrasi] = useState("");

  const mahasiswaRef = useRef();

  const [formData, setFormData] = useState({
    mhsId: "",
    prodi: "",
    tahunAngkatan: "",
    lampiranMeninggal: null,
  });

  const [errors, setErrors] = useState({});
  
  // State untuk dropdown search mahasiswa
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchMahasiswa, setSearchMahasiswa] = useState("");
  const [filteredStudentList, setFilteredStudentList] = useState([]);

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
        // Konsentrasi loading failed
        if (error) setProdiKonsentrasi(null);
      }
    };

    loadKonsentrasi();
  }, [isProdi, userData]);

  // Helper functions to reduce complexity
  const processStudentItem = (item, index) => {
    const baseValue = item.value || item.mhsId || item.id || item.nim;
    return {
      ...item,
      value: baseValue || `dropdown_${index}_${Date.now()}`
    };
  };

  const extractAngkatan = (mhsId) => {
    if (mhsId && mhsId.length >= 4) {
      const nimYear = mhsId.substring(0, 4);
      if (/^\d{4}$/.test(nimYear)) {
        return nimYear;
      }
    }
    return "";
  };

  const transformFilteredStudent = (item, index) => {
    const mhsId = item.mhsId || `mhs_${index}_${Date.now()}`;
    const mhsNama = item.mhsNama || `Student ${index}`;
    const angkatan = extractAngkatan(mhsId);
    
    return {
      value: mhsId,
      text: mhsNama,
      nimNama: mhsNama,
      programStudi: prodiKonsentrasi || "",
      angkatan: angkatan
    };
  };

  const getUniqueValue = (baseValue, usedValues, index) => {
    if (!baseValue) {
      baseValue = `student_${index}_${Date.now()}`;
    }
    
    let uniqueValue = baseValue;
    let counter = 1;
    while (usedValues.has(uniqueValue)) {
      uniqueValue = `${baseValue}_${counter}`;
      counter++;
    }
    
    usedValues.add(uniqueValue);
    return uniqueValue;
  };

  const formatStudentForDropdown = (item, index, usedValues) => {
    const baseValue = item.value || item.mhsId || item.id || item.nim;
    const uniqueValue = getUniqueValue(baseValue, usedValues, index);
    
    let angkatan = item.angkatan || "";
    if (!angkatan && uniqueValue && uniqueValue.length >= 4) {
      angkatan = extractAngkatan(uniqueValue);
    }
    
    return {
      Value: uniqueValue,
      Text: item.text || item.mhsNama || item.nama || item.name || `Student ${index + 1}`,
      Prodi: item.programStudi || item.prodi || item.konNama || item.konsentrasi || item.programStudiNama || prodiKonsentrasi || "",
      Angkatan: angkatan
    };
  };

  const fetchProdiFilteredStudents = async () => {
    try {
      const konsentrasiResponse = await fetch(`${API_LINK}MeninggalDunia/GetKonsentrasiBySekprod?username=${userData?.username || userData?.nama}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!konsentrasiResponse.ok) return null;
      
      const konsentrasiData = await konsentrasiResponse.json();
      if (!konsentrasiData || konsentrasiData.length === 0) return null;
      
      const filteredResponse = await fetch(`${API_LINK}MeninggalDunia/GetMahasiswaByKonsentrasi?username=${userData?.username || userData?.nama}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!filteredResponse.ok) return null;
      
      const filteredStudentData = await filteredResponse.json();
      return filteredStudentData.map(transformFilteredStudent);
    } catch (filterError) {
      if (filterError) { /* error handled by returning null */ }
      return null;
    }
  };

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const url = `${API_LINK}MeninggalDunia/GetMahasiswaDropdownForMeninggalDunia`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Process initial data
          let filteredData = data.map(processStudentItem);
          
          // Apply Prodi filtering if needed
          if (isProdi && prodiKonsentrasi) {
            const prodiFilteredData = await fetchProdiFilteredStudents();
            if (prodiFilteredData) {
              filteredData = prodiFilteredData;
            }
          }
          
          // Format for dropdown
          const usedValues = new Set();
          const formattedStudents = filteredData.map((item, index) => 
            formatStudentForDropdown(item, index, usedValues)
          );
          
          setStudentList(formattedStudents);
          
          // Validation
          const isValid = formattedStudents.every(student => 
            student.Value && student.Value !== "" && typeof student.Value === "string"
          );
          
          if (!isValid) {
            // Warning: Some students have invalid Values
          }
        } else {
          Toast.error("Gagal memuat daftar mahasiswa.");
        }
      } catch (error) {
        if (error) Toast.error("Terjadi kesalahan saat memuat daftar mahasiswa.");
      }
    };

    loadStudents();
  }, [isProdi, prodiKonsentrasi]);

  // Update filtered list ketika studentList berubah
  useEffect(() => {
    setFilteredStudentList(studentList);
  }, [studentList]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mahasiswaRef.current && !mahasiswaRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  const handleStudentSelect = async (mhsId) => {
    setFormData(prev => ({
      ...prev,
      mhsId: mhsId,
      prodi: "",
      tahunAngkatan: ""
    }));

    setShowDropdown(false);
    setSearchMahasiswa("");

    if (!mhsId) return;

    try {
      // Use only GetMahasiswaDetailForMeninggalDunia endpoint
      const response = await fetch(`${API_LINK}MeninggalDunia/GetMahasiswaDetailForMeninggalDunia/${mhsId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Set form data from the detail endpoint response
        setFormData(prev => ({
          ...prev,
          mhsId: mhsId,
          prodi: data.programStudi || data.konsentrasi || "",
          tahunAngkatan: data.mhsAngkatan || ""
        }));
      } else {
        Toast.error("Gagal memuat detail mahasiswa.");
      }
    } catch (error) {
      Toast.error(`Terjadi kesalahan saat memuat detail mahasiswa: ${error.message || error}`);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files?.[0]) {
      const file = files[0];
      const maxSize = 10 * 1024 * 1024; 
      const allowedTypes = [
        'application/pdf',
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
        Toast.error(`Format file ${file.name} tidak didukung. Gunakan PDF, JPG, JPEG, atau PNG.`);
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
        loading={true}
        breadcrumb={[
          { label: "Sistem Informasi Akademik" },
          { label: "Administrasi Akademik" },
          { label: "Meninggal Dunia" },
          { label: "Tambah Pengajuan" },
        ]}
      />
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
            <Label
              required={true}
              text="Mahasiswa"
              htmlFor="mhsId"
              tooltip="Mahasiswa"
            />
            <div style={{ position: 'relative' }} ref={mahasiswaRef}>
              {/* Dropdown Button */}
              <button
                type="button"
                className="form-select rounded-4 text-start"
                onClick={() => {
                  setShowDropdown(!showDropdown);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#e8eaf6',
                  borderColor: '#d1d5e8',
                  color: '#5f6368',
                }}
              >
                <span style={{ color: formData.mhsId ? '#5f6368' : '#9e9e9e' }}>
                  {formData.mhsId 
                    ? studentList.find(s => s.Value === formData.mhsId)?.Text || '-- Pilih Mahasiswa --'
                    : '-- Pilih Mahasiswa --'
                  }
                </span>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    backgroundColor: 'white',
                    border: '1px solid #ced4da',
                    borderRadius: '0.375rem',
                    marginTop: '2px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    maxHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Search Input */}
                  <div
                    style={{
                      padding: '0.5rem',
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: 'white',
                    }}
                  >
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cari mahasiswa..."
                      value={searchMahasiswa}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchMahasiswa(value);
                        if (value.trim() === "") {
                          setFilteredStudentList(studentList);
                        } else {
                          setFilteredStudentList(
                            studentList.filter(student => 
                              student.Text.toLowerCase().includes(value.toLowerCase())
                            )
                          );
                        }
                      }}
                      autoFocus
                      style={{ fontSize: '0.9rem', backgroundColor: '#f0f4ff' }}
                    />
                  </div>

                  {/* List Items */}
                  <div style={{ 
                    overflowY: 'auto', 
                    maxHeight: '250px',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none', /* IE and Edge */
                  }}
                  className="hide-scrollbar"
                  >
                    <style jsx>{`
                      .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        color: '#6c757d',
                        backgroundColor: '#e9ecef',
                        borderBottom: '1px solid #dee2e6',
                        fontSize: '0.95rem',
                      }}
                    >
                      -- Pilih Mahasiswa --
                    </div>
                    {filteredStudentList && filteredStudentList.length > 0 ? (
                      filteredStudentList.map((student) => (
                        <button
                          key={student.Value}
                          type="button"
                          onClick={() => handleStudentSelect(student.Value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            cursor: 'pointer',
                            backgroundColor: formData.mhsId === student.Value ? '#e3f2fd' : 'white',
                            border: 'none',
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: '0.95rem',
                            textAlign: 'left',
                            color: '#212529',
                          }}
                          onMouseEnter={(e) => {
                            if (formData.mhsId !== student.Value) {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (formData.mhsId !== student.Value) {
                              e.currentTarget.style.backgroundColor = 'white';
                            }
                          }}
                        >
                          {student.Text}
                        </button>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: '0.5rem 0.75rem',
                          color: '#6c757d',
                          fontSize: '0.95rem',
                        }}
                      >
                        {studentList && studentList.length > 0 
                          ? 'Tidak ada data ditemukan' 
                          : 'Memuat data mahasiswa...'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.mhsId && (
              <span className="fw-normal text-danger">{errors.mhsId}</span>
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
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {errors.lampiranMeninggal && (
              <span className="fw-normal text-danger">{errors.lampiranMeninggal}</span>
            )}
            <small className="text-muted">
              Format yang didukung: PDF, JPG, JPEG, PNG (Maksimal 10MB)
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
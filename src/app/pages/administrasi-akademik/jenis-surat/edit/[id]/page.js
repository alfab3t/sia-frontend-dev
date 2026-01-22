"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import Card from "@/components/common/Card";
import Input from "@/components/common/Input";
import DropDown from "@/components/common/Dropdown";
import Button from "@/components/common/Button";
import Loading from "@/components/common/Loading";
import Toast from "@/components/common/Toast";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { decryptIdUrl } from "@/lib/encryptor";
import { getSSOData, getUserData } from "@/context/user";

const BREADCRUMB_ITEMS = [
    { label: "Sistem Informasi Akademik", href: "/auth/sso" },
    { label: "Administrasi Akademik - Jenis Surat" },
];

export default function EditJenisSurat() {
    const router = useRouter();
    const params = useParams();
    const ssoData = getSSOData();
    const userData = getUserData();
    
    const [pageLoading, setPageLoading] = useState(true);
    const [manualLoading, setManualLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 
    const hasLoadedRef = useRef(false);
    
    const [errors, setErrors] = useState({
        jsu_nama_surat: "",
        jsu_format_no: "",
        jsu_allow_mahasiswa: ""
    });
    
    const [formData, setFormData] = useState({
        jsu_id: 0,
        jsu_nama_surat: "",
        jsu_format_no: "",
        jsu_allow_mahasiswa: 0,
        jsu_modif_by: userData?.nama || ""
    });

    const allowMahasiswaOptions = [
        { Value: "1", Text: "Ya" },
        { Value: "0", Text: "Tidak" }
    ];

    const validateForm = () => {
        const newErrors = {
            jsu_nama_surat: "",
            jsu_format_no: "",
            jsu_allow_mahasiswa: "",
        };

        let isValid = true;

        if (!formData.jsu_nama_surat.trim()) {
            newErrors.jsu_nama_surat = "Nama Jenis Surat wajib diisi";
            isValid = false;
        } else if (formData.jsu_nama_surat.length > 100) {
            newErrors.jsu_nama_surat = "Nama Jenis Surat maksimal 100 karakter";
            isValid = false;
        }

        if (!formData.jsu_format_no.trim()) {
            newErrors.jsu_format_no = "Format Nomor Surat wajib diisi";
            isValid = false;
        } else if (formData.jsu_format_no.length > 100) {
            newErrors.jsu_format_no = "Format Nomor Surat maksimal 100 karakter";
            isValid = false;
        }

        if (formData.jsu_allow_mahasiswa === null || formData.jsu_allow_mahasiswa === undefined) {
            newErrors.jsu_allow_mahasiswa = "Pilihan untuk mahasiswa wajib diisi";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const clearError = (fieldName) => {
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: ""
            }));
        }
    };

    const loadJenisSuratData = useCallback(async (id) => {
        try {
            setManualLoading(true);
            
            const response = await fetchData(
                `${API_LINK}JenisSurat/DetailJenisSurat/${id}`,
                {},
                "GET"
            );

            const jenisSuratData = response;

            if (!jenisSuratData) {
                throw new Error("Data tidak ditemukan");
            }

            setFormData({
                jsu_id: id,
                jsu_nama_surat: jenisSuratData.namaSurat || "",
                jsu_format_no: jenisSuratData.formatNoSurat || "",
                jsu_allow_mahasiswa: jenisSuratData.allowMahasiswa ?? 0,
                jsu_modif_by: userData?.nama || ""
            });

        } catch (err) {
            Toast.error(`Gagal memuat data: ${err.message}`);
            router.push("../jenis-surat");
        } finally {
            setManualLoading(false);
        }
    }, [router, userData?.nama]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true); 

        try {
            const decryptedId = decryptIdUrl(params.id);
            
            const updateData = {
                Id: Number.parseInt(decryptedId),
                NamaSurat: formData.jsu_nama_surat,
                FormatNoSurat: formData.jsu_format_no,
                AllowMahasiswa: formData.jsu_allow_mahasiswa
            };

            const response = await fetchData(
                `${API_LINK}JenisSurat/EditJenisSurat`,
                updateData,
                "PUT"
            );

            if (response.message === "SUCCESS" || response.success === true) {
                Toast.success("Jenis Surat Berhasil Diubah");
                router.push("/pages/administrasi-akademik/jenis-surat");
            } else {
                throw new Error(response.message || "Gagal mengubah data");
            }
            
        } catch (err) {
            Toast.error(err.message);
        } finally {
            setIsLoading(false); 
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        clearError(field);
    };

    const handleDropdownChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: Number.parseInt(value)
        }));
        clearError(field);
    };

    const handleCancel = () => {
        router.push("/pages/administrasi-akademik/jenis-surat");
    };

    useEffect(() => {
        const timer = setTimeout(() => setPageLoading(false), 200);

        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }

        if (!params?.id) {
            Toast.error("Id tidak ditemukan");
            router.push("/pages/administrasi-akademik/jenis-surat");
            return;
        }

        if (hasLoadedRef.current) {
            return;
        }

        hasLoadedRef.current = true;

        try {
            const decryptedId = decryptIdUrl(params.id);
            
            if (!decryptedId) {
                throw new Error("Gagal mendekripsi Id");
            }
            
            loadJenisSuratData(decryptedId);
        } catch (error) {
            console.error("Error in useEffect:", error);
            Toast.error("Gagal memproses Id");
            router.push("/pages/administrasi-akademik/jenis-surat");
        }

        return () => clearTimeout(timer);
    }, [params.id, ssoData, router, loadJenisSuratData]);

    return (
        <>
            <Loading loading={manualLoading || pageLoading} message="Memuat data..." />
            
            <MainContent
                layout="Admin"
                loading={false}
                title="Jenis Surat"
                breadcrumb={BREADCRUMB_ITEMS}
            >
                <div className="row">
                    <div className="col-12">
                        <Card title="Form Ubah Jenis Surat">
                            <form onSubmit={handleSubmit} noValidate> 
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <Input
                                            label="Nama Jenis Surat"
                                            name="jsu_nama_surat"
                                            value={formData.jsu_nama_surat}
                                            onChange={(e) => handleInputChange("jsu_nama_surat", e.target.value)}
                                            placeholder="Masukkan nama jenis surat"
                                            error={errors.jsu_nama_surat}
                                            required={true}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <Input
                                            label="Format Nomor Surat"
                                            name="jsu_format_no"
                                            value={formData.jsu_format_no}
                                            onChange={(e) => handleInputChange("jsu_format_no", e.target.value)}
                                            placeholder="Contoh: XXX/SK/YYYY"
                                            error={errors.jsu_format_no}
                                            required={true}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <DropDown
                                            label="Apakah untuk mahasiswa ?"
                                            forInput="jsu_allow_mahasiswa"
                                            type="pilih"
                                            value={formData.jsu_allow_mahasiswa.toString()}
                                            onChange={(e) => handleDropdownChange("jsu_allow_mahasiswa", e.target.value)}
                                            arrData={allowMahasiswaOptions}
                                            error={errors.jsu_allow_mahasiswa}
                                            isRequired={true}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="row mt-5 pt-5">
                                    <div className="col-12">
                                        <div className="d-flex gap-2 justify-content-end">
                                            <Button
                                                type="button"
                                                classType="secondary"
                                                label="Batal"
                                                onClick={handleCancel}
                                                isDisabled={isLoading} 
                                            />
                                            
                                            <button
                                                type="submit"
                                                className={`btn rounded-3 btn-primary d-flex align-items-center justify-content-center gap-2 ${isLoading ? 'disabled' : ''}`}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <span
                                                            className="spinner-border spinner-border-sm"
                                                            aria-hidden="true"
                                                        ></span>
                                                        <span className="ms-2">Mengubah...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Ubah</span>
                                                        <i className="bi bi-save" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            </MainContent>
        </>
    );
}
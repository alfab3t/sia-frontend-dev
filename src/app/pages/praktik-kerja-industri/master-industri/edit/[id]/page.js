"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import Input from "@/components/common/Input";
import Dropdown from "@/components/common/Dropdown";
import Button from "@/components/common/Button";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import Toast from "@/components/common/Toast";
import { getSSOData } from "@/context/user";
import { decryptIdUrl } from "@/lib/encryptor";

const maxLengthRules = {
    NamaIndustri: 100,
    Grup: 50,
    Alamat: 200,
    Cabang: 100,
    Telepon: 20,
    Fax: 20,
    PIC: 50,
    TeleponPIC: 20,
    EmailPIC: 50,
    NamaPICAtasan: 50,
    TeleponPICAtasan: 20,
    EmailPICAtasan: 50,
};

const initialFormData = {
    Id: 0,
    NamaIndustri: "",
    Cabang: "",
    Grup: "",
    Alamat: "",
    Telepon: "",
    Fax: "",
    PIC: "",
    TeleponPIC: "",
    EmailPIC: "",
    NamaPICAtasan: "",
    TeleponPICAtasan: "",
    EmailPICAtasan: "",
};

const numericOnlyFields = new Set([
    "Telepon",
    "Fax",
    "TeleponPIC",
    "TeleponPICAtasan",
]);

export default function EditIndustriPage() {
    const router = useRouter();
    const params = useParams();
    const id = decryptIdUrl(params.id);
    const ssoData = useMemo(() => getSSOData(), []);

    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});

    const grupOptions = [
        { Value: "Astra International - HO", Text: "Astra International - HO" },
        { Value: "Astra Motor 1", Text: "Astra Motor 1" },
        { Value: "Astra Motor 2", Text: "Astra Motor 2" },
        { Value: "Astra Motor 3", Text: "Astra Motor 3" },
        { Value: "Astra Motor 4", Text: "Astra Motor 4" },
        { Value: "AHEME", Text: "AHEME" },
        { Value: "FINSER", Text: "FINSER" },
        { Value: "Agribisnis", Text: "Agribisnis" },
        { Value: "IT", Text: "IT" },
        {
            Value: "Infrastruktur dan Logistik",
            Text: "Infrastruktur dan Logistik",
        },
        { Value: "UKM", Text: "UKM" },
        { Value: "Yayasan", Text: "Yayasan" },
        { Value: "Non Astra Group", Text: "Non Astra Group" },
    ];

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetchData(
                `${API_LINK}MasterIndustri/DetailMasterIndustri/${id}`,
                {},
                "GET"
            );

            if (response) {
                setFormData({
                    Id: id,
                    NamaIndustri:
                        response.namaIndustri ?? response.NamaIndustri ?? "",
                    Cabang: response.cabang ?? response.Cabang ?? "",
                    Grup: response.grup ?? response.Grup ?? "",
                    Alamat: response.alamat ?? response.Alamat ?? "",
                    Telepon: response.telepon ?? response.Telepon ?? "",
                    Fax: response.fax ?? response.Fax ?? "",
                    PIC: response.pic ?? response.PIC ?? "",
                    TeleponPIC:
                        response.teleponPIC ?? response.TeleponPIC ?? "",
                    EmailPIC: response.emailPIC ?? response.EmailPIC ?? "",
                    NamaPICAtasan:
                        response.namaPICAtasan ?? response.NamaPICAtasan ?? "",
                    TeleponPICAtasan:
                        response.teleponPICAtasan ??
                        response.TeleponPICAtasan ??
                        "",
                    EmailPICAtasan:
                        response.emailPICAtasan ??
                        response.EmailPICAtasan ??
                        "",
                });
            } else {
                throw new Error("Data industri tidak ditemukan.");
            }
        } catch (err) {
            Toast.error("Gagal memuat data: " + err.message);
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }
        if (id) loadData();
    }, [id, ssoData, router, loadData]);

    const handleChange = useCallback(
        (e) => {
            const { name, value } = e.target;
            if (numericOnlyFields.has(name) && !/^\d*$/.test(value)) return;

            setFormData((prev) => ({ ...prev, [name]: value }));

            if (errors[name]) {
                setErrors((prev) => ({ ...prev, [name]: "" }));
            }
        },
        [errors]
    );

    const validateForm = useCallback(() => {
        const newErrors = {};
        const requiredFields = {
            NamaIndustri: "Nama industri wajib diisi",
            Grup: "Grup industri wajib dipilih",
            Alamat: "Alamat wajib diisi",
            Telepon: "Telepon wajib diisi",
            PIC: "Nama PIC wajib diisi",
        };

        const emailRegex =
            /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;

        ["EmailPIC", "EmailPICAtasan"].forEach((field) => {
            if (formData[field]) {
                const emails = formData[field].split(",");
                for (const email of emails) {
                    if (email.trim() && !emailRegex.test(email.trim())) {
                        newErrors[field] = "Format email tidak valid";
                        break;
                    }
                }
            }
        });

        for (const [field, message] of Object.entries(requiredFields)) {
            if (!formData[field]?.toString().trim()) {
                newErrors[field] = message;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            Toast.error("Mohon lengkapi semua field yang wajib diisi.");
            return;
        }

        setLoading(true);
        try {
            const data = await fetchData(
                API_LINK + "MasterIndustri/EditMasterIndustri",
                formData,
                "PUT"
            );

            if (data?.message === "SUCCESS") {
                Toast.success("Data berhasil diperbarui.");
                router.push("/pages/praktik-kerja-industri/master-industri");
            } else {
                Toast.error(data.message || "Terjadi kesalahan.");
                setLoading(false);
            }
        } catch (err) {
            Toast.error("Data gagal disimpan! " + err.message);
            setLoading(false);
        }
    };

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Ubah Master Industri"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Pengaturan Dasar" },
                {
                    label: "Master Industri",
                    href: "/pages/praktik-kerja-industri/master-industri",
                },
                { label: "Ubah" },
            ]}
        >
            <div className="card border-0 shadow-lg">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Nama Industri"
                                    name="NamaIndustri"
                                    value={formData.NamaIndustri}
                                    onChange={handleChange}
                                    error={errors.NamaIndustri}
                                    maxLength={maxLengthRules.NamaIndustri}
                                    required
                                />
                            </div>
                            <div className="col-lg-4">
                                <Input
                                    label={
                                        <>
                                            Cabang{" "}
                                            <small className="text-muted">
                                                (kosongkan jika bukan cabang)
                                            </small>
                                        </>
                                    }
                                    name="Cabang"
                                    value={formData.Cabang}
                                    onChange={handleChange}
                                    maxLength={maxLengthRules.Cabang}
                                />
                            </div>
                            <div className="col-lg-4">
                                <Dropdown
                                    label="Grup Industri"
                                    name="Grup"
                                    value={formData.Grup}
                                    arrData={grupOptions}
                                    onChange={handleChange}
                                    errorMessage={errors.Grup}
                                    isRequired
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Alamat"
                                    name="Alamat"
                                    value={formData.Alamat}
                                    onChange={handleChange}
                                    error={errors.Alamat}
                                    maxLength={maxLengthRules.Alamat}
                                    required
                                />
                            </div>
                            <div className="col-lg-4">
                                <Input
                                    label="Telepon"
                                    name="Telepon"
                                    value={formData.Telepon}
                                    onChange={handleChange}
                                    error={errors.Telepon}
                                    maxLength={maxLengthRules.Telepon}
                                    required
                                />
                            </div>
                            <div className="col-lg-4">
                                <Input
                                    label="Fax"
                                    name="Fax"
                                    value={formData.Fax}
                                    onChange={handleChange}
                                    maxLength={maxLengthRules.Fax}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Nama PIC"
                                    name="PIC"
                                    value={formData.PIC}
                                    onChange={handleChange}
                                    error={errors.PIC}
                                    maxLength={maxLengthRules.PIC}
                                    required
                                />
                            </div>
                            <div className="col-lg-4">
                                <Input
                                    label="Handphone PIC"
                                    name="TeleponPIC"
                                    value={formData.TeleponPIC}
                                    onChange={handleChange}
                                    maxLength={maxLengthRules.TeleponPIC}
                                />
                            </div>
                            <div className="col-lg-4">
                                <Input
                                    label="Email PIC"
                                    name="EmailPIC"
                                    value={formData.EmailPIC}
                                    onChange={handleChange}
                                    error={errors.EmailPIC}
                                    maxLength={maxLengthRules.EmailPIC}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Nama Atasan"
                                    name="NamaPICAtasan"
                                    value={formData.NamaPICAtasan}
                                    onChange={handleChange}
                                    maxLength={maxLengthRules.NamaPICAtasan}
                                />
                            </div>
                            <div className="col-lg-4">
                                <Input
                                    label="Handphone Atasan"
                                    name="TeleponPICAtasan"
                                    value={formData.TeleponPICAtasan}
                                    onChange={handleChange}
                                    maxLength={maxLengthRules.TeleponPICAtasan}
                                />
                            </div>
                            <div className="col-lg-4">
                                <Input
                                    label="Email Atasan"
                                    name="EmailPICAtasan"
                                    value={formData.EmailPICAtasan}
                                    onChange={handleChange}
                                    error={errors.EmailPICAtasan}
                                    maxLength={maxLengthRules.EmailPICAtasan}
                                />
                            </div>
                        </div>

                        <div className="mt-2">
                            <small className="text-muted">
                                * Pisahkan dengan koma (,) jika email lebih dari
                                1
                            </small>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button
                                classType="secondary"
                                label="Batal"
                                onClick={() => router.back()}
                                type="button"
                                isDisabled={loading}
                            />
                            <Button
                                classType="primary"
                                iconName={loading ? "" : "save"}
                                label={loading ? "Menyimpan..." : "Simpan"}
                                type="submit"
                                isDisabled={loading}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </MainContent>
    );
}

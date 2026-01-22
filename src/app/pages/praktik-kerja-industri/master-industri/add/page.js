"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Input from "@/components/common/Input";
import Dropdown from "@/components/common/Dropdown";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import { useRouter } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import Toast from "@/components/common/Toast";
import { getSSOData } from "@/context/user";

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

const numericOnlyFields = new Set([
    "Telepon",
    "Fax",
    "TeleponPIC",
    "TeleponPICAtasan",
]);

export default function AddIndustriPage() {
    const [formData, setFormData] = useState({
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
    });
    const ssoData = useMemo(() => getSSOData(), []);
    const [isClient, setIsClient] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const router = useRouter();

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

    const handleChange = useCallback(
        (e) => {
            const { name, value } = e.target;

            if (numericOnlyFields.has(name) && !/^\d*$/.test(value)) return;

            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));

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

        if (formData.EmailPIC) {
            for (const email of formData.EmailPIC.split(",")) {
                if (!emailRegex.test(email.trim())) {
                    newErrors.EmailPIC = "Format email tidak valid";
                    break;
                }
            }
        }

        if (formData.EmailPICAtasan) {
            for (const email of formData.EmailPICAtasan.split(",")) {
                if (!emailRegex.test(email.trim())) {
                    newErrors.EmailPICAtasan = "Format email tidak valid";
                    break;
                }
            }
        }

        for (const [field, message] of Object.entries(requiredFields)) {
            if (!formData[field]?.trim()) {
                newErrors[field] = message;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const reset = useCallback(() => {
        setFormData({
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
        });
    }, []);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();

            if (!validateForm()) {
                Toast.error("Mohon lengkapi semua field yang wajib diisi.");
                return;
            }

            setLoading(true);

            try {
                const data = await fetchData(
                    API_LINK + "MasterIndustri/CreateMasterIndustri",
                    formData,
                    "POST"
                );

                if (data?.message === "SUCCESS") {
                    Toast.success("Data industri berhasil disimpan");
                    reset();
                    router.push(
                        "/pages/praktik-kerja-industri/master-industri"
                    );
                } else {
                    Toast.error(
                        data.message || "Terjadi kesalahan. Silakan coba lagi"
                    );
                }
            } catch (err) {
                Toast.error("Data gagal disimpan! " + err.message);
            } finally {
                setLoading(false);
            }
        },
        [validateForm, formData, router, reset]
    );

    const handleCancel = useCallback(() => {
        reset();
        router.back();
    }, [reset, router]);

    useEffect(() => {
        setIsClient(true);

        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("./auth/login");
        }
    }, [ssoData, router]);

    if (!isClient) return null;

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Tambah Master Industri"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Pengaturan Dasar" },
                {
                    label: "Master Industri",
                    href: "/pages/praktik-kerja-industri/master-industri",
                },
                { label: "Tambah" },
            ]}
        >
            <div className="card border-0 shadow-lg">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Nama Industri"
                                    required={true}
                                    name="NamaIndustri"
                                    value={formData.NamaIndustri}
                                    onChange={handleChange}
                                    error={errors.NamaIndustri}
                                    maxLength={maxLengthRules.NamaIndustri}
                                />
                            </div>

                            <div className="col-lg-4">
                                <div className="mb-3">
                                    <Input
                                        label={
                                            <>
                                                Cabang{" "}
                                                <small className="text-muted">
                                                    (kosongkan jika bukan
                                                    cabang)
                                                </small>
                                            </>
                                        }
                                        name="Cabang"
                                        value={formData.Cabang}
                                        onChange={handleChange}
                                        maxLength={maxLengthRules.Cabang}
                                    />
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <Dropdown
                                    label="Grup Industri"
                                    forInput="Grup"
                                    arrData={grupOptions}
                                    isRequired={true}
                                    errorMessage={errors.Grup}
                                    onChange={handleChange}
                                    value={formData.Grup}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-lg-4">
                                <Input
                                    label="Alamat"
                                    required={true}
                                    name="Alamat"
                                    value={formData.Alamat}
                                    onChange={handleChange}
                                    error={errors.Alamat}
                                    maxLength={maxLengthRules.Alamat}
                                />
                            </div>

                            <div className="col-lg-4">
                                <Input
                                    label="Telepon"
                                    required={true}
                                    name="Telepon"
                                    value={formData.Telepon}
                                    onChange={handleChange}
                                    error={errors.Telepon}
                                    maxLength={maxLengthRules.Telepon}
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
                                    required={true}
                                    name="PIC"
                                    value={formData.PIC}
                                    onChange={handleChange}
                                    error={errors.PIC}
                                    maxLength={maxLengthRules.PIC}
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
                                * pisahkan dengan koma (,) jika email lebih dari
                                1
                            </small>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button
                                classType="secondary"
                                label="Batal"
                                onClick={handleCancel}
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

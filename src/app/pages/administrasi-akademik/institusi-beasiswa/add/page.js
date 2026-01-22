"use client";

import { useState, useCallback } from "react";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import { useRouter } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import Toast from "@/components/common/Toast";

const maxLengthRules = {
  namaInstitusiBeasiswa: 100,
  alamat: 200,
  telepon: 13,
  email: 50,
};

export default function AddInstitusiBeasiswaPage() {
  const [formData, setFormData] = useState({
    namaInstitusiBeasiswa: "",
    alamat: "",
    telepon: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      if (name === "telepon") {
        if (!/^[0-9-]*$/.test(value)) return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    const requiredFields = {
      namaInstitusiBeasiswa: "Nama institusi beasiswa wajib diisi",
      alamat: "Alamat wajib diisi",
      telepon: "Telepon wajib diisi",
      email: "Email wajib diisi",
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      const value = formData[field];

      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        newErrors[field] = message;
      }
    }

    const safeEmailRegex =
      /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;

    if (formData.email && !safeEmailRegex.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      namaInstitusiBeasiswa: "",
      alamat: "",
      telepon: "",
      email: "",
    });
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        Toast.error("Mohon lengkapi semua field wajib.");
        return;
      }

      setLoading(true);

      try {
        const data = await fetchData(
          API_LINK + "InstitusiBeasiswa/CreateInstitusiBeasiswa",
          formData,
          "POST",
        );

        if (data?.message === "SUCCESS") {
          Toast.success("Data institusi beasiswa berhasil ditambahkan.");
          reset();
          router.push("/pages/administrasi-akademik/institusi-beasiswa");
        }
      } catch {
        Toast.error("Data gagal disimpan! ");
      }

      setLoading(false);
    },
    [validateForm, formData, router, reset],
  );

  const handleCancel = useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Tambah Institusi Beasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        {
          label: "Institusi Beasiswa",
          href: "/pages/administrasi-akademik/institusi-beasiswa",
        },
        { label: "Tambah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-6">
                <Input
                  label={
                    <>
                      Nama Institusi Beasiswa{" "}
                      <span className="text-danger">*</span>
                    </>
                  }
                  name="namaInstitusiBeasiswa"
                  value={formData.namaInstitusiBeasiswa}
                  onChange={handleChange}
                  error={errors.namaInstitusiBeasiswa}
                  maxLength={maxLengthRules.namaInstitusiBeasiswa}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  label={
                    <>
                      Alamat <span className="text-danger">*</span>
                    </>
                  }
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  error={errors.alamat}
                  maxLength={maxLengthRules.alamat}
                />
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-lg-6">
                <Input
                  label={
                    <>
                      Telepon <span className="text-danger">*</span>
                    </>
                  }
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleChange}
                  error={errors.telepon}
                  maxLength={maxLengthRules.telepon}
                  inputMode="numeric"
                  pattern="[0-9-]*"
                />
              </div>

              <div className="col-lg-6">
                <Input
                  label={
                    <>
                      Email <span className="text-danger">*</span>
                    </>
                  }
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  maxLength={maxLengthRules.email}
                />
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-12 d-flex justify-content-end gap-2">
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
            </div>
          </form>
        </div>
      </div>
    </MainContent>
  );
}

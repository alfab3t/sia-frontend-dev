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
  definisi: 500,
};

export default function AddSkalaPenilaianPage() {
  const [formData, setFormData] = useState({
    skala: "",
    definisi: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.skala || formData.skala.trim() === "") {
      newErrors.skala = "Skala wajib diisi";
    } else if (Number.isNaN(formData.skala) || Number(formData.skala) <= 0) {
      newErrors.skala = "Skala harus berupa angka positif";
    }
    if (!formData.definisi || formData.definisi.trim() === "") {
      newErrors.definisi = "Definisi wajib diisi";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({ skala: "", definisi: "" });
    setErrors({});
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
          API_LINK + "SkalaPenilaian/CreateSkalaPenilaian",
          {
            skala: Number.parseInt(formData.skala, 10),
            definisi: formData.definisi,
          },
          "POST"
        );

        if (data && !data.error) {
          Toast.success("Data skala penilaian berhasil ditambahkan.");
          reset();
          router.push("/pages/kuesioner/skala-penilaian");
        } else {
          Toast.error(data.message || "Terjadi kesalahan. Silakan coba lagi.");
          setLoading(false);
        }
      } catch (err) {
        Toast.error("Data gagal disimpan! " + err.message);
        setLoading(false);
      }
    },
    [validateForm, formData, router, reset]
  );

  const handleCancel = useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Tambah Skala Penilaian Baru"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Kuesioner" },
        {
          label: "Skala Penilaian",
          href: "/pages/kuesioner/skala-penilaian",
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
                  label="Skala"
                  type="number"
                  name="skala"
                  id="skala"
                  value={formData.skala}
                  onChange={handleChange}
                  error={errors.skala}
                  maxLength={10}
                />
              </div>
              <div className="col-lg-6">
                <Input
                  label="Definisi"
                  name="definisi"
                  id="definisi"
                  value={formData.definisi}
                  onChange={handleChange}
                  error={errors.definisi}
                  maxLength={maxLengthRules.definisi}
                />
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-12">
                <div className="d-flex justify-content-end gap-2">
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
            </div>
          </form>
        </div>
      </div>
    </MainContent>
  );
}
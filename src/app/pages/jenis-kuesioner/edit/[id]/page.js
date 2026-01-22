"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";

const maxLengthRules = {
  namaJenis: 50,
};

const initialFormData = {
  namaJenis: "",
};

export default function EditJenisKuesionerPage() {
  const path = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const loadData = useCallback(async () => {
    const id = decryptIdUrl(path.id);

    if (!id || Number.isNaN(Number.parseInt(id))) {
      Toast.error("ID tidak valid.");
      router.back();
      return;
    }
    setLoading(true);
    try {
      const response = await fetchData(
        `${API_LINK}JenisKuesioner/DetailJenisKuesioner/${id}`,
        {},
        "GET"
      );
      const data = response.data || response;
      if (data?.namaJenis) {
        setFormData({ namaJenis: data.namaJenis });
      } else {
        throw new Error("Data tidak ditemukan atau format response salah.");
      }
    } catch (err) {
      Toast.error("Gagal memuat data: " + err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [path?.id, router]);

  useEffect(() => {
    if (path?.id) {
      loadData();
    }
  }, [path?.id]);

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
    if (!formData.namaJenis?.trim()) {
      newErrors.namaJenis = "Nama Jenis wajib diisi";
    } else if (formData.namaJenis.length > maxLengthRules.namaJenis) {
      newErrors.namaJenis = `Maksimal ${maxLengthRules.namaJenis} karakter`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        Toast.error("Mohon lengkapi semua field yang wajib diisi.");
        return;
      }

      const id = decryptIdUrl(path.id);
      if (!id || Number.isNaN(Number.parseInt(id))) {
        Toast.error("ID tidak valid.");
        return;
      }
      setLoading(true);
      try {
        const response = await fetchData(
          `${API_LINK}JenisKuesioner/UpdateJenisKuesioner`,
          {
            id: Number.parseInt(id),
            ...formData,
          },
          "PUT"
        );
        if (response.message === "SUCCESS") {
          Toast.success("Data Jenis Kuesioner berhasil diperbarui.");
          router.push("/pages/kuesioner/jenis-kuesioner");
        } else {
          Toast.error(response.message || "Terjadi kesalahan. Silakan coba lagi.");
          setLoading(false);
        }
      } catch (err) {
        Toast.error("Data gagal disimpan! " + err.message);
        setLoading(false);
      }
    },
    [validateForm, formData, path?.id, router]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Ubah Jenis Kuesioner"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Kuesioner" },
        {
          label: "Jenis Kuesioner",
          href: "/pages/kuesioner/jenis-kuesioner",
        },
        { label: "Ubah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-6">
                <Input
                  label="Nama Jenis"
                  name="namaJenis"
                  id="namaJenis"
                  value={formData.namaJenis}
                  onChange={handleChange}
                  error={errors.namaJenis}
                  maxLength={maxLengthRules.namaJenis}
                  autoFocus
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
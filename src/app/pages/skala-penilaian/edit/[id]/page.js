"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";

const maxLengthRules = {
  definisi: 500,
};

const initialFormData = {
  skala: "",
  definisi: "",
};

export default function EditSkalaPenilaianPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

    if (!formData.definisi || (typeof formData.definisi === "string" && !formData.definisi.trim())) {
      newErrors.definisi = "Definisi wajib diisi";
    } else if (formData.definisi.length > maxLengthRules.definisi) {
      newErrors.definisi = `Maksimal ${maxLengthRules.definisi} karakter`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const loadData = useCallback(async () => {
    if (!params?.id) {
      Toast.error("ID tidak ditemukan.");
      router.back();
      return;
    }

    const id = decryptIdUrl(params.id);

    if (!id || Number.isNaN(Number.parseInt(id))) {
      Toast.error("ID tidak valid.");
      router.back();
      return;
    }

    setLoading(true);
    try {
      const response = await fetchData(
        `${API_LINK}SkalaPenilaian/DetailSkalaPenilaian/${id}`,
        {},
        "GET"
      );
      if (response && (response.data || response.skala !== undefined)) {
        const data = response.data || response;
        setFormData({
          skala: data.skala ?? "",
          definisi: data.definisi ?? "",
        });
      } else {
        throw new Error("Data tidak ditemukan atau format tidak valid");
      }
    } catch (err) {
      Toast.error("Gagal memuat data: " + (err?.message || "Unknown Error"));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [params?.id, router]);

  useEffect(() => {
    loadData();
  }, [params?.id]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        Toast.error("Mohon lengkapi semua field yang wajib diisi.");
        return;
      }

      if (!params?.id) {
        Toast.error("ID tidak ditemukan.");
        return;
      }

      const id = decryptIdUrl(params.id);
      if (!id || Number.isNaN(Number.parseInt(id))) {
        Toast.error("ID tidak valid.");
        return;
      }

      setLoading(true);

      try {
        const payload = {
          id: Number.parseInt(id),
          definisi: formData.definisi,
        };

        const response = await fetchData(
          `${API_LINK}SkalaPenilaian/UpdateSkalaPenilaian`,
          payload,
          "PUT"
        );

        if (response && !response.error) {
          Toast.success("Data Skala Penilaian berhasil diperbarui.");
          router.push("/pages/kuesioner/skala-penilaian");
        } else {
          Toast.error(response?.message || "Terjadi kesalahan. Silakan coba lagi.");
          setLoading(false);
        }
      } catch (err) {
        Toast.error("Data gagal disimpan! " + err.message);
        setLoading(false);
      }
    },
    [formData, params?.id, router, validateForm]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Ubah Skala Penilaian"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Kuesioner" },
        {
          label: "Skala Penilaian",
          href: "/pages/kuesioner/skala-penilaian",
        },
        { label: "Ubah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4">
                <Input
                  label="Skala"
                  type="number"
                  name="skala"
                  id="skala"
                  value={formData.skala}
                  disabled
                />
              </div>
              <div className="col-lg-8">
                <Input
                  label="Definisi"
                  name="definisi"
                  id="definisi"
                  value={formData.definisi}
                  onChange={handleChange}
                  error={errors.definisi}
                  maxLength={maxLengthRules.definisi}
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
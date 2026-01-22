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
  namaSection: 100,
};

const initialFormData = {
  id: 0,
  rowNumber: 0,
  namaSection: "",
  status: "",
};

export default function EditSectionPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

        const response = await fetchData(
        `${API_LINK}Section/DetailSection/${id}`,
        {},
        "GET"
      );

      if (response) {
        setFormData({
          ...response,
          id: id,
        });
      } else {
        throw new Error("Data section tidak ditemukan.");
      }
    } catch (err) {
      Toast.error("Gagal memuat data: " + err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

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
    const requiredFields = {
      namaSection: "Nama section wajib diisi",
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      const value = formData[field];
      if (!value || (typeof value === "string" && !value.trim())) {
        newErrors[field] = message;
      }
    });

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

      setLoading(true);

      try {
        const data = await fetchData(
          API_LINK + "Section/EditSection",
          formData,
          "PUT"
        );

       if (data?.message === "SUCCESS") {
          Toast.success("Data berhasil diperbarui.");
          router.push("/pages/persiapan-perkuliahan/section");
        } else {
          Toast.error(data.message || "Terjadi kesalahan. Silakan coba lagi.");
          setLoading(false);
        }
      } catch (err) {
        Toast.error("Data gagal disimpan! " + err.message);
        setLoading(false);
      }
    },
    [formData, router, validateForm]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Ubah Section"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        {
          label: "Section",
          href: "/pages/Page_Master_Section",
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
                  label="Nama Section"
                  name="namaSection"
                  id="namaSection"
                  value={formData.namaSection}
                  onChange={handleChange}
                  error={errors.namaSection}
                  maxLength={maxLengthRules.namaSection}
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

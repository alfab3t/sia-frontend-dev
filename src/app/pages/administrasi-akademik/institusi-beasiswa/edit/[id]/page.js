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

const initialFormData = {
  id: 0,
  namaInstitusiBeasiswa: "",
  alamat: "",
  telepon: "",
  email: "",
};

const maxLengthRules = {
  namaInstitusiBeasiswa: 100,
  alamat: 200,
  telepon: 13,
  email: 50,
};

export default function EditInstitusiBeasiswaPage() {
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
        `${API_LINK}InstitusiBeasiswa/DetailInstitusiBeasiswa/${id}`,
        {},
        "GET",
      );

      if (!response) throw new Error("Data tidak ditemukan.");

      setFormData({
        id,
        namaInstitusiBeasiswa: response.namaInstitusiBeasiswa || "",
        alamat: response.alamat || "",
        telepon: response.telepon || "",
        email: response.email || "",
      });
    } catch {
      Toast.error("Gagal memuat data institusi beasiswa.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.namaInstitusiBeasiswa.trim())
      newErrors.namaInstitusiBeasiswa = "Nama institusi wajib diisi.";

    if (!formData.alamat.trim()) newErrors.alamat = "Alamat wajib diisi.";

    if (!formData.telepon.trim()) newErrors.telepon = "Telepon wajib diisi.";

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!formData.email.trim()) newErrors.email = "Email wajib diisi.";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Format email tidak valid.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Toast.error("Mohon lengkapi field wajib.");
      return;
    }

    setLoading(true);

    try {
      const result = await fetchData(
        `${API_LINK}InstitusiBeasiswa/EditInstitusiBeasiswa`,
        formData,
        "PUT",
      );

      if (result?.message === "SUCCESS") {
        Toast.success("Data berhasil diperbarui.");
        router.push("/pages/administrasi-akademik/institusi-beasiswa");
        return;
      }
    } catch {
      Toast.error("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => router.back();

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Ubah Institusi Beasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        {
          label: "Institusi Beasiswa",
          href: "/pages/administrasi-akademik/institusi-beasiswa",
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
                  label={
                    <span>
                      Nama Institusi Beasiswa{" "}
                      <span className="text-danger">*</span>
                    </span>
                  }
                  name="namaInstitusiBeasiswa"
                  value={formData.namaInstitusiBeasiswa}
                  onChange={handleChange}
                  error={errors.namaInstitusiBeasiswa}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  label={
                    <span>
                      Alamat <span className="text-danger">*</span>
                    </span>
                  }
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  error={errors.alamat}
                  maxLength={maxLengthRules.alamat}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-lg-6">
                <Input
                  label={
                    <span>
                      Telepon <span className="text-danger">*</span>
                    </span>
                  }
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleChange}
                  error={errors.telepon}
                  maxLength={maxLengthRules.telepon}
                />
              </div>

              <div className="col-lg-6">
                <Input
                  label={
                    <span>
                      Email <span className="text-danger">*</span>
                    </span>
                  }
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  maxLength={maxLengthRules.email}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4 gap-2">
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

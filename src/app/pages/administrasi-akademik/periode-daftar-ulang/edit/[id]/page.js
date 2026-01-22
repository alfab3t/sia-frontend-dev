"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import Input from "@/components/common/Input";
import Calendar from "@/components/common/Calendar";
import Button from "@/components/common/Button";
import Toast from "@/components/common/Toast";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { decryptIdUrl } from "@/lib/encryptor";
import DateFormatter from "@/lib/dateFormater";

export default function EditPeriodeDaftarUlangPage() {
  const router = useRouter();
  const { id: encryptedId } = useParams();
  const id = decryptIdUrl(encryptedId);

  const [formData, setFormData] = useState({
    id: 0,
    tahunAjaran: "",
    tanggalMulai: "",
    tanggalAkhir: "",
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const loadData = useCallback(async () => {
    if (!id) {
      Toast.error("ID periode tidak valid.");
      router.back();
      return;
    }
    try {
      setLoading(true);
      const item = await fetchData(
        `${API_LINK}PeriodeDaftarUlang/PeriodeDaftarUlang/${id}`,
        {},
        "GET",
      );

      if (item && !item.error) {
        setFormData({
          id: item.id,
          tahunAjaran: item.tahunAjaran,
          tanggalMulai: item.tanggalMulai
            ? DateFormatter.formatDateForInput(item.tanggalMulai)
            : "",
          tanggalAkhir: item.tanggalAkhir
            ? DateFormatter.formatDateForInput(item.tanggalAkhir)
            : "",
        });
      } else {
        throw new Error(item.message || "Data periode tidak ditemukan.");
      }
    } catch (err) {
      Toast.error(`Gagal memuat data: ${err.message}`);
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
    (name, value) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.tanggalMulai)
      newErrors.tanggalMulai = "Tanggal mulai wajib diisi.";
    if (!formData.tanggalAkhir)
      newErrors.tanggalAkhir = "Tanggal akhir wajib diisi.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) {
        Toast.error("Mohon lengkapi semua field dengan benar.");
        return;
      }

      setLoading(true);
      try {
        const payload = {
          id: formData.id,
          tahunAjaran: formData.tahunAjaran,
          tanggalMulai: formData.tanggalMulai,
          tanggalAkhir: formData.tanggalAkhir,
        };

        const response = await fetchData(
          `${API_LINK}PeriodeDaftarUlang/EditPeriodeDaftarUlang`,
          payload,
          "PUT",
        );

        if (response?.message === "SUCCESS") {
          Toast.success("Periode daftar ulang berhasil diperbarui.");
          router.push("/pages/administrasi-akademik/periode-daftar-ulang");
        } else {
          throw new Error(response.message || "Gagal menyimpan data.");
        }
      } catch (err) {
        Toast.error(err.message);
        setLoading(false);
      }
    },
    [formData, validateForm, router],
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Ubah Periode Daftar Ulang"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Administrasi Akademik" },
        {
          label: "Periode Daftar Ulang",
          href: "/pages/administrasi-akademik/periode-daftar-ulang",
        },
        { label: "Ubah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4 mb-3">
                <Input
                  label="Tahun Akademik"
                  name="tahunAjaran"
                  value={formData.tahunAjaran}
                  onChange={() => {}}
                  disabled
                  readOnly
                />
              </div>
              <div className="col-lg-4 mb-3">
                <Calendar
                  label="Tanggal Mulai"
                  type="single"
                  value={
                    formData.tanggalMulai
                      ? new Date(formData.tanggalMulai)
                      : null
                  }
                  onChange={(date) =>
                    handleChange(
                      "tanggalMulai",
                      date ? DateFormatter.formatDateForInput(date) : "",
                    )
                  }
                  error={errors.tanggalMulai}
                  required
                />
              </div>
              <div className="col-lg-4 mb-3">
                <Calendar
                  label="Tanggal Akhir"
                  type="single"
                  value={
                    formData.tanggalAkhir
                      ? new Date(formData.tanggalAkhir)
                      : null
                  }
                  onChange={(date) =>
                    handleChange(
                      "tanggalAkhir",
                      date ? DateFormatter.formatDateForInput(date) : "",
                    )
                  }
                  error={errors.tanggalAkhir}
                  required
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

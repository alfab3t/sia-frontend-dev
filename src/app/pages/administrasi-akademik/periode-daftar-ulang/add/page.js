"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import DropDown from "@/components/common/Dropdown";
import Calendar from "@/components/common/Calendar";
import Button from "@/components/common/Button";
import Toast from "@/components/common/Toast";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import DateFormatter from "@/lib/dateFormater";

export default function AddPeriodeDaftarUlangPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    tahunAjaran: "",
    tanggalMulai: "",
    tanggalAkhir: "",
  });

  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchTahunAjaran = async () => {
      try {
        const response = await fetchData(
          `${API_LINK}PeriodeDaftarUlang/GetTahunAjaran`,
          {},
          "GET",
        );
        if (response.error) throw new Error(response.message);
        const options = response.map((item) => ({
          Value: item.tahunAjaran,
          Text: item.tahunAjaran,
        }));
        setTahunAjaranOptions(options);
      } catch (error) {
        Toast.error(`Gagal memuat data tahun akademik: ${error.message}`);
      }
    };
    fetchTahunAjaran();
  }, []);

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
    if (!formData.tahunAjaran)
      newErrors.tahunAjaran = "Tahun akademik wajib dipilih.";
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
          tahunAjaran: formData.tahunAjaran,
          tanggalMulai: formData.tanggalMulai,
          tanggalAkhir: formData.tanggalAkhir,
        };

        const response = await fetchData(
          `${API_LINK}PeriodeDaftarUlang/CreatePeriodeDaftarUlang`,
          payload,
          "POST",
        );

        if (response?.message === "SUCCESS") {
          Toast.success("Periode daftar ulang berhasil ditambahkan.");
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
    router.push("/pages/administrasi-akademik/periode-daftar-ulang");
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Tambah Periode Daftar Ulang"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Administrasi Akademik" },
        {
          label: "Periode Daftar Ulang",
          href: "/pages/administrasi/periode-daftar-ulang",
        },
        { label: "Tambah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4 mb-3">
                <DropDown
                  label="Tahun Akademik"
                  forInput="tahunAjaran"
                  arrData={tahunAjaranOptions}
                  value={formData.tahunAjaran}
                  onChange={(e) => handleChange("tahunAjaran", e.target.value)}
                  errorMessage={errors.tahunAjaran}
                  isRequired
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

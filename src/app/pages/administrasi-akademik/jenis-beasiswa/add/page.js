"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import DropDown from "@/components/common/Dropdown";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";

const maxLengthRules = {
  namaJenisBeasiswa: 100,
};

const initialFormData = {
  institusiId: 0,
  namaInstitusi: "",
  namaJenisBeasiswa: "",
  masaSemester: "",
};

export default function AddJenisBeasiswaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [institusiOptions, setInstitusiOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const dropDownRef = useRef(null);

  useEffect(() => {
    const fetchInstitusi = async () => {
      setLoading(true);
      try {
        const res = await fetchData(
          `${API_LINK}InstitusiBeasiswa/GetAllInstitusiBeasiswaDropdown?PageNumber=0&PageSize=0&Status=Aktif&Urut=institusiNama%20asc`,
          {},
          "GET",
        );

        const options =
          res?.data?.map((item) => ({
            Value: item.id,
            Text: item.namaInstitusiBeasiswa,
          })) || [];

        setInstitusiOptions(options);
      } catch {
        Toast.error("Gagal memuat data institusi");
      } finally {
        setLoading(false);
      }
    };

    fetchInstitusi();
  }, []);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    },
    [errors],
  );

  const handleDropdownChange = useCallback(
    (e) => {
      const selected = institusiOptions.find(
        (opt) => opt.Value.toString() === e.target.value,
      );
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          institusiId: selected.Value,
          namaInstitusi: selected.Text,
        }));
        if (errors.namaInstitusi)
          setErrors((prev) => ({ ...prev, namaInstitusi: "" }));
      }
    },
    [institusiOptions, errors],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.institusiId)
      newErrors.namaInstitusi = "Nama institusi beasiswa wajib diisi";
    if (!formData.namaJenisBeasiswa.trim())
      newErrors.namaJenisBeasiswa = "Nama jenis beasiswa wajib diisi";
    if (!formData.masaSemester)
      newErrors.masaSemester = "Masa semester wajib diisi";

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
          `${API_LINK}JenisBeasiswa/CreateJenisBeasiswa`,
          {
            InstitusiId: Number.parseInt(formData.institusiId, 10) || 0,
            NamaJenisBeasiswa: formData.namaJenisBeasiswa,
            MasaSemester: Number.parseInt(formData.masaSemester, 10) || 0,
          },
          "POST",
        );

        if (data?.message === "SUCCESS") {
          Toast.success("Data berhasil ditambahkan.");
          router.back();
        }
      } catch {
        Toast.error("Data gagal disimpan!");
      } finally {
        setLoading(false);
      }
    },
    [formData, router, validateForm],
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Tambah Jenis Beasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Administrasi Akademik" },
        {
          label: "Jenis Beasiswa",
          href: "/pages/administrasi-akademik/jenis-beasiswa",
        },
        {
          label: "Tambah",
          href: "/pages/administrasi-akademik/jenis-beasiswa/add/[id]",
        },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-6">
                <DropDown
                  arrData={institusiOptions}
                  label="Nama Institusi Beasiswa"
                  forInput="namaInstitusi"
                  value={formData.institusiId || ""}
                  onChange={handleDropdownChange}
                  errorMessage={errors.namaInstitusi}
                  ref={dropDownRef}
                  isDisabled={loading}
                  type="pilih"
                  isRequired
                />
              </div>

              <div className="col-lg-6">
                <Input
                  label={
                    <>
                      Nama Jenis Beasiswa <span className="text-danger">*</span>
                    </>
                  }
                  name="namaJenisBeasiswa"
                  id="namaJenisBeasiswa"
                  value={formData.namaJenisBeasiswa}
                  onChange={handleChange}
                  error={errors.namaJenisBeasiswa}
                  maxLength={maxLengthRules.namaJenisBeasiswa}
                />
              </div>
            </div>

            <div className="row mt-2">
              <div className="col-lg-6">
                <DropDown
                  arrData={[1, 2, 3, 4, 5, 6, 7, 8].map((num) => ({
                    Value: num,
                    Text: num.toString(),
                  }))}
                  label="Masa Semester"
                  forInput="masaSemester"
                  value={Number.parseInt(formData.masaSemester, 10) || ""}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      masaSemester: val.toString(),
                    }));
                    if (errors.masaSemester)
                      setErrors((prev) => ({ ...prev, masaSemester: "" }));
                  }}
                  errorMessage={errors.masaSemester}
                  isDisabled={loading}
                  type="pilih"
                  isRequired
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

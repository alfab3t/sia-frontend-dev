"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import DropDown from "@/components/common/Dropdown";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";

const maxLengthRules = {
  namaJenisBeasiswa: 100,
};

const initialFormData = {
  id: 0,
  ibeId: 0,
  namaInstitusi: "",
  namaJenisBeasiswa: "",
  masaSemester: "",
};

export default function EditJenisBeasiswaPage() {
  const path = useParams();
  const router = useRouter();
  const id = decryptIdUrl(path.id);

  const [formData, setFormData] = useState(initialFormData);
  const [institusiOptions, setInstitusiOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const dropDownRef = useRef(null);
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const resInstitusi = await fetchData(
          `${API_LINK}InstitusiBeasiswa/GetAllInstitusiBeasiswaDropdown?PageNumber=0&PageSize=0&Status=Aktif&Urut=institusiNama%20asc`,
          {},
          "GET",
        );

        let options =
          resInstitusi?.data?.map((item) => ({
            Value: item.id,
            Text: item.namaInstitusiBeasiswa,
          })) || [];

        if (id) {
          const resDetail = await fetchData(
            `${API_LINK}JenisBeasiswa/DetailJenisBeasiswa/${id}`,
            {},
            "GET",
          );

          if (!resDetail)
            throw new Error("Data Jenis Beasiswa tidak ditemukan.");

          setFormData({
            id: resDetail.id,
            ibeId: resDetail.ibeId,
            namaInstitusi: resDetail.namaInstitusi || "",
            namaJenisBeasiswa: resDetail.namaJenisBeasiswa || "",
            masaSemester: resDetail.masaSemester?.toString() || "",
          });

          const exist = options.some((o) => o.Value === resDetail.ibeId);
          if (!exist) {
            options.unshift({
              Value: resDetail.ibeId,
              Text: resDetail.namaInstitusi,
            });
          }
        }

        setInstitusiOptions(options);
      } catch {
        Toast.error("Gagal memuat data");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id, router]);

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
        (opt) => opt.Value === Number.parseInt(e.target.value),
      );
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          ibeId: selected.Value,
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
    const requiredFields = {
      namaInstitusi: "Nama institusi wajib diisi",
      namaJenisBeasiswa: "Nama jenis beasiswa wajib diisi",
      masaSemester: "Masa semester wajib diisi",
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      const value = formData[field];
      if (!value?.toString().trim()) {
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
          `${API_LINK}JenisBeasiswa/EditJenisBeasiswa`,
          {
            Id: formData.id,
            InstitusiId: formData.ibeId,
            NamaJenisBeasiswa: formData.namaJenisBeasiswa,
            MasaSemester: Number.parseInt(formData.masaSemester),
          },
          "PUT",
        );

        if (data?.message === "SUCCESS") {
          Toast.success("Data berhasil diperbarui.");
          router.back();
        } else {
          Toast.error("Terjadi kesalahan. Silakan coba lagi.");
          setLoading(false);
        }
      } catch {
        Toast.error("Data gagal disimpan! ");
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
      title="Ubah Jenis Beasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Administrasi Akademik" },
        {
          label: "Jenis Beasiswa",
          href: "pages/administrasi-akademik/jenis-beasiswa",
        },
        {
          label: "Ubah",
          href: "pages/administrasi-akademik/jenis-beasiswa/edit/[id]",
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
                  label="Nama Institusi"
                  forInput="namaInstitusi"
                  value={formData.ibeId}
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
                  value={Number.parseInt(formData.masaSemester) || ""}
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

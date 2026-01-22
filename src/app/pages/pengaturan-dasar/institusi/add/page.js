"use client";

import { useState, useCallback } from "react";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import { useRouter } from "next/navigation";
import Calendar from "@/components/common/Calendar";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import Toast from "@/components/common/Toast";

const maxLengthRules = {
  namaInstitusi: 100,
  namaDirektur: 50,
  alamat: 200,
  namaWadir1: 50,
  namaWadir2: 50,
  namaWadir3: 50,
  namaWadir4: 50,
  nomorSK: 50,
  telepon: 15,
  fax: 15,
  kodePos: 5,
  email: 50,
  website: 50,
};

export default function AddInstitusiPage() {
  const [formData, setFormData] = useState({
    namaInstitusi: "",
    namaDirektur: "",
    alamat: "",
    namaWadir1: "",
    namaWadir2: "",
    namaWadir3: "",
    namaWadir4: "",
    tanggalBerdiri: "",
    nomorSK: "",
    tanggalSK: "",
    telepon: "",
    fax: "",
    kodePos: "",
    email: "",
    website: "",
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
    const requiredFields = {
      namaInstitusi: "Nama institusi wajib diisi",
      namaDirektur: "Direktur wajib diisi",
      alamat: "Alamat wajib diisi",
      namaWadir1: "Wakil direktur 1 wajib diisi",
      nomorSK: "Nomor SK wajib diisi",
      tanggalSK: "Tanggal SK wajib diisi",
      kodePos: "Kode pos wajib diisi",
    };

    const safeEmailRegex =
      /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;

    if (formData.email && !safeEmailRegex.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    for (const [field, message] of Object.entries(requiredFields)) {
      const value = formData[field];
      if (!value || (typeof value === "string" && !value.trim())) {
        newErrors[field] = message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData({
      namaInstitusi: "",
      namaDirektur: "",
      alamat: "",
      namaWadir1: "",
      namaWadir2: "",
      namaWadir3: "",
      namaWadir4: "",
      tanggalBerdiri: "",
      nomorSK: "",
      tanggalSK: "",
      telepon: "",
      fax: "",
      kodePos: "",
      email: "",
      website: "",
    });
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
          API_LINK + "Institusi/CreateInstitusi",
          formData,
          "POST"
        );

        if (data?.message === "SUCCESS") {
          Toast.success("Data institusi berhasil ditambahkan.");
          reset();
          router.push("/pages/pengaturan-dasar/institusi");
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
      title="Tambah Institusi Baru"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        {
          label: "Institusi",
          href: "/pages/pengaturan-dasar/institusi",
        },
        { label: "Tambah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-4">
                <Input
                  label="Nama Institusi"
                  name="namaInstitusi"
                  id="namaInstitusi"
                  value={formData.namaInstitusi}
                  onChange={handleChange}
                  error={errors.namaInstitusi}
                  maxLength={maxLengthRules.namaInstitusi}
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Direktur"
                  name="namaDirektur"
                  id="direktur"
                  value={formData.namaDirektur}
                  onChange={handleChange}
                  error={errors.namaDirektur}
                  maxLength={maxLengthRules.namaDirektur}
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Alamat"
                  name="alamat"
                  id="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  error={errors.alamat}
                  maxLength={maxLengthRules.alamat}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-lg-4">
                <Input
                  label="Wakil Direktur 1"
                  name="namaWadir1"
                  id="namaWadir1"
                  value={formData.namaWadir1}
                  onChange={handleChange}
                  error={errors.namaWadir1}
                  maxLength={maxLengthRules.namaWadir1}
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Wakil Direktur 2"
                  name="namaWadir2"
                  id="namaWadir2"
                  value={formData.namaWadir2}
                  onChange={handleChange}
                  maxLength={maxLengthRules.namaWadir2}
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Wakil Direktur 3"
                  name="namaWadir3"
                  id="namaWadir3"
                  value={formData.namaWadir3}
                  onChange={handleChange}
                  maxLength={maxLengthRules.namaWadir3}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-lg-4">
                <Input
                  label="Wakil Direktur 4"
                  name="namaWadir4"
                  id="namaWadir4"
                  value={formData.namaWadir4}
                  onChange={handleChange}
                  maxLength={maxLengthRules.namaWadir4}
                />
              </div>
              <div className="col-lg-4">
                <Calendar
                  label="Tanggal Berdiri"
                  type="single"
                  value={
                    formData.tanggalBerdiri
                      ? new Date(formData.tanggalBerdiri)
                      : null
                  }
                  onChange={(date) => {
                    handleChange({
                      target: {
                        name: "tanggalBerdiri",
                        value: date ? date.toISOString().split("T")[0] : "",
                      },
                    });
                  }}
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Nomor SK"
                  name="nomorSK"
                  id="nomorSK"
                  value={formData.nomorSK}
                  onChange={handleChange}
                  error={errors.nomorSK}
                  maxLength={maxLengthRules.nomorSK}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-lg-4">
                <Calendar
                  label="Tanggal SK"
                  type="single"
                  value={
                    formData.tanggalSK ? new Date(formData.tanggalSK) : null
                  }
                  onChange={(date) => {
                    handleChange({
                      target: {
                        name: "tanggalSK",
                        value: date ? date.toISOString().split("T")[0] : "",
                      },
                    });
                  }}
                  error={errors.tanggalSK}
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Telepon"
                  type="number"
                  name="telepon"
                  id="telepon"
                  value={formData.telepon}
                  onChange={handleChange}
                  maxLength={maxLengthRules.telepon}
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Fax"
                  name="fax"
                  id="fax"
                  value={formData.fax}
                  onChange={handleChange}
                  maxLength={maxLengthRules.fax}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-lg-4">
                <Input
                  label="Kode Pos"
                  name="kodePos"
                  id="kodePos"
                  value={formData.kodePos}
                  onChange={handleChange}
                  error={errors.kodePos}
                  maxLength={maxLengthRules.kodePos}
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  maxLength={maxLengthRules.email}
                />
              </div>
              <div className="col-lg-4">
                <Input
                  label="Website"
                  type="url"
                  name="website"
                  id="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://..."
                  maxLength={maxLengthRules.website}
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

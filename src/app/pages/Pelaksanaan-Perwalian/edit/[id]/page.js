"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";

import MainContent from "@/components/layout/MainContent";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Toast from "@/components/common/Toast";
import Swal from "@/components/common/SweetAlert";
import Loading from "@/components/common/Loading";
import Editor from "@/components/common/Editor";
import { decryptIdUrl } from "@/lib/encryptor";

import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";

const getAuthHeader = () => {
  const token = Cookies.get("jwtToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function EditPerwalianPage() {
  const { id: encryptedId } = useParams();
  const id = decryptIdUrl(encryptedId);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  useEffect(() => {
  if (!id) {
    Toast.error("ID tidak valid");
    router.push("/pages/Pelaksanaan-Perwalian");
  }
}, [id, router]);

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
  IdMahasiswa: "",
  NamaMahasiswa: "",
  IdDosen: "",
  NamaDosen: "",
  Subjek: "",
  Status: "ACTIVE",
  pesan: "",
  attachment: null,
});


  useEffect(() => {
    const role = localStorage.getItem("role_id");
    if (role === "ROL01") {
      Toast.error("Anda tidak memiliki akses.");
      router.push("/pages/Pelaksanaan-Perwalian");
    }
  }, [router]);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);

      const res = await fetchData(
        `${API_LINK}Perwalian/Detail/${id}`,
        {},
        "GET"
      );

      if (!res) throw new Error("Data tidak ditemukan");

      setFormData((prev) => ({
        ...prev,
        IdMahasiswa: String(res.idMahasiswa ?? ""),
        NamaMahasiswa: res.namaMahasiswa ?? "",
        IdDosen: String(res.idDosen ?? ""),
        NamaDosen: res.namaDosen ?? "",
        Subjek: String(res.subjek ?? ""),
        Status: String(res.status ?? "ACTIVE"),
      }));
    } catch (err) {
      Toast.error("Gagal memuat detail perwalian");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    const e = {};
    if (!formData.IdMahasiswa.trim())
      e.IdMahasiswa = "NIM wajib diisi";
    if (!formData.IdDosen.trim())
      e.IdDosen = "Dosen wali wajib diisi";
    if (!formData.Subjek.trim())
      e.Subjek = "Subjek wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        IdMahasiswa: formData.IdMahasiswa,
        IdDosen: formData.IdDosen,
        Subjek: formData.Subjek,
        Status: formData.Status,
      };

      const res = await fetch(`${API_LINK}Perwalian/Edit/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Gagal update perwalian");
      }

      if (formData.pesan || formData.attachment) {
        const fd = new FormData();
        fd.append("IdPerwalian", id);
        fd.append("Pesan", formData.pesan || "");
        if (formData.attachment) {
          fd.append("File", formData.attachment);
        }

        await fetch(`${API_LINK}Perwalian/AddDetail`, {
          method: "POST",
          headers: {
            ...getAuthHeader(),
          },
          body: fd,
        });
      }

      await Swal({
        title: "Berhasil!",
        text: "Data perwalian berhasil diperbarui.",
        icon: "success",
      });

      router.push("/pages/Pelaksanaan-Perwalian");
    } catch (err) {
      Toast.error("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Loading loading={loading} message="Memuat data perwalian..." />

      <MainContent
        layout="Admin"
        title="Edit Perwalian"
        loading={loading}
        breadcrumb={[
          { label: "Beranda", href: "/sample" },
          { label: "Perwalian" },
          {
            label: "Pelaksanaan Perwalian",
            href: "/pages/Pelaksanaan-Perwalian",
          },
          { label: "Edit" },
        ]}
      >
        <div className="card border-0 shadow-lg">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-lg-4">
                  <Input
                    disabled
                    label="Mahasiswa (NIM)"
                    name="IdMahasiswa"
                    value={formData.NamaMahasiswa ? `${formData.IdMahasiswa} - ${formData.NamaMahasiswa}` : formData.IdMahasiswa}
                    onChange={handleChange}
                    error={errors.IdMahasiswa}
                  />
                </div>

                <div className="col-lg-4">
                  <Input
                    disabled
                    label="Dosen Wali"
                    name="IdDosen"
                    value={formData.NamaDosen}
                    onChange={handleChange}
                    error={errors.IdDosen}
                  />
                </div>

                <div className="col-lg-4">
                  <Input
                    label="Subjek"
                    name="Subjek"
                    value={formData.Subjek}
                    onChange={handleChange}
                    error={errors.Subjek}
                  />
                </div>
              </div>

              <div className="mt-3">
                <Editor
                  label="Pesan"
                  name="pesan"
                  value={formData.pesan}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-3">
                <label
                  htmlFor="fileUpload"
                  className="form-label fw-semibold"
                >
                  Upload File
                </label>
                <input
                  id="fileUpload"
                  type="file"
                  className="form-control"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      attachment: e.target.files?.[0] ?? null,
                    }))
                  }
                />
              </div>

              <div className="d-flex justify-content-end gap-3 mt-4">
                <Button
                  classType="secondary"
                  label="Batal"
                  type="button"
                  onClick={() => router.back()}
                />
                <Button
                  classType="primary"
                  iconName="save"
                  label="Simpan"
                  type="submit"
                  isDisabled={loading}
                />
              </div>
            </form>
          </div>
        </div>
      </MainContent>
    </>
  );
}

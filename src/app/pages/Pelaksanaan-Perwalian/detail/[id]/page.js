"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PropTypes from "prop-types";
import Cookies from "js-cookie";

import MainContent from "@/components/layout/MainContent";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import Toast from "@/components/common/Toast";
import Swal from "@/components/common/SweetAlert";
import Loading from "@/components/common/Loading";
import Editor from "@/components/common/Editor";
import { decryptIdUrl } from "@/lib/encryptor";

import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";


const DetailItem = ({ label, value }) => (
  <div className="col-lg-4 mb-3">
    <small className="text-muted d-block mb-1 fw-semibold">{label}</small>
    {value ?? "-"}
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};


export default function DetailPerwalianPage() {
  const { id: encryptedId } = useParams();
  const id = decryptIdUrl(encryptedId);
  const router = useRouter();

  useEffect(() => {
  if (!id) {
    Toast.error("ID tidak valid");
    router.push("/pages/Pelaksanaan-Perwalian");
  }
}, [id, router]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState({ pesan: "" });
  const [file, setFile] = useState(null);

const loadData = useCallback(async () => {
  if (!id) return;
  try {
    setLoading(true);
    const res = await fetchData(
      `${API_LINK}Perwalian/Detail/${id}`,
      {},
      "GET"
    );

    setData({
      IdPerwalian: res.idPerwalian,
      IdMahasiswa: res.idMahasiswa,
      NamaMahasiswa: res.namaMahasiswa,
      IdDosen: res.idDosen,
      NamaDosen: res.namaDosen,
      Subjek: res.subjek,
      Status: res.status,
      Details: res.details?.map(d => ({
        IdDetail: d.idDetail,
        Pesan: d.pesan,
        Status: d.status,
        Berkas: d.berkas
      })) ?? []
    });

  } catch (err) {
    Toast.error("Gagal memuat data perwalian");
  } finally {
    setLoading(false);
  }
}, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const downloadFile = async (fileName) => {
    try {
      const res = await fetch(
        `${API_LINK}Perwalian/Download/${encodeURIComponent(fileName)}`
      );

      if (!res.ok) throw new Error("Gagal mengunduh file");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();

      URL.revokeObjectURL(url);
    } catch {
      Toast.error("Gagal mengunduh file");
    }
  };

  const handleAddDetail = async (e) => {
    e.preventDefault();

    if (!detail.pesan || detail.pesan === "<p><br></p>") {
      return Swal({
        title: "Pesan kosong",
        text: "Silakan isi pesan terlebih dahulu",
        icon: "warning",
      });
    }

    try {
      setLoading(true);

      const token = Cookies.get("jwtToken");
      if (!token) throw new Error("Token tidak ditemukan");

      const formData = new FormData();
      formData.append("IdPerwalian", data.IdPerwalian);
      formData.append("Pesan", detail.pesan);
      if (file) formData.append("File", file);

      const res = await fetch(`${API_LINK}Perwalian/AddDetail`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      await Swal({
        title: "Berhasil!",
        text: "Pesan perwalian berhasil ditambahkan.",
        icon: "success",
      });

      setDetail({ pesan: "" });
      setFile(null);
      loadData();
    } catch (err) {
      Swal({
        title: "Gagal!",
        text: "Gagal menambahkan pesan",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Loading loading={loading} message="Memuat data perwalian..." />

      <MainContent
        layout="Admin"
        title="Detail Pelaksanaan Perwalian"
        breadcrumb={[
          { label: "Beranda", href: "/sample" },
          { label: "Perwalian" },
          {
            label: "Pelaksanaan Perwalian",
            href: "/pages/Pelaksanaan-Perwalian",
          },
          { label: "Detail" },
        ]}
      >
        {data && (
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4">

              <div className="mb-4">
                <h5 className="text-primary mb-3 border-bottom pb-2">
                  Informasi Perwalian
                </h5>
                <div className="row">
                  <DetailItem
                    label="Mahasiswa"
                    value={`${data.IdMahasiswa} - ${data.NamaMahasiswa}`}
                  />
                    <DetailItem
                      label="Dosen Wali"
                      value={data.NamaDosen}
                    />
                  <DetailItem label="Subjek" value={data.Subjek} />
                  <DetailItem
                    label="Status"
                    value={<Badge status={data.Status} />}
                  />
                </div>
              </div>

        <div className="mb-4">
          <h5 className="text-primary mb-3 border-bottom pb-2">
            Riwayat Pesan
          </h5>

          {data.Details?.length === 0 ? (
            <div className="text-muted">Belum ada pesan.</div>
          ) : (
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
          <tr>
            <th
              className="text-center align-middle pt-2 fw-bold small"
              style={{ width: 60, color: "var(--bs-primary)" }}
            >
              No
            </th>
            <th
              className="align-middle pt-2 fw-bold small"
              style={{ color: "var(--bs-primary)" }}
            >
              Pesan
            </th>
            <th
              className="align-middle pt-2 fw-bold small"
              style={{ color: "var(--bs-primary)" }}
            >
              Status
            </th>
            <th
              className="align-middle pt-2 fw-bold small"
              style={{ color: "var(--bs-primary)" }}
            >
              File
            </th>
          </tr>
        </thead>
          <tbody>
            {data.Details.map((d, i) => (
              <tr key={d.IdDetail}>
                <td className="text-center align-middle">
                  {i + 1}
                </td>
                <td
                  dangerouslySetInnerHTML={{ __html: d.Pesan }}
                />
                <td>
                  <Badge status={d.Status} />
                </td>
                <td>
                  {d.Berkas ? (
                    <button
                      type="button"
                      className="btn btn-link p-0 fw-semibold text-primary"
                      onClick={() =>
                        downloadFile(d.Berkas.split("\\").pop())
                      }
                    >
                      {d.Berkas.split("\\").pop()}
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
</div>

              <form onSubmit={handleAddDetail}>
                <Editor
                  label="Pesan"
                  value={detail.pesan}
                  onChange={(e) =>
                    setDetail((p) => ({ ...p, pesan: e.target.value }))
                  }
                />

                <label htmlFor="uploadFile" className="fw-semibold">
                  Upload File
                </label>
                <input
                  id="uploadFile"
                  type="file"
                  className="form-control"
                  onChange={(e) => setFile(e.target.files[0])}
                />

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
        )}
      </MainContent>
    </>
  );
}

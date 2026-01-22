"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import PropTypes from "prop-types";
import MainContent from "@/components/layout/MainContent";
import Card from "@/components/common/Card";
import Toast from "@/components/common/Toast";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";

const DetailItem = ({ label, value }) => (
  <div className="col-lg-4 mb-3">
    <div className="detail-item">
      <small className="text-muted d-block mb-1">
        <strong>{label}</strong>
      </small>
      {value !== null && value !== undefined && value !== "" ? value : "-"}
    </div>
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

export default function DetailJamMinusPlusPage() {
  const path = useParams();
  const router = useRouter();
  const encryptedId = path.id;

  const [pageLoading, setPageLoading] = useState(true);
  const [mahasiswa, setMahasiswa] = useState({
    MahasiswaId: "",
    Nama: "",
    Prodi: "",
    Kelas: "",
    detailTotals: {
      totalMinus1: 0,
      totalPlus1: 0,
      totalMinus2: 0,
      totalPlus2: 0,
    },
    overallTotals: {
      totalMinus1: 0,
      totalPlus1: 0,
      totalMinus2: 0,
      totalPlus2: 0,
    },
  });

  const [detailData, setDetailData] = useState([]);

  const loadDetailData = useCallback(async () => {
    if (!encryptedId) {
      Toast.error("ID mahasiswa tidak valid.");
      setPageLoading(false);
      router.back();
      return;
    }

    const id = decryptIdUrl(encryptedId);

    if (!id) {
      Toast.error("ID mahasiswa tidak dapat didekripsi.");
      setPageLoading(false);
      router.back();
      return;
    }

    try {
      setPageLoading(true);

      const responseDetail = await fetchData(
        `/api/JamMinusPlus/Detail/${id}`,
        {},
        "GET"
      );

      const responseMahasiswa = await fetchData(
        `/api/JamMinusPlus/Mahasiswa/${id}`,
        {},
        "GET"
      );

      setDetailData(Array.isArray(responseDetail) ? responseDetail : []);

      setMahasiswa({
        MahasiswaId: id || "",
        Nama: responseMahasiswa?.nama || "",
        Prodi: responseMahasiswa?.prodi || "",
        Kelas: responseMahasiswa?.kelas || "",
        detailTotals: {
          totalMinus1: 0,
          totalPlus1: 0,
          totalMinus2: 0,
          totalPlus2: 0,
        },
        overallTotals: {
          totalMinus1: 0,
          totalPlus1: 0,
          totalMinus2: 0,
          totalPlus2: 0,
        },
      });
    } catch {
      Toast.error("Gagal memuat data detail");
    } finally {
      setPageLoading(false);
    }
  }, [encryptedId, router]);

  useEffect(() => {
    loadDetailData();
  }, [loadDetailData]);

  const stripHtml = (text = "") => {
    if (!text) return "-";
    
    let decoded = text;
    
    for (let i = 0; i < 3; i++) {
      decoded = decoded
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", '"')
        .replaceAll("&nbsp;", " ");
    }
    
    decoded = decoded
      .replaceAll(/<[^>]*>/g, "")
      .replaceAll(/\s+/g, " ")
      .trim();
    
    return decoded || "-";
  };

  const cleanHtmlText = (html) => {
    return stripHtml(html);
  };

  const renderTableRows = () => {
    const rows = [];
    let no = 1;

    detailData.forEach((periode) => {
      rows.push(
        <tr key={`header-${periode.tahunAkademik}`}>
          <td colSpan={7} className="text-center fw-bold bg-light">
            Tahun Akademik {periode.tahunAkademik}
          </td>
        </tr>
      );

      (periode.history || []).forEach((item, idx) => {
        rows.push(
          <tr key={`${periode.tahunAkademik}-${idx}`}>
            <td className="text-center">{no++}</td>
            <td className="text-center">{item.tanggal || ""}</td>
            <td className="text-start">
              {cleanHtmlText(item.keterangan)}
            </td>
            <td className="text-center">{item.kompensasiMinus ?? 0}</td>
            <td className="text-center">{item.kompensasiPlus ?? 0}</td>
            <td className="text-center">{item.murniMinus ?? 0}</td>
            <td className="text-center">{item.murniPlus ?? 0}</td>
          </tr>
        );
      });

      rows.push(
        <tr
          key={`subtotal-${periode.tahunAkademik}`}
          className="fw-bold bg-light"
        >
          <td colSpan={3} className="text-end">
            Sub Total
          </td>
          <td className="text-center">
            {periode.summary?.subTotalKompensasi ?? 0}
          </td>
          <td className="text-center">
            {periode.summary?.subTotalKompensasi ?? 0}
          </td>
          <td className="text-center">
            {periode.summary?.subTotalMurni ?? 0}
          </td>
          <td className="text-center">
            {periode.summary?.subTotalMurni ?? 0}
          </td>
        </tr>,
        <tr key={`total-${periode.tahunAkademik}`} className="fw-bold">
          <td colSpan={3} className="text-end">
            Total
          </td>
          <td className="text-center">{periode.summary?.total ?? 0}</td>
          <td className="text-center">{periode.summary?.total ?? 0}</td>
          <td className="text-center">0</td>
          <td className="text-center">0</td>
        </tr>
      );
    });

    return rows;
  };

  const handleBack = useCallback(() => {
    router.push("/pages/evaluasi/jam-minus-vs-jam-plus");
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={pageLoading}
      title="Detail Jam Minus vs Jam Plus"
      breadcrumb={[
        { label: "Sistem Informasi Akademik", href: "/" },
        { label: "Evaluasi" },
        { label: "Detail" },
      ]}
    >
      <div className="container-fluid">
        <Card title="Detail Jam Minus Vs Jam Plus">
          <div className="row g-3 align-items-center mb-3">
            <DetailItem label="NIM" value={mahasiswa.MahasiswaId} />
            <DetailItem label="Nama" value={mahasiswa.Nama} />
            <DetailItem label="Program Studi" value={mahasiswa.Prodi} />
            <DetailItem label="Kelas" value={mahasiswa.Kelas} />
          </div>
        </Card>

        <div className="row g-3 mt-3">
          <div className="col-12">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th rowSpan={2} className="text-center text-primary">
                    No.
                  </th>
                  <th rowSpan={2} className="text-center text-primary">
                    Tanggal
                  </th>
                  <th rowSpan={2} className="text-start text-primary">
                    Deskripsi
                  </th>
                  <th colSpan={2} className="text-center text-primary">
                    Kompensasi
                  </th>
                  <th colSpan={2} className="text-center text-primary">
                    Murni/Lainnya
                  </th>
                </tr>
                <tr>
                  <th className="text-center text-primary">Minus</th>
                  <th className="text-center text-primary">Plus</th>
                  <th className="text-center text-primary">Minus</th>
                  <th className="text-center text-primary">Plus</th>
                </tr>
              </thead>
              <tbody>
                {detailData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      Tidak ada data.
                    </td>
                  </tr>
                ) : (
                  renderTableRows()
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <button className="btn btn-secondary" onClick={handleBack}>
            Kembali
          </button>
        </div>
      </div>
    </MainContent>
  );
}
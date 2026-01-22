"use client";

import { useEffect, useState, useCallback } from "react";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import Table from "@/components/common/Table";
import Paging from "@/components/common/Paging";
import Swal from "@/components/common/SweetAlert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Cookies from "js-cookie";
import Loading from "@/components/common/Loading";
import DropDown from "@/components/common/Dropdown";
import { encryptIdUrl } from "@/lib/encryptor";

const API = "http://localhost:5234";

function decodeJwt(token) {
  if (!token) return {};
  try {
    const base64Url = token.split(".")[1];
    const jsonPayload = atob(
      base64Url.replaceAll("-", "+").replaceAll("_", "/")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return {};
  }
}

export default function PagePelaksanaanPerwalian() {
  const [data, setData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  let roleId = "";
  let namaAkun = "";
  let appId = "";

  if (typeof globalThis !== "undefined") {
    const token = Cookies.get("jwtToken");
    const jwt = decodeJwt(token || "");

    roleId = jwt.idrole || "";
    namaAkun = jwt.namaakun || "";
    appId = jwt.idapp || "";
  }

  const canCreate = ["ROL25", "ROL22", "ROL27"].includes(roleId);
  const canEdit = ["ROL25", "ROL22"].includes(roleId);
  const canDelete = ["ROL25", "ROL22"].includes(roleId);

  const loadData = useCallback(async () => {
    const startTime = Date.now();

    try {
      setLoading(true);
      const token = Cookies.get("jwtToken") || "";

      const res = await fetch(
        `${API}/api/Perwalian/GetAll?urut=pelaksanaan_perwalian_desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            IdRole: roleId,
            NamaAkun: namaAkun,
            IdApp: appId,
          },
        }
      );

      if (!res.ok) throw new Error("Gagal mengambil data perwalian");

      const json = await res.json();

setData(
  json.data?.map((item) => ({
    id: item.idPerwalian,

    mahasiswa: `${item.idMahasiswa} - ${item.namaMahasiswa}`,
    dosen: item.namaDosen,

    subjek: item.subjek,
    status:
      item.status === "ACTIVE" || item.status === "Aktif"
        ? "Aktif"
        : "Tidak Aktif",

    detailCount: item.details?.length ?? 0,
  })) || []
);

    } catch (err) {
      Swal.fire("Error", "Gagal memuat data perwalian", "error");
    } finally {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 2000 - elapsed);
      setTimeout(() => setLoading(false), delay);
    }
  }, [roleId, namaAkun, appId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(
    async (id) => {
      if (!canDelete) return;

      const confirm = await Swal({
        title: "Konfirmasi Hapus",
        text: "Apakah Anda yakin ingin menonaktifkan data perwalian?",
        icon: "warning",
        confirmText: "Ya",
        cancelText: "Batal",
      });

      if (!confirm) return;

      const startTime = Date.now();

      try {
        setLoading(true);
        const token = Cookies.get("jwtToken") || "";

        const res = await fetch(`${API}/api/Perwalian/Delete/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok && res.status !== 404)
          throw new Error("Gagal menghapus data");

        await Swal({
          title: "Berhasil",
          text: "Data perwalian berhasil dinonaktifkan",
          icon: "success",
        });

        await loadData();
      } catch (err) {
        Swal.fire("Error", "Terjadi kesalahan server", "error");
      } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 2000 - elapsed);
        setTimeout(() => setLoading(false), delay);
      }
    },
    [canDelete, loadData]
  );

  const handleExport = () => {
    try {
      const exportData = data.map((item) => ({
        "Mahasiswa (NIM)": item.mahasiswa,
        "Dosen Wali": item.dosen,
        Subjek: item.subjek,
        Status: item.status,
        "Jumlah Pesan": item.detailCount,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Perwalian");

      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Perwalian.xlsx"
      );
    } catch (err) {
      Swal.fire("Error", "Gagal export data", "error");
    }
  };

  const filtered = data.filter((row) => {
    const k = keyword.toLowerCase();
    if (status && row.status !== status) return false;

    return (
      row.mahasiswa?.toString().toLowerCase().includes(k) ||
      row.dosen?.toString().toLowerCase().includes(k) ||
      row.subjek?.toLowerCase().includes(k)
    );
  });

  const pagedData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const tableData = pagedData.map((row, idx) => ({
    No: (page - 1) * pageSize + idx + 1,
    "Mahasiswa (NIM)": row.mahasiswa,
    "Dosen Wali": row.dosen,
    Subjek: row.subjek,
    Status: row.status,
    Detail: `${row.detailCount} pesan`,
    Aksi: [
      "Detail",
      ...(canEdit ? ["Edit"] : []),
      ...(canDelete ? ["Delete"] : []),
    ],
    id: row.id,

      Alignment: {
    No: "center",
    Status: "center",
    Detail: "center",
    Aksi: "center",

    "Mahasiswa (NIM)": "left",
    "Dosen Wali": "left",
    Subjek: "left",
  },
  }));

  return (
    <>

    <style jsx global>{`
      .perwalian-table td {
      text-align: left;
    }

    .perwalian-table td:nth-child(1) {
      text-align: center;
    }

    .perwalian-table td:nth-child(5) {
      text-align: center;
    }

    .perwalian-table td:nth-child(6) {
      text-align: center;
    }

    .perwalian-table td:nth-child(7) {
      text-align: center;
    }

    `}</style>

      <Loading loading={loading} message="Memuat data..." />

      <MainContent
        layout="Admin"
        title="Pelaksanaan Perwalian"
        breadcrumb={[
          { label: "Beranda", href: "/sample" },
          { label: "Perwalian" },
          { label: "Pelaksanaan Perwalian" },
        ]}
      >
        <Formsearch
          onSearch={setKeyword}
          onAdd={() =>
            canCreate &&
            (globalThis.location.href =
              "/pages/Pelaksanaan-Perwalian/add")
          }
          onFilter={() => {
            setStatus(pendingStatus);
            setPage(1);
          }}
          onExport={handleExport}
          addButtonText="Tambah"
          searchPlaceholder="Cari perwalian"
          showAddButton={canCreate}
          showExportButton
          showFilterButton
          filterContent={
            <DropDown
              label="Status"
              type="semua"
              forInput="status"
              arrData={[
                { Value: "Aktif", Text: "Aktif" },
                { Value: "Tidak Aktif", Text: "Tidak Aktif" },
              ]}
              value={pendingStatus}
              onChange={(e) => setPendingStatus(e.target.value)}
            />
          }
        />

        <div className="perwalian-table">
        <Table
          data={tableData}
          onDetail={(id) =>
            (globalThis.location.href =
              `/pages/Pelaksanaan-Perwalian/detail/${encryptIdUrl(id)}`)
          }
          onEdit={(id) =>
            canEdit &&
            (globalThis.location.href =
              `/pages/Pelaksanaan-Perwalian/edit/${encryptIdUrl(id)}`)
          }
          onDelete={handleDelete}
        />
        </div>

        <Paging
          pageCurrent={page}
          pageSize={pageSize}
          totalData={filtered.length}
          navigation={setPage}
        />
      </MainContent>
    </>
  );
}
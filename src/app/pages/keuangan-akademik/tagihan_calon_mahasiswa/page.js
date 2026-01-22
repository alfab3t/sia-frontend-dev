"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Paging from "@/components/common/Paging";
import Table from "@/components/common/Table";
import Toast from "@/components/common/Toast";
import DropDown from "@/components/common/Dropdown";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { getSSOData, getUserData } from "@/context/user";
import axios from "axios";
import Cookies from "js-cookie";

export default function TagihanCalonMahasiswaPage() {
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const router = useRouter();
  const [dataTagihan, setDataTagihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const sortRef = useRef();
  const prodiRef = useRef();
  const angkatanRef = useRef();
  const statusRef = useRef();
  const [isClient, setIsClient] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("[No. Daftar] desc");
  const [filterProdi, setFilterProdi] = useState("");
  const [filterAngkatan, setFilterAngkatan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dataFilterProdi, setDataFilterProdi] = useState([]);
  const [dataFilterAngkatan, setDataFilterAngkatan] = useState([]);

  const dataFilterSort = useMemo(
    () => [
      { Value: "[No. Daftar] asc", Text: "No. Daftar [↑]" },
      { Value: "[No. Daftar] desc", Text: "No. Daftar [↓]" },
      { Value: "[Nama] asc", Text: "Nama [↑]" },
      { Value: "[Nama] desc", Text: "Nama [↓]" },
      { Value: "[Total Tagihan] asc", Text: "Total Tagihan [↑]" },
      { Value: "[Total Tagihan] desc", Text: "Total Tagihan [↓]" },
      { Value: "[Total Pembayaran] asc", Text: "Total Pembayaran [↑]" },
      { Value: "[Total Pembayaran] desc", Text: "Total Pembayaran [↓]" },
      { Value: "[Sisa Tagihan] asc", Text: "Sisa Tagihan [↑]" },
      { Value: "[Sisa Tagihan] desc", Text: "Sisa Tagihan [↓]" },
    ],
    [],
  );

  const dataFilterStatus = useMemo(
    () => [
      { Value: "Sudah Lunas", Text: "Sudah Lunas" },
      { Value: "Belum Lunas", Text: "Belum Lunas" },
      { Value: "Dihapus", Text: "Dihapus" },
    ],
    [],
  );

  const formatRupiah = useCallback((number) => {
    if (!number) return "0";
    return Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(number);
  }, []);

  const fetchProdi = useCallback(async () => {
    try {
      const response = await fetchData(
        API_LINK + "TagihanCalonMahasiswa/GetListProdi",
        {},
        "GET",
      );

      if (response.error) throw new Error(response.message);

      const prodiOptions = response.data.map((item) => ({
        Value: item.Value,
        Text: item.Text,
      }));

      setDataFilterProdi(prodiOptions);
    } catch (err) {
      Toast.error(err.message);
    }
  }, []);

  const fetchAngkatan = useCallback(async () => {
    try {
      const response = await fetchData(
        API_LINK + "TagihanCalonMahasiswa/GetListAngkatan",
        {},
        "GET",
      );

      if (response.error) throw new Error(response.message);

      const angkatanOptions = response.data.map((item) => ({
        Value: item.Value,
        Text: item.Text,
      }));

      setDataFilterAngkatan(angkatanOptions);
    } catch (err) {
      Toast.error(err.message);
    }
  }, []);

  const loadData = useCallback(
    async (page, sort, cari, prodi, angkatan, status) => {
      setLoading(true);
      setDataTagihan([]);

      try {
        const params = {
          Keyword: cari || "",
          PageNumber: page,
          PageSize: pageSize,
          Prodi: prodi || "",
          Angkatan: angkatan || "",
          Status: status || "",
          Urut: sort || "[No. Daftar] desc",
        };

        const response = await fetchData(
          API_LINK + "TagihanCalonMahasiswa/GetAllTagihanCalonMahasiswa",
          params,
          "GET",
        );

        if (response.error) {
          throw new Error(response.message);
        }

        const data = response.data;
        const totalData = response.totalData;

        if (!data || !Array.isArray(data)) {
          throw new Error("Format response tidak valid");
        }

        const pagedData = data.map((item, index) => ({
          Key: `${item.nim || item.NIM}-${index}`,
          No: (page - 1) * pageSize + index + 1,
          "No. Daftar": item.nim || "-",
          Nama: item.nama || "-",
          Prodi: item.prodi || "-",
          Angkatan: item.angkatan || "-",
          "Jalur Daftar": item.jalurMasuk || "-",
          "Total Tagihan (Rp)": formatRupiah(item.totalTagihan),
          "Total Pembayaran (Rp)": formatRupiah(item.totalPembayaran),
          "Sisa Tagihan (Rp)":
            item.sisaTagihan < 0
              ? `(${formatRupiah(Math.abs(item.sisaTagihan))})`
              : formatRupiah(item.sisaTagihan),
          Alignment: [
            "center",
            "center",
            "left",
            "center",
            "center",
            "center",
            "right",
            "right",
            "right",
          ],
        }));

        setDataTagihan(pagedData || []);
        setTotalData(totalData || 0);
        setCurrentPage(page);
      } catch (err) {
        Toast.error("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, formatRupiah],
  );

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      setCurrentPage(1);
      loadData(1, sortBy, query, filterProdi, filterAngkatan, filterStatus);
    },
    [sortBy, filterProdi, filterAngkatan, filterStatus, loadData],
  );

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    const newProdi = prodiRef.current.value;
    const newAngkatan = angkatanRef.current.value;
    const newStatus = statusRef.current.value;

    setSortBy(newSortBy);
    setFilterProdi(newProdi);
    setFilterAngkatan(newAngkatan);
    setFilterStatus(newStatus);
    setCurrentPage(1);
    loadData(1, newSortBy, search, newProdi, newAngkatan, newStatus);
  }, [search, loadData]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(page, sortBy, search, filterProdi, filterAngkatan, filterStatus);
    },
    [sortBy, search, filterProdi, filterAngkatan, filterStatus, loadData],
  );

  const handleExport = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        Keyword: search || "",
        Prodi: filterProdi || "",
        Angkatan: filterAngkatan || "",
        Status: filterStatus || "",
        Urut: sortBy || "[No. Daftar] desc",
      };

      const token = Cookies.get("jwtToken");

      const response = await axios.get(
        API_LINK + "TagihanCalonMahasiswa/ExportTagihanCalonMahasiswa",
        {
          params: params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        },
      );

      const url = globalThis.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.download = `Tagihan_Calon_Mahasiswa_${Date.now()}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();
      globalThis.URL.revokeObjectURL(url);

      Toast.success("Data berhasil diexport.");
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const errorJson = JSON.parse(errorText);
          Toast.error(errorJson.message || "Gagal export data");
        } catch {
          Toast.error("Terjadi kesalahan server saat export.");
        }
      } else {
        Toast.error(err.message || "Gagal menghubungi server");
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterProdi, filterAngkatan, filterStatus, sortBy]);
  useEffect(() => {
    setIsClient(true);

    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("./auth/login");
      return;
    }

    const initializeData = async () => {
      fetchProdi();
      fetchAngkatan();
      loadData(1, sortBy, search, filterProdi, filterAngkatan, filterStatus);
    };

    initializeData();
  }, [
    ssoData,
    router,
    fetchProdi,
    fetchAngkatan,
    loadData,
    sortBy,
    search,
    filterProdi,
    filterAngkatan,
    filterStatus,
  ]);

  const filterContent = useMemo(
    () => (
      <>
        <DropDown
          ref={sortRef}
          arrData={dataFilterSort}
          type="pilih"
          label="Urut Berdasarkan"
          forInput="sortBy"
          defaultValue={sortBy}
        />
        <DropDown
          ref={prodiRef}
          arrData={dataFilterProdi}
          type="semua"
          label="Program Studi"
          forInput="filterProdi"
          defaultValue={filterProdi}
        />
        <DropDown
          ref={angkatanRef}
          arrData={dataFilterAngkatan}
          type="semua"
          label="Angkatan"
          forInput="filterAngkatan"
          defaultValue={filterAngkatan}
        />
        <DropDown
          ref={statusRef}
          arrData={dataFilterStatus}
          type="semua"
          label="Status Pembayaran"
          forInput="filterStatus"
          defaultValue={filterStatus}
        />
      </>
    ),
    [
      sortBy,
      filterProdi,
      filterAngkatan,
      filterStatus,
      dataFilterSort,
      dataFilterProdi,
      dataFilterAngkatan,
      dataFilterStatus,
    ],
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Tagihan Calon Mahasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Keuangan" },
        { label: "Tagihan Calon Mahasiswa" },
      ]}
    >
      <div>
        <Formsearch
          onSearch={handleSearch}
          onFilter={handleFilterApply}
          onExport={handleExport}
          showAddButton={false}
          showExportButton={
            isClient &&
            userData?.permission?.includes("tagihan_calon_mahasiswa.export")
          }
          searchPlaceholder="Cari no. daftar atau nama calon mahasiswa"
          exportButtonText="Export"
          filterContent={filterContent}
        />
      </div>
      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table data={dataTagihan} />
          {totalData > 0 && (
            <Paging
              pageSize={pageSize}
              pageCurrent={currentPage}
              totalData={totalData}
              navigation={handleNavigation}
            />
          )}
        </div>
      </div>
    </MainContent>
  );
}

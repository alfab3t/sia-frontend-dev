"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import Table from "@/components/common/Table";
import Paging from "@/components/common/Paging";
import Formsearch from "@/components/common/Formsearch";
import Toast from "@/components/common/Toast";
import DropDown from "@/components/common/Dropdown";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { getSSOData } from "@/context/user"; 
import { encryptIdUrl } from "@/lib/encryptor";
import Cookies from "js-cookie";
import axios from "axios";

export default function JamMinusPlusPage() {
  const ssoData = useMemo(() => getSSOData(), []);
  const router = useRouter();

  const [dataList, setDataList] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noDataMessage, setNoDataMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedSort, setSelectedSort] = useState("mhs_id asc");

  const tahunInput = "2025/2026";
  const selectedSemester = "Ganjil";

  const dataFilterSort = [
    { Value: "mhs_id asc", Text: "NIM [↑]" },
    { Value: "mhs_id desc", Text: "NIM [↓]" },
    { Value: "SisaMurni asc", Text: "Jam Minus Murni [↑]" },
    { Value: "SisaMurni desc", Text: "Jam Minus Murni [↓]" },
    { Value: "SisaKompensasi asc", Text: "Jam Minus Kompensasi [↑]" },
    { Value: "SisaKompensasi desc", Text: "Jam Minus Kompensasi [↓]" },
  ];

  const getRowClassName = useCallback((row, listData) => {
    const sisaMurni = Number.parseInt(row["Sisa Minus Murni"]) || 0;
    const sisaKompensasi = Number.parseInt(row["Sisa Minus Kompensasi"]) || 0;

    if (sisaMurni < -40 || sisaKompensasi < -40) {
      return "table-danger"; 
    }

    return ""; 
  }, []);

  const loadData = useCallback(
    async (page, cari, sort) => {
      try {
        setLoading(true);
        setNoDataMessage("");

        const params = {
          Page: page,
          PageSize: pageSize,
          TahunAkademik: tahunInput,
          Semester: selectedSemester,
          Sort: sort,
        };

        if (cari !== "") {
          params.Keyword = cari;
        }

        const response = await fetchData(
          API_LINK + "JamMinusPlus/GetAll",
          params,
          "GET"
        );

        if (response.error) throw new Error(response.message);

        const { listData, totalData } = response;

        if (totalData === 0) {
          setNoDataMessage(`Tidak ada data untuk tahun akademik ${tahunInput} dan semester ${selectedSemester}.`);
          setDataList([]);
          setTotalData(0);
          setCurrentPage(1);
          return;
        }

        const pagedData = listData.map((row, index) => ({
          id: row.mahasiswaId,
          No: (page - 1) * pageSize + index + 1,
          NIM: row.mahasiswaId || "-",
          Nama: row.nama || "-",
          Prodi: row.prodi || "-",
          Tahun: row.tahunAkademik || "-",
          Semester: row.semester || "-",
          Kelas: row.kelas || "-",
          "Sisa Minus Kompensasi": row.sisaKompensasi || "0",
          "Sisa Minus Murni": row.sisaMurni || "0",
          Aksi: ["Detail"],
          Alignment: [
            "center", "center", "left", "left", "center",
            "center", "center", "center", "center", "center"
          ],
        }));

        setDataList(pagedData || []);
        setTotalData(totalData || 0);
        setCurrentPage(page);
      } catch {
        Toast.error("Gagal memuat data");
        setDataList([]);
        setTotalData(0);
        setNoDataMessage("Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    },
    [pageSize, tahunInput, selectedSemester]
  );

  const handleSearch = useCallback((query) => {
    setSearch(query);
    setCurrentPage(1);
    loadData(1, query, selectedSort);
  }, [selectedSort, loadData]);

  const handleFilterApply = useCallback(() => {
    setCurrentPage(1);
    loadData(1, search, selectedSort);
  }, [search, selectedSort, loadData]);

  const handleNavigation = useCallback((page) => {
    loadData(page, search, selectedSort);
  }, [search, selectedSort, loadData]);

  const handleDetail = (row) => {
    const MahasiswaId = row;
    if (!MahasiswaId || MahasiswaId === "-") {
      Toast.error("ID mahasiswa tidak valid.");
      return;
    }

    const encryptedId = encryptIdUrl(MahasiswaId);
    
    const query = new URLSearchParams({
      tahun: tahunInput,
      semester: selectedSemester,
    }).toString();

    router.push(`/pages/evaluasi/jam-minus-vs-jam-plus/detail/${encryptedId}?${query}`);
  };

  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        TahunAkademik: tahunInput,
        Semester: selectedSemester,
        Keyword: search,
        Sort: selectedSort,
        Page: "1",
        PageSize: "999999",
      });

      const jwtToken = Cookies.get("jwtToken");
      
      const response = await axios.get(`${API_LINK}JamMinusPlus/ExportExcel?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Data_Jam_Minus_Plus_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);

      Toast.success("Export berhasil diunduh");
    } catch {
      Toast.error("Gagal Export Excel");
    }
  }, [tahunInput, selectedSemester, search, selectedSort]);

  useEffect(() => {
    if (!ssoData) {
      router.push("/auth/login");
      return;
    }
    loadData(1, search, selectedSort);
  }, [ssoData, router]);

  const filterContent = (
    <DropDown
      arrData={dataFilterSort}
      type="pilih"
      label="Urutkan Berdasarkan"
      forInput="filterSort"
      value={selectedSort}
      onChange={(e) => setSelectedSort(e.target.value)}
    />
  ); 

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Evaluasi Jam Minus Plus"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Administrasi Akademik" },
        { label: "Jam Minus Plus" },
      ]}
    >
      <Formsearch
        onSearch={handleSearch}
        onFilter={handleFilterApply}
        onExport={handleExport}
        showExportButton={isClient && userData?.permission?.includes("jamminusplus.export")}
        filterContent={filterContent}
        searchPlaceholder="Pencarian"
        showAddButton={false}
      />

      <div className="row mt-3">
        <div className="col-12">
          {noDataMessage ? (
            <div className="alert alert-info text-center">
              {noDataMessage}
            </div>
          ) : (
            <>
              <Table
                data={dataList}
                onDetail={handleDetail}
                rowClassName={(row) => getRowClassName(row, dataList)}
              />
              {totalData > 0 && (
                <Paging
                  pageSize={pageSize}
                  pageCurrent={currentPage}
                  totalData={totalData}
                  navigation={handleNavigation}
                />
              )}
            </>
          )}
        </div>
      </div>
    </MainContent>
  );
}
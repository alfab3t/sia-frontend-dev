"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Paging from "@/components/common/Paging";
import Table from "@/components/common/Table";
import Toast from "@/components/common/Toast";
import DropDown from "@/components/common/Dropdown";
import Calendar from "@/components/common/Calendar";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import Icon from "@/components/common/Icon";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { getSSOData } from "@/context/user";
import { formatDateLong } from "@/lib/dateFormater";
import axios from "axios";
import Cookies from "js-cookie";

export default function RiwayatPembukuan() {
  const ssoData = useMemo(() => getSSOData(), []);
  const router = useRouter();

  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);

  const sortRef = useRef();
  const prodiRef = useRef();
  const tahunAjaranRef = useRef();

  const dataFilterSort = useMemo(
    () => [
      { Value: "[Waktu Penerimaan] asc", Text: "Waktu Penerimaan [↑]" },
      { Value: "[Waktu Penerimaan] desc", Text: "Waktu Penerimaan [↓]" },
      { Value: "[NIM] asc", Text: "NIM [↑]" },
      { Value: "[NIM] desc", Text: "NIM [↓]" },
      { Value: "[Nama] asc", Text: "Nama [↑]" },
      { Value: "[Nama] desc", Text: "Nama [↓]" },
    ],
    [],
  );

  const [dataProdi, setDataProdi] = useState([]);
  const [dataTahunAjaran, setDataTahunAjaran] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("");
  const [dateRange, setDateRange] = useState([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    new Date(),
  ]);

  const formatRupiah = useCallback((number) => {
    if (!number) return "0";
    return Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(number);
  }, []);

  const tableConfig = useMemo(
    () => ({
      widths: {
        Keterangan: "30%",
      },
      isWrap: {
        Keterangan: true,
      },
    }),
    [],
  );

  const loadDropdownData = useCallback(async () => {
    try {
      let activeTahun = null;
      try {
        const activeResponse = await fetchData(
          API_LINK + "PengembalianDanaTitipan/GetActiveTahunAkademik",
          {},
          "GET",
        );
        if (activeResponse?.success && activeResponse?.data) {
          activeTahun = activeResponse.data;
        }
      } catch (err) {
        Toast.error("Gagal ambil tahun aktif:", err.message);
      }

      const [prodiResponse, tahunResponse] = await Promise.all([
        fetchData(API_LINK + "RiwayatPembukuan/GetListProdi", {}, "GET"),
        fetchData(API_LINK + "RiwayatPembukuan/GetListTahunAjaran", {}, "GET"),
      ]);

      let prodiData = null;
      if (Array.isArray(prodiResponse)) {
        prodiData = prodiResponse;
      } else if (prodiResponse?.success && Array.isArray(prodiResponse.data)) {
        prodiData = prodiResponse.data;
      }
      if (prodiData) {
        setDataProdi(prodiData);
      }

      let tahunData = null;
      if (Array.isArray(tahunResponse)) {
        tahunData = tahunResponse;
      } else if (tahunResponse?.success && Array.isArray(tahunResponse.data)) {
        tahunData = tahunResponse.data;
      }
      if (tahunData) {
        if (activeTahun) {
          const filteredTahun = tahunData.filter((item) => {
            const valueToCheck = typeof item === "object" ? item.Value : item;
            return valueToCheck <= activeTahun;
          });
          setDataTahunAjaran(filteredTahun);
        } else {
          setDataTahunAjaran(tahunData);
        }
      }
    } catch (err) {
      Toast.error("Gagal memuat data filter: " + err.message);
    }
  }, []);

  const formatDateToString = useCallback((date) => {
    if (!date || !(date instanceof Date) || Number.isNaN(date)) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const loadData = useCallback(
    async (page, sort, cari, prodi, tahunAjaran, tanggalFrom, tanggalUntil) => {
      setLoading(true);
      setDataRiwayat([]);

      try {
        const params = {
          Keyword: cari || "",
          PageNumber: page,
          PageSize: pageSize,
          ProgramStudi: prodi || "",
          TahunAjaran: tahunAjaran || "",
          Urut: sort || "[Waktu Penerimaan] desc",
          TanggalMulai: formatDateToString(tanggalFrom),
          TanggalSampai: formatDateToString(tanggalUntil),
        };

        const response = await fetchData(
          API_LINK + "RiwayatPembukuan/GetAllRiwayatPembukuan",
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
          No: (page - 1) * pageSize + index + 1,
          id: item.id,
          "Virtual Account": item.virtualAccount || "-",
          Prodi: item.programStudi || "-",
          "No. Daftar/NIM": item.nim || "-",
          Nama: item.namaMahasiswa || "-",
          "Waktu Pembukuan": formatDateLong(item.tanggal),
          "Jumlah Penerimaan (Rp)": formatRupiah(item.jumlah),
          Keterangan: item.keterangan || "-",
          Alignment: [
            "center",
            "center",
            "center",
            "center",
            "left",
            "center",
            "right",
            "left",
          ],
        }));

        setDataRiwayat(pagedData || []);
        setTotalData(totalData || 0);
        setCurrentPage(page);
      } catch (err) {
        Toast.error("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [formatRupiah, pageSize, formatDateToString],
  );

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      setCurrentPage(1);
      loadData(
        1,
        sortBy,
        query,
        selectedProdi,
        selectedTahunAjaran,
        dateRange[0],
        dateRange[1],
      );
    },
    [sortBy, selectedProdi, selectedTahunAjaran, dateRange, loadData],
  );

  const validateDateRange = useCallback(() => {
    if (!dateRange[0] && !dateRange[1]) {
      return true;
    }

    if (!dateRange[0] || !dateRange[1]) {
      Toast.error(
        "Harap pilih tanggal mulai dan tanggal akhir, atau kosongkan keduanya.",
      );
      return false;
    }

    if (
      !(dateRange[0] instanceof Date) ||
      Number.isNaN(dateRange[0]) ||
      !(dateRange[1] instanceof Date) ||
      Number.isNaN(dateRange[1])
    ) {
      Toast.error(
        "Format tanggal tidak valid. Harap pilih tanggal melalui kalender.",
      );
      return false;
    }

    const minDate = new Date("1900-01-01");
    const maxDate = new Date("2999-12-31");

    if (
      dateRange[0] < minDate ||
      dateRange[0] > maxDate ||
      dateRange[1] < minDate ||
      dateRange[1] > maxDate
    ) {
      Toast.error("Tanggal harus antara 01 Januari 1900 dan 31 Desember 2999.");
      return false;
    }

    if (dateRange[0] > dateRange[1]) {
      Toast.error("Tanggal mulai tidak boleh lebih besar dari tanggal akhir.");
      return false;
    }

    return true;
  }, [dateRange]);

  const handleFilterApply = useCallback(() => {
    if (!validateDateRange()) {
      return;
    }

    const newSortBy = sortRef.current.value;
    const newProdi = prodiRef.current.value;
    const newTahunAjaran = tahunAjaranRef.current.value;

    setSortBy(newSortBy);
    setSelectedProdi(newProdi);
    setSelectedTahunAjaran(newTahunAjaran);
    setCurrentPage(1);
    loadData(
      1,
      newSortBy,
      search,
      newProdi,
      newTahunAjaran,
      dateRange[0],
      dateRange[1],
    );
  }, [search, dateRange, loadData, validateDateRange]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(
        page,
        sortBy,
        search,
        selectedProdi,
        selectedTahunAjaran,
        dateRange[0],
        dateRange[1],
      );
    },
    [sortBy, search, selectedProdi, selectedTahunAjaran, dateRange, loadData],
  );

  const handleClearDate = useCallback(() => {
    setDateRange([null, null]);
  }, []);

  const handleExport = useCallback(async () => {
    if (!validateDateRange()) {
      return;
    }

    try {
      setLoading(true);

      const params = {
        Keyword: search || "",
        ProgramStudi: selectedProdi || "",
        TahunAjaran: selectedTahunAjaran || "",
        Urut: sortBy || "[Waktu Penerimaan] desc",
        TanggalMulai: formatDateToString(dateRange[0]),
        TanggalSampai: formatDateToString(dateRange[1]),
      };

      const token = Cookies.get("jwtToken");

      const response = await axios.get(
        API_LINK + "RiwayatPembukuan/ExportRiwayatPembukuan",
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

      link.setAttribute(
        "download",
        `Data_Riwayat_Pembukuan_${Date.now()}.xlsx`,
      );

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
        Toast.error(err.message || "Gagal menghubungi server.");
      }
    } finally {
      setLoading(false);
    }
  }, [
    search,
    selectedProdi,
    selectedTahunAjaran,
    dateRange,
    sortBy,
    formatDateToString,
    validateDateRange,
  ]);

  useEffect(() => {
    if (!ssoData) {
      router.push("/auth/login");
      return;
    }

    const initializeData = async () => {
      await loadDropdownData();
      loadData(
        currentPage,
        sortBy,
        search,
        selectedProdi,
        selectedTahunAjaran,
        dateRange[0],
        dateRange[1],
      );
    };

    initializeData();
  }, [
    ssoData,
    router,
    loadDropdownData,
    loadData,
    currentPage,
    sortBy,
    search,
    selectedProdi,
    selectedTahunAjaran,
    dateRange,
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
          arrData={dataProdi}
          type="semua"
          label="Program Studi"
          forInput="prodi"
          defaultValue={selectedProdi}
        />
        <DropDown
          ref={tahunAjaranRef}
          arrData={dataTahunAjaran}
          type="semua"
          label="Tahun Akademik"
          forInput="tahunAjaran"
          defaultValue={selectedTahunAjaran}
        />
        <div className="mb-3">
          <label
            htmlFor="dateRange"
            className="form-label fw-bold text-primary small mb-1"
          >
            Tanggal
          </label>
          <div className="d-flex align-items-center gap-2">
            <div className="flex-grow-1 calendar-inline">
              <Calendar
                type="range"
                label=""
                forInput="dateRange"
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              style={{ padding: "4px 8px", lineHeight: 1 }}
              onClick={handleClearDate}
              title="Kosongkan filter tanggal"
              aria-label="Kosongkan filter tanggal"
            >
              <Icon name="trash" />
            </button>
          </div>
          <style>{`
            .calendar-inline .mb-2 {
              margin-bottom: 0 !important;
            }
            .calendar-inline label {
              display: none;
              margin: 0;
            }
          `}</style>
        </div>
      </>
    ),
    [
      sortBy,
      selectedProdi,
      selectedTahunAjaran,
      dataProdi,
      dataTahunAjaran,
      dataFilterSort,
      dateRange,
      handleClearDate,
    ],
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Riwayat Pembukuan"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Keuangan Akademik" },
        { label: "Riwayat Pembukuan" },
      ]}
    >
      <div>
        <Formsearch
          onSearch={handleSearch}
          onFilter={handleFilterApply}
          onExport={handleExport}
          showAddButton={false}
          showExportButton={true}
          searchPlaceholder="Cari data pembukuan"
          exportButtonText="Export"
          filterContent={filterContent}
        />
      </div>
      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table data={dataRiwayat} config={tableConfig} />
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

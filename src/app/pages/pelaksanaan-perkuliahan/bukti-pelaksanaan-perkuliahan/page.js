"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import Paging from "@/components/common/Paging";
import Table from "@/components/common/Table";
import DropDown from "@/components/common/Dropdown";
import Formsearch from "@/components/common/Formsearch";
import Input from "@/components/common/Input";

import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { getSSOData, getUserData } from "@/context/user";

export default function BuktiPelaksanaanPerkuliahanPage() {
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const [dataGrid, setDataGrid] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [listProdi, setListProdi] = useState([]);
  const [listSemester, setListSemester] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState("kode asc");
  const [filterTahun, setFilterTahun] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterProdi, setFilterProdi] = useState("");

  const dataFilterSort = [
    { Value: "kode asc", Text: "Kode - Nama Dosen [↑]" },
    { Value: "kode desc", Text: "Kode - Nama Dosen [↓]" },
    { Value: "kon_nama asc", Text: "Program Studi [↑]" },
    { Value: "kon_nama desc", Text: "Program Studi [↓]" },
  ];

  const handlePrintBuktiPelaksanaanPerkuliahanGabungan = useCallback((id) => {
    const url = `${API_LINK}BuktiPelaksanaanPerkuliahan/CetakLaporanGabungan/${id}`;
    window.open(url, "_blank");
  }, []);

  const handlePrintBuktiPelaksanaanPerkuliahanTerpisah = useCallback((id) => {
    const url = `${API_LINK}BuktiPelaksanaanPerkuliahan/CetakLaporanTerpisah/${id}`;
    window.open(url, "_blank");
  }, []);

  const loadData = useCallback(
    async (page, sort, cari, tahun, semester, prodi) => {
      try {
        setLoading(true);

        if (!tahun) {
          setLoading(false);
          return;
        }

        const idKonsentrasiParam = userData?.roleId === "ROL25" ? "" : prodi;

        const response = await fetchData(
          API_LINK +
            "BuktiPelaksanaanPerkuliahan/GetAllBuktiPelaksanaanPerkuliahan",
          {
            PageNumber: page,
            PageSize: pageSize,
            Urut: sort,
            TahunAkademik: tahun,
            Semester: semester,
            IdKonsentrasi: idKonsentrasiParam,
            ...(cari ? { SearchKeyword: cari } : {}),
          },
          "GET"
        );

        if (response.error) {
          throw new Error(response.message);
        }

        const { data, totalData } = response;

        const pagedData = data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.rpsId,
          "Kode - Nama Dosen": item.kodeNamaDosen,
          Prodi: item.programStudi,
          "Tahun Akademik": item.tahunAkademik ?? "-",
          Semester: item.semester,
          "Mata Kuliah": item.mataKuliah,
          Kelas: item.kelas,
          "Jumlah Pertemuan": item.jumlahPertemuan || 0,
          "Aktual Pertemuan": (item.aktualPertemuan ?? 0).toString(),
          "Persentase Pertemuan": item.persentasePertemuan,
          Aksi: [
            ...(isClient &&
            userData?.permission?.includes(
              "bukti_pelaksanaan_perkuliahan.print"
            )
              ? [
                  {
                    IconName: "printer",
                    Title: "Cetak Bukti Pelaksanaan Perkuliahan (Terpisah)",
                    Function: () =>
                      handlePrintBuktiPelaksanaanPerkuliahanTerpisah(
                        item.rpsId
                      ),
                  },
                  {
                    IconName: "printer",
                    Title: "Cetak Bukti Pelaksanaan Perkuliahan (Gabungan)",
                    Function: () =>
                      handlePrintBuktiPelaksanaanPerkuliahanGabungan(
                        item.rpsId
                      ),
                  },
                ]
              : []),
          ],
          Alignment: [
            "center",
            "left",
            "left",
            "center",
            "center",
            "left",
            "center",
            "center",
            "center",
            "center",
            "center",
          ],
        }));

        setDataGrid(pagedData || []);
        setTotalData(totalData || 0);
        setCurrentPage(page);
      } catch (err) {
        Toast.error(err.message);
        setDataGrid([]);
      } finally {
        setLoading(false);
      }
    },
    [
      pageSize,
      userData,
      isClient,
      handlePrintBuktiPelaksanaanPerkuliahanGabungan,
      handlePrintBuktiPelaksanaanPerkuliahanTerpisah,
    ]
  );

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      setCurrentPage(1);
      loadData(1, sortBy, query, filterTahun, filterSemester, filterProdi);
    },
    [loadData, sortBy, filterTahun, filterSemester, filterProdi]
  );

  const handleFilterApply = useCallback(() => {
    setCurrentPage(1);
    loadData(1, sortBy, search, filterTahun, filterSemester, filterProdi);
  }, [loadData, sortBy, search, filterTahun, filterSemester, filterProdi]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(page, sortBy, search, filterTahun, filterSemester, filterProdi);
    },
    [loadData, sortBy, search, filterTahun, filterSemester, filterProdi]
  );

  const loadInitialData = useCallback(async () => {
    try {
      const resTA = await fetchData(
        API_LINK + "BuktiPelaksanaanPerkuliahan/GetTahunAkademikAktif",
        {},
        "GET"
      );

      let initTahun = "";
      let initSemester = "Ganjil";

      if (resTA && !resTA.error) {
        setFilterTahun(resTA.tahun);
        setFilterSemester("");
        initTahun = resTA.tahun;
        initSemester = "";
      }

      const resSemester = await fetchData(
        API_LINK + "BuktiPelaksanaanPerkuliahan/GetListSemester",
        {},
        "GET"
      );

      if (resSemester && !resSemester.error && Array.isArray(resSemester)) {
        const formattedSemester = resSemester.map((item) => ({
          Value: item.value,
          Text: item.text,
        }));
        setListSemester(formattedSemester);
      } else {
        setListSemester([
          { Value: "", Text: "--- Semua ---" },
          { Value: "Ganjil", Text: "Ganjil" },
          { Value: "Genap", Text: "Genap" },
        ]);
      }

      if (userData?.roleId !== "ROL25") {
        const resProdi = await fetchData(
          API_LINK + "BuktiPelaksanaanPerkuliahan/GetListKonsentrasi",
          {},
          "GET"
        );
        if (resProdi && !resProdi.error && Array.isArray(resProdi)) {
          const formattedProdi = resProdi.map((item) => ({
            Value: item.id,
            Text: item.nama,
          }));
          setListProdi(formattedProdi);
        }
      }

      if (initTahun) {
        loadData(1, "kode asc", "", initTahun, initSemester, "");
      }
    } catch (err) {
      console.error(err);
      Toast.error("Gagal memuat data awal.");
    }
  }, [loadData, userData]);

  useEffect(() => {
    setIsClient(true);
    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("/auth/login");
      return;
    }
    loadInitialData();
  }, [ssoData, router, loadInitialData]);

  const filterContent = useMemo(
    () => (
      <>
        <DropDown
          arrData={dataFilterSort}
          type="none"
          label="Urut Berdasarkan"
          forInput="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        />

        {userData?.roleId !== "ROL25" && (
          <DropDown
            arrData={listProdi}
            type="none"
            label="Program Studi"
            forInput="filterProdi"
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
          />
        )}

        <div className="mb-1">
          <label
            htmlFor="tahunAkademik"
            className="form-label fw-bold small text-primary mb-1"
          >
            Tahun Akademik
          </label>
          <div className="d-flex align-items-center">
            <div style={{ flex: 1 }}>
              <Input
                id="tahunAkademik"
                type="number"
                min={0}
                value={filterTahun}
                onChange={(e) =>
                  setFilterTahun(e.target.value.replace("-", ""))
                }
              />
            </div>
            <span className="ms-2 fw-medium text-muted">
              /{filterTahun ? Number.parseInt(filterTahun) + 1 : "..."}
            </span>
          </div>
        </div>

        <DropDown
          arrData={listSemester}
          type="none"
          label="Semester"
          forInput="filterSemester"
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
        />
      </>
    ),
    [
      sortBy,
      filterTahun,
      filterSemester,
      filterProdi,
      dataFilterSort,
      listSemester,
      listProdi,
      userData,
    ]
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Bukti Pelaksanaan Perkuliahan"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Pelaksanaan Perkuliahan" },
        { label: "Bukti Pelaksanaan Perkuliahan" },
      ]}
    >
      <div>
        <Formsearch
          onSearch={handleSearch}
          onFilter={handleFilterApply}
          showAddButton={false}
          showExportButton={false}
          searchPlaceholder="Pencarian..."
          filterContent={filterContent}
        />
      </div>
      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table data={dataGrid} />

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

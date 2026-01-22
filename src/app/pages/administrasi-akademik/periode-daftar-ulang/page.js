"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Paging from "@/components/common/Paging";
import Table from "@/components/common/Table";
import Toast from "@/components/common/Toast";
import DropDown from "@/components/common/Dropdown";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { encryptIdUrl } from "@/lib/encryptor";
import DateFormatter from "@/lib/dateFormater";
import { getSSOData, getUserData } from "@/context/user";

export default function PeriodeDaftarUlangPage() {
  const router = useRouter();
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);

  const [dataPeriode, setDataPeriode] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const sortRef = useRef();

  const dataFilterSort = useMemo(
    () => [
      { Value: "[Tahun Akademik] desc", Text: "Tahun Akademik [↓]" },
      { Value: "[Tahun Akademik] asc", Text: "Tahun Akademik [↑]" },
      { Value: "[Tanggal Mulai] desc", Text: "Tanggal Mulai [↓]" },
      { Value: "[Tanggal Mulai] asc", Text: "Tanggal Mulai [↑]" },
    ],
    [],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);

  const loadData = useCallback(
    async (page, sort, cari) => {
      if (!isClient) return;

      try {
        setLoading(true);
        const response = await fetchData(
          `${API_LINK}PeriodeDaftarUlang/GetAllPeriodeDaftarUlang`,
          {
            PageNumber: page,
            PageSize: pageSize,
            Urut: sort,
            ...(cari && cari.trim() !== "" ? { SearchKeyword: cari } : {}),
          },
          "GET",
        );

        if (response.error) {
          throw new Error(response.message);
        }

        const { data, totalData } = response;
        const mappedData = data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.id,
          "Tahun Akademik": item.tahunAjaran,
          "Tanggal Mulai": DateFormatter.formatDateWithDay(item.tanggalMulai),
          "Tanggal Akhir": DateFormatter.formatDateWithDay(item.tanggalAkhir),
          Aksi: [
            ...(userData?.permission?.includes("periode_daftar_ulang.edit")
              ? ["Edit"]
              : []),
          ],
          Alignment: ["center", "center", "center", "center", "center"],
        }));

        setDataPeriode(mappedData || []);
        setTotalData(totalData || 0);
        setCurrentPage(page);
      } catch (err) {
        Toast.error(err.message);
        setDataPeriode([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, isClient, userData],
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!ssoData) {
      router.push("/auth/login");
      return;
    }
    loadData(1, sortBy, search);
  }, [isClient, ssoData, router, loadData, sortBy, search]);

  const handleSearch = useCallback((query) => {
    setSearch(query);
    setCurrentPage(1);
  }, []);

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    setSortBy(newSortBy);
    setCurrentPage(1);
  }, []);

  const handleNavigation = useCallback(
    (page) => {
      if (isClient) loadData(page, sortBy, search);
    },
    [isClient, loadData, sortBy, search],
  );

  const handleAdd = useCallback(() => {
    router.push("/pages/administrasi-akademik/periode-daftar-ulang/add");
  }, [router]);

  const handleEdit = useCallback(
    (id) => {
      router.push(
        `/pages/administrasi-akademik/periode-daftar-ulang/edit/${encryptIdUrl(id)}`,
      );
    },
    [router],
  );

  const filterContent = useMemo(
    () => (
      <DropDown
        ref={sortRef}
        arrData={dataFilterSort}
        type="pilih"
        label="Urutkan"
        forInput="sortBy"
        defaultValue={sortBy}
      />
    ),
    [sortBy, dataFilterSort],
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Periode Daftar Ulang"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Administrasi Akademik" },
        { label: "Periode Daftar Ulang" },
      ]}
    >
      <div>
        <Formsearch
          onSearch={handleSearch}
          onAdd={handleAdd}
          onFilter={handleFilterApply}
          showAddButton={
            isClient &&
            userData?.permission?.includes("periode_daftar_ulang.create")
          }
          showFilterButton={true}
          showExportButton={false}
          searchPlaceholder="Cari berdasarkan tahun akademik..."
          addButtonText="Tambah"
          filterContent={filterContent}
        />
      </div>
      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table data={dataPeriode} onEdit={handleEdit} />
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

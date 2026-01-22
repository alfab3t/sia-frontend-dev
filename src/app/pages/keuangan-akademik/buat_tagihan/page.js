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
import { formatDateLong } from "@/lib/dateFormater";

export default function BuatTagihanPage() {
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const router = useRouter();
  const [dataTagihan, setDataTagihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const prodiRef = useRef();
  const jenisRef = useRef();
  const [isClient, setIsClient] = useState(false);
  const [dataProdi, setDataProdi] = useState([]);

  const dataFilterJenis = useMemo(
    () => [
      { Value: "Sumbangan", Text: "Biaya Sumbangan" },
      { Value: "SPP", Text: "Biaya SPP" },
      { Value: "Wisuda", Text: "Biaya Wisuda" },
      { Value: "Cuti", Text: "Biaya Cuti" },
      { Value: "ID Card", Text: "Biaya ID Card" },
      { Value: "Lainnya", Text: "Biaya Lain-Lain" },
      { Value: "Titipan", Text: "Pengembalian Dana Titipan" },
    ],
    [],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterProdi, setFilterProdi] = useState("");
  const [filterJenis, setFilterJenis] = useState("");

  const formatRupiah = useCallback((number) => {
    if (number === null || number === undefined) return "0";

    const num = Number(number);
    const isNegative = num < 0;

    const formatted = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(Math.abs(num));

    return isNegative ? `(${formatted})` : formatted;
  }, []);

  const fetchProdi = useCallback(async () => {
    try {
      const response = await fetchData(
        API_LINK + "BuatTagihan/GetTagihanListProdi",
        {},
        "GET",
      );

      if (response.error) {
        throw new Error(response.message);
      }
      const prodiOptions = response.data.map((item) => ({
        Value: item.value,
        Text: item.text,
      }));
      setDataProdi(prodiOptions);
    } catch (err) {
      Toast.error(err.message);
    }
  }, []);

  const loadData = useCallback(
    async (page, cari, prodi, jenis) => {
      const searchKeyword = cari?.trim();
      try {
        setLoading(true);

        const response = await fetchData(
          API_LINK + "BuatTagihan/GetAllTagihan",
          {
            ...(searchKeyword ? { Keyword: searchKeyword } : {}),
            ...(prodi ? { Prodi: prodi } : {}),
            ...(jenis ? { Jenis: jenis } : {}),
            PageNumber: page,
            PageSize: pageSize,
          },
          "GET",
        );

        if (response.error) {
          throw new Error(response.message);
        }

        const { data, totalData: total } = response;
        const pagedData = data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.id,
          "No. Daftar/NIM": item.nim,
          Nama: item.namaMahasiswa,
          Prodi: item.prodi.toUpperCase(),
          "Jenis Tagihan": item.jenisTagihan,
          "Batas Pembayaran": formatDateLong(item.jatuhTempo),
          "Jumlah Tagihan (Rp)": formatRupiah(item.jumlah),
          Keterangan: item.keterangan,
          Alignment: [
            "center",
            "center",
            "left",
            "center",
            "center",
            "center",
            "right",
            "left",
          ],
        }));

        setDataTagihan(pagedData || []);
        setTotalData(total || 0);
        setCurrentPage(page);
      } catch (err) {
        Toast.error(err.message);
        setDataTagihan([]);
        setTotalData(0);
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
      loadData(1, query, filterProdi, filterJenis);
    },
    [filterProdi, filterJenis, loadData],
  );

  const handleFilterApply = useCallback(() => {
    const newFilterProdi = prodiRef.current.value;
    const newFilterJenis = jenisRef.current.value;

    setFilterProdi(newFilterProdi);
    setFilterJenis(newFilterJenis);
    setCurrentPage(1);
    loadData(1, search, newFilterProdi, newFilterJenis);
  }, [search, loadData]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(page, search, filterProdi, filterJenis);
    },
    [search, filterProdi, filterJenis, loadData],
  );

  const handleAdd = useCallback(() => {
    router.push("/pages/keuangan-akademik/buat_tagihan/add");
  }, [router]);

  useEffect(() => {
    setIsClient(true);

    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("./auth/login");
      return;
    }

    fetchProdi();

    loadData(1, search, filterProdi, filterJenis);
  }, [ssoData, router, loadData, search, filterProdi, filterJenis, fetchProdi]);

  const filterContent = useMemo(
    () => (
      <>
        <DropDown
          ref={jenisRef}
          arrData={dataFilterJenis}
          type="semua"
          label="Jenis Tagihan"
          forInput="filterJenis"
          defaultValue={filterJenis}
        />
        <DropDown
          ref={prodiRef}
          arrData={dataProdi}
          type="semua"
          label="Program Studi"
          forInput="filterProdi"
          defaultValue={filterProdi}
        />
      </>
    ),
    [filterProdi, filterJenis, dataProdi, dataFilterJenis],
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Buat Tagihan"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Keuangan Akademik" },
        { label: "Buat Tagihan" },
      ]}
    >
      <div>
        <Formsearch
          onSearch={handleSearch}
          onAdd={handleAdd}
          onFilter={handleFilterApply}
          showAddButton={
            isClient &&
            userData?.listPermission?.includes("buat_tagihan.create")
          }
          showExportButton={false}
          searchPlaceholder="Cari data tagihan"
          addButtonText="Tambah"
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

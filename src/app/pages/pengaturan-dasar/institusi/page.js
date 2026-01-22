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
import { encryptIdUrl } from "@/lib/encryptor";
import SweetAlert from "@/components/common/SweetAlert";
import { getSSOData, getUserData } from "@/context/user";
import DateFormatter from "@/lib/dateFormater";

export default function MasterInstitusiPage() {
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const router = useRouter();
  const [dataInstitusi, setDataInstitusi] = useState([]);
  const [loading, setLoading] = useState(true);
  const sortRef = useRef();
  const statusRef = useRef();
  const [isClient, setIsClient] = useState(false);

  const dataFilterSort = [
    { Value: "[Nama Institusi] asc", Text: "Nama Institusi [↑]" },
    { Value: "[Nama Institusi] desc", Text: "Nama Institusi [↓]" },
    { Value: "[Tanggal SK] asc", Text: "Tanggal SK [↑]" },
    { Value: "[Tanggal SK] desc", Text: "Tanggal SK [↓]" },
  ];

  const dataFilterStatus = [
    { Value: "Aktif", Text: "Aktif" },
    { Value: "Tidak Aktif", Text: "Tidak Aktif" },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [sortStatus, setSortStatus] = useState(dataFilterStatus[0].Value);

  const loadData = useCallback(
    async (page, sort, cari, status) => {
      try {
        setLoading(true);

        const response = await fetchData(
          API_LINK + "Institusi/GetAllInstitusi",
          {
            Status: status,
            ...(cari === "" ? {} : { SearchKeyword: cari }),
            Urut: sort,
            PageNumber: page,
            PageSize: pageSize,
          },
          "GET"
        );

        if (response.error) {
          throw new Error(response.message);
        }

        const { data, totalData } = response;
        const pagedData = data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.id,
          "Nama Institusi": item.namaInstitusi,
          "Nama Direktur": item.namaDirektur,
          "Tanggal SK": DateFormatter.formatDate(item.tanggalSK),
          "Nomor SK": item.nomorSK,
          Status: item.status,
          Aksi: [
            "Detail",
            ...(isClient && userData?.permission?.includes("institusi.edit")
              ? ["Edit", "Toggle"]
              : []),
          ],
          Alignment: [
            "center",
            "left",
            "left",
            "center",
            "center",
            "center",
            "center",
          ],
        }));

        setDataInstitusi(pagedData || []);
        setTotalData(totalData || 0);
        setCurrentPage(page);
      } catch (err) {
        Toast.error(err.message);
        setDataInstitusi([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, isClient, userData]
  );

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      setCurrentPage(1);
      loadData(1, sortBy, query, sortStatus);
    },
    [sortBy, sortStatus, loadData]
  );

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    const newSortStatus = statusRef.current.value;

    setSortBy(newSortBy);
    setSortStatus(newSortStatus);
    setCurrentPage(1);
    loadData(1, newSortBy, search, newSortStatus);
  }, [search, loadData]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(page, sortBy, search, sortStatus);
    },
    [sortBy, search, sortStatus, loadData]
  );

  const handleAdd = useCallback(() => {
    router.push("/pages/pengaturan-dasar/institusi/add");
  }, [router]);

  const handleDetail = useCallback(
    (id) =>
      router.push(
        `/pages/pengaturan-dasar/institusi/detail/${encryptIdUrl(id)}`
      ),
    [router]
  );

  const handleEdit = useCallback(
    (id) =>
      router.push(`/pages/pengaturan-dasar/institusi/edit/${encryptIdUrl(id)}`),
    [router]
  );

  const handleToggle = useCallback(
    async (id) => {
      const result = await SweetAlert({
        title: "Nonaktifkan Data Institusi",
        text: "Apakah Anda yakin ingin menonaktifkan data institusi ini?",
        icon: "warning",
        confirmText: "Ya, saya yakin!",
      });

      if (!result) return;

      setLoading(true);

      try {
        const data = await fetchData(
          API_LINK + "Institusi/SetStatusInstitusi/" + id,
          {},
          "POST"
        );

        if (data.error) {
          throw new Error(data.message);
        }

        Toast.success("Data status institusi berhasil diubah.");
        loadData(1, sortBy, search, sortStatus);
      } catch (err) {
        Toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [sortBy, search, sortStatus, loadData]
  );

  useEffect(() => {
    setIsClient(true);

    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("./auth/login");
      return;
    }

    loadData(1, sortBy, search, sortStatus);
  }, [ssoData, router, loadData, sortBy, search, sortStatus]);

  const filterContent = useMemo(
    () => (
      <>
        <DropDown
          ref={sortRef}
          arrData={dataFilterSort}
          type="pilih"
          label="Urutkan"
          forInput="sortBy"
          defaultValue={sortBy}
        />
        <DropDown
          ref={statusRef}
          arrData={dataFilterStatus}
          type="pilih"
          label="Status"
          forInput="sortStatus"
          defaultValue={sortStatus}
        />
      </>
    ),
    [sortBy, sortStatus]
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Institusi"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Pengaturan Dasar" },
        { label: "Institusi" },
      ]}
    >
      <div>
        <Formsearch
          onSearch={handleSearch}
          onAdd={handleAdd}
          onFilter={handleFilterApply}
          showAddButton={
            isClient && userData?.permission?.includes("institusi.create")
          }
          showExportButton={false}
          searchPlaceholder="Cari data institusi"
          addButtonText="Tambah"
          filterContent={filterContent}
        />
      </div>
      <div className="row align-items-center g-3">
        <div className="col-12">
          <Table
            data={dataInstitusi}
            onDetail={handleDetail}
            onEdit={handleEdit}
            onToggle={handleToggle}
          />
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

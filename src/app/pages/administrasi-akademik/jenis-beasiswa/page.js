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

const dataFilterSort = [
  { Value: "[Nama Institusi] asc", Text: "Nama Institusi [↑]" },
  { Value: "[Nama Institusi] desc", Text: "Nama Institusi [↓]" },
  { Value: "[Nama Beasiswa] asc", Text: "Nama Beasiswa [↑]" },
  { Value: "[Nama Beasiswa] desc", Text: "Nama Beasiswa [↓]" },
];

const dataFilterStatus = [
  { Value: "Aktif", Text: "Aktif" },
  { Value: "Tidak Aktif", Text: "Tidak Aktif" },
];

const dataFilterSemester = [
  { Value: "", Text: "- Semua -" },
  { Value: 1, Text: "1 Semester" },
  { Value: 2, Text: "2 Semester" },
  { Value: 3, Text: "3 Semester" },
  { Value: 4, Text: "4 Semester" },
  { Value: 6, Text: "6 Semester" },
  { Value: 7, Text: "7 Semester" },
  { Value: 8, Text: "8 Semester" },
];

export default function MasterJenisBeasiswaPage() {
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const router = useRouter();

  const [dataJenis, setDataJenis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const sortRef = useRef();
  const statusRef = useRef();
  const semesterRef = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [sortStatus, setSortStatus] = useState(dataFilterStatus[0].Value);
  const [semester, setSemester] = useState("");

  const loadData = useCallback(
    async (page, sort, keyword, status, masaSemester) => {
      try {
        setLoading(true);

        const res = await fetchData(
          API_LINK + "JenisBeasiswa/GetAllJenisBeasiswa",
          {
            Status: status,
            ...(keyword ? { SearchKeyword: keyword } : {}),
            ...(masaSemester ? { MasaSemester: masaSemester } : {}),
            Urut: sort,
            PageNumber: page,
            PageSize: pageSize,
          },
          "GET",
        );

        if (res.error) throw new Error("Gagal Memuat Data");

        const { data, totalData } = res;

        const mapped = data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.id,
          "Nama Beasiswa": item.namaJenisBeasiswa,
          "Nama Institusi": item.namaInstitusi,
          "Masa Semester": item.masaSemester,
          Status: item.status,
          Aksi: [
            "Detail",
            ...((
              isClient && userData?.permission?.includes("jenis_beasiswa.edit")
            ) ?
              ["Edit", "Toggle"]
            : []),
          ],
          Alignment: ["center", "left", "left", "center", "center", "center"],
        }));

        setDataJenis(mapped);
        setTotalData(totalData);
        setCurrentPage(page);
      } catch {
        Toast.error("Gagal Memuat Data");
        setDataJenis([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, isClient, userData],
  );

  const handleSearch = useCallback(
    (query) => {
      setSearch(query);
      setCurrentPage(1);
      loadData(1, sortBy, query, sortStatus, semester);
    },
    [sortBy, sortStatus, semester, loadData],
  );

  const handleFilterApply = useCallback(() => {
    const newSort = sortRef.current.value;
    const newStatus = statusRef.current.value;
    const newSemester = semesterRef.current.value;

    setSortBy(newSort);
    setSortStatus(newStatus);
    setSemester(newSemester);

    loadData(1, newSort, search, newStatus, newSemester);
  }, [search, loadData]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(page, sortBy, search, sortStatus, semester);
    },
    [sortBy, search, sortStatus, semester, loadData],
  );

  const handleAdd = useCallback(() => {
    router.push("/pages/administrasi-akademik/jenis-beasiswa/add");
  }, [router]);

  const handleDetail = useCallback(
    (id) =>
      router.push(
        `/pages/administrasi-akademik/jenis-beasiswa/detail/${encryptIdUrl(id)}`,
      ),
    [router],
  );

  const handleEdit = useCallback(
    (id) =>
      router.push(
        `/pages/administrasi-akademik/jenis-beasiswa/edit/${encryptIdUrl(id)}`,
      ),
    [router],
  );

  const handleToggle = useCallback(
    async (id) => {
      const result = await SweetAlert({
        title: "Ubah Status Jenis Beasiswa",
        text: "Yakin ingin mengubah status data ini?",
        icon: "warning",
        confirmText: "Ya, ubah!",
      });

      if (!result) return;

      try {
        setLoading(true);

        const res = await fetchData(
          API_LINK + "JenisBeasiswa/SetStatusJenisBeasiswa/" + id,
          {},
          "POST",
        );

        if (res.error) throw new Error("Gagal Mengupdate Status");

        Toast.success("Status berhasil diubah.");
        loadData(1, sortBy, search, sortStatus, semester);
      } catch {
        Toast.error("Gagal Mengupdate Status");
      } finally {
        setLoading(false);
      }
    },
    [sortBy, search, sortStatus, semester, loadData],
  );
  useEffect(() => {
    setIsClient(true);

    if (!ssoData) {
      Toast.error("Sesi anda habis.");
      router.push("/auth/login");
      return;
    }

    loadData(1, sortBy, search, sortStatus, semester);
  }, [ssoData, router, loadData, sortBy, search, sortStatus, semester]);

  const filterContent = useMemo(
    () => (
      <>
        <DropDown
          ref={sortRef}
          arrData={dataFilterSort}
          label="Urutkan"
          defaultValue={sortBy}
        />
        <DropDown
          ref={statusRef}
          arrData={dataFilterStatus}
          label="Status"
          defaultValue={sortStatus}
        />
        <DropDown
          ref={semesterRef}
          arrData={dataFilterSemester}
          label="Masa Semester"
          defaultValue={semester}
        />
      </>
    ),
    [sortBy, sortStatus, semester],
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Jenis Beasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Administrasi Akademik" },
        {
          label: "Jenis Beasiswa",
          href: "/Administrasi-Akademik/jenis-beasiswa",
        },
      ]}
    >
      <Formsearch
        onSearch={handleSearch}
        onAdd={handleAdd}
        onFilter={handleFilterApply}
        showAddButton={
          isClient && userData?.permission?.includes("jenis_beasiswa.create")
        }
        showExportButton={false}
        filterContent={filterContent}
      />

      <Table
        data={dataJenis}
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
    </MainContent>
  );
}

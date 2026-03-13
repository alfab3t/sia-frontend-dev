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
  { Value: "institusiNama asc", Text: "Nama Institusi [↑]" },
  { Value: "institusiNama desc", Text: "Nama Institusi [↓]" },
];

const dataFilterStatus = [
  { Value: "Aktif", Text: "Aktif" },
  { Value: "Tidak Aktif", Text: "Tidak Aktif" },
];

export default function MasterInstitusiBeasiswaPage() {
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const router = useRouter();

  const [dataInstitusi, setDataInstitusi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const sortRef = useRef();
  const statusRef = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [sortStatus, setSortStatus] = useState(dataFilterStatus[0].Value);

  const permissions = localStorage.getItem("permissionData");

  const loadData = useCallback(
    async (page, sort, cari, status) => {
      try {
        setLoading(true);

        const response = await fetchData(
          API_LINK + "InstitusiBeasiswa/GetAllInstitusiBeasiswa",
          {
            Status: status,
            ...(cari ? { SearchKeyword: cari } : {}),
            Urut: sort,
            PageNumber: page,
            PageSize: pageSize,
          },
          "GET",
        );

        if (response.error) throw new Error("Gagal Memuat Data");

        const { data, totalData } = response;

        const pagedData = data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.id,
          "Nama Institusi": item.namaInstitusiBeasiswa,
          Alamat: item.alamat,
          Telepon: item.telepon,
          Email: item.email,
          Status: item.status,
          Aksi: [
            "Detail",
            ...((
              isClient &&
              userData?.permission?.includes("institusi_beasiswa.edit")
            ) ?
              ["Edit", "Toggle"]
            : []),
          ],
          Alignment: [
            "center",
            "left",
            "left",
            "center",
            "left",
            "center",
            "center",
          ],
        }));

        setDataInstitusi(pagedData);
        setTotalData(totalData);
        setCurrentPage(page);
      } catch {
        Toast.error("Error saat mengambil data");
        setDataInstitusi([]);
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
      loadData(1, sortBy, query, sortStatus);
    },
    [sortBy, sortStatus, loadData],
  );

  const handleFilterApply = useCallback(() => {
    const newSortBy = sortRef.current.value;
    const newSortStatus = statusRef.current.value;

    setSortBy(newSortBy);
    setSortStatus(newSortStatus);
    loadData(1, newSortBy, search, newSortStatus);
  }, [search, loadData]);

  const handleNavigation = useCallback(
    (page) => {
      loadData(page, sortBy, search, sortStatus);
    },
    [sortBy, search, sortStatus, loadData],
  );

  const handleAdd = () => {
    router.push("/pages/administrasi-akademik/institusi-beasiswa/add");
  };

  const handleDetail = (id) => {
    router.push(
      `/pages/administrasi-akademik/institusi-beasiswa/detail/${encryptIdUrl(id)}`,
    );
  };

  const handleEdit = (id) => {
    router.push(
      `/pages/administrasi-akademik/institusi-beasiswa/edit/${encryptIdUrl(id)}`,
    );
  };

  const handleToggle = useCallback(
    async (id) => {
      const result = await SweetAlert({
        title: "Ubah Status Institusi Beasiswa",
        text: "Yakin ingin mengubah status data ini?",
        icon: "warning",
        confirmText: "Ya, ubah!",
      });

      if (!result) return;

      try {
        setLoading(true);

        const response = await fetchData(
          API_LINK + "InstitusiBeasiswa/SetStatusInstitusiBeasiswa/" + id,
          {},
          "POST",
        );

        if (response.error) throw new Error("Gagal mengubah status data");

        Toast.success("Status institusi beasiswa berhasil diubah.");
        loadData(1, sortBy, search, sortStatus);
      } catch {
        Toast.error("Gagal mengubah status data");
      } finally {
        setLoading(false);
      }
    },
    [sortBy, search, sortStatus, loadData],
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
          label="Urutkan"
          defaultValue={sortBy}
        />
        <DropDown
          ref={statusRef}
          arrData={dataFilterStatus}
          label="Status"
          defaultValue={sortStatus}
        />
      </>
    ),
    [sortBy, sortStatus],
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Institusi Beasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Administrasi Akademik" },
        { label: "Institusi Beasiswa" },
      ]}
    >
      <Formsearch
        onSearch={handleSearch}
        onAdd={handleAdd}
        onFilter={handleFilterApply}
        showAddButton={
          isClient &&
          userData?.permission?.includes("institusi_beasiswa.create")
        }
        searchPlaceholder="Cari institusi beasiswa"
        addButtonText="Tambah"
        filterContent={filterContent}
        showExportButton={false}
      />

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
    </MainContent>
  );
}

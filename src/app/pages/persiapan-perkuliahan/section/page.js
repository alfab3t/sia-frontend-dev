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
import { getSSOData, getPermissionData } from "@/context/user";

export default function MasterSectionPage() {
  const ssoData = useMemo(() => getSSOData(), []);
  const permissionData = useMemo(() => getPermissionData(), []);

  const router = useRouter();
  const [dataSection, setDataSection] = useState([]);
  const [loading, setLoading] = useState(true);
  const sortRef = useRef();
  const statusRef = useRef();
  const [isClient, setIsClient] = useState(false);

  const dataFilterSort = [
    { Value: "[Nama Section] asc", Text: "Nama Section [↑]" },
    { Value: "[Nama Section] desc", Text: "Nama Section [↓]" },
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

        const finalSearch = cari ? cari.toString().trim() : "";

        const params = {
          Status: status,
          Urut: sort,
          PageNumber: page,
          PageSize: pageSize,
        };

        
        if (finalSearch !== "") {
          params.SearchKeyword = finalSearch;
        }

        const response = await fetchData(
          API_LINK + "Section/GetAllSection",
          params,
          "GET"
        );

        if (response.error) throw new Error(response.message);

        const { data, totalData } = response;
        const pagedData = data.map((item, index) => ({
          No: (page - 1) * pageSize + index + 1,
          id: item.id,
          "Nama Section": item.namaSection || item.NamaSection,
          Status: item.status || item.Status,
          Aksi: [
            ...(isClient && permissionData?.includes("section.edit")
              ? ["Edit", "Toggle"]
              : []),
          ],
          Alignment: ["center", "center", "center", "center"],
        }));

        setDataSection(pagedData || []);
        setTotalData(totalData || 0);
        setCurrentPage(page);
      } catch (err) {
        Toast.error(err.message);
        setDataSection([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, isClient, permissionData]
  );


  const handleSearch = useCallback(
    (query) => {
      setSearch(query); 
      setCurrentPage(1);
      loadData(1, sortBy, query, sortStatus);
    },
    [sortBy, sortStatus, loadData]
  );

  const handleToggle = useCallback(
    async (id) => {
      const item = dataSection.find((x) => x.id === id);
      const isAktif = item?.Status === "Aktif";
      
      const teksAksi = isAktif ? "menonaktifkan" : "mengaktifkan";

      const result = await SweetAlert({
        title: "Ubah Status Section",
        text: `Apakah Anda yakin ingin ${teksAksi} data section ini?`,
        icon: "warning",
        confirmText: "Ya, saya yakin!",
      });

      if (!result) return;

      setLoading(true);
      try {
        const response = await fetchData(
          API_LINK + "Section/SetStatusSection/" + id,
          {},
          "POST"
        );

        if (response.error) throw new Error(response.message);

        Toast.success(`Data section berhasil ${isAktif ? "dinonaktifkan" : "diaktifkan"}.`);
        loadData(currentPage, sortBy, search, sortStatus);
      } catch (err) {
        Toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [dataSection, sortBy, search, sortStatus, loadData, currentPage]
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
    (page) => loadData(page, sortBy, search, sortStatus),
    [sortBy, search, sortStatus, loadData]
  );

  const handleAdd = useCallback(() => {
    router.push("/pages/persiapan-perkuliahan/section/add");
  }, [router]);

  const handleEdit = useCallback(
    (id) => router.push(`/pages/persiapan-perkuliahan/section/edit/${encryptIdUrl(id)}`),
    [router]
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
        <DropDown ref={sortRef} arrData={dataFilterSort} type="pilih" label="Urutkan" forInput="sortBy" defaultValue={sortBy} />
        <DropDown ref={statusRef} arrData={dataFilterStatus} type="pilih" label="Status" forInput="sortStatus" defaultValue={sortStatus} />
      </>
    ),
    [sortBy, sortStatus]
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Section"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Persiapan Perkuliahan" },
        { label: "Section" },
      ]}
    >
      <Formsearch
        onSearch={handleSearch}
        onAdd={handleAdd}
        onFilter={handleFilterApply}
        showAddButton={isClient && permissionData?.includes("section.create")}
        showExportButton={false}
        searchPlaceholder="Cari data section"
        addButtonText="Tambah"
        filterContent={filterContent}
      />
      <div className="row align-items-center g-3 mt-2">
        <div className="col-12">
          <Table data={dataSection} onEdit={handleEdit} onToggle={handleToggle} />
          {totalData > 0 && (
            <Paging pageSize={pageSize} pageCurrent={currentPage} totalData={totalData} navigation={handleNavigation} />
          )}
        </div>
      </div>
    </MainContent>
  );
}
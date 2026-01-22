"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSSOData, getUserData } from "@/context/user";
import { API_LINK } from "@/lib/constant";
import { encryptIdUrl } from "@/lib/encryptor";
import fetchData from "@/lib/fetch";
import Toast from "@/components/common/Toast";
import Table from "@/components/common/Table";
import SweetAlert from "@/components/common/SweetAlert";
import Paging from "@/components/common/Paging";
import DropDown from "@/components/common/Dropdown";
import Formsearch from "@/components/common/Formsearch";
import MainContent from "@/components/layout/MainContent";

export default function DaftarPengumumanPage() {
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const router = useRouter();
  
  const aplikasiRef = useRef();
  const sortRef = useRef();
  const pageSize = 10;

  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);

  const [listAplikasi, setListAplikasi] = useState([]);
  const [activeAppFilter, setActiveAppFilter] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const dataFilterSort = [
    { Value: "date desc", Text: "Tanggal Terbit [↓]" },
    { Value: "date asc", Text: "Tanggal Terbit [↑]" },
  ];
  const [activeSortFilter, setActiveSortFilter] = useState(dataFilterSort[0].Value);

  const userPermissions = useMemo(() => userData?.permission || [], [userData]);
  const hasPermission = useCallback((p) => userPermissions.includes(p), [userPermissions]);
  
  const canCreate = isClient && hasPermission("pengumuman.create");
  const canEdit = isClient && hasPermission("pengumuman.edit");
  const canDelete = isClient && hasPermission("pengumuman.delete");
  const canView = isClient && hasPermission("pengumuman.view");

  const getActions = useCallback((isActive) => {
    let actions = [];
    if (canEdit) actions.push("Toggle");
    if (canView) actions.push("Detail");
    if (canEdit && !isActive) actions.push("Edit");
    if (canView) actions.push("Preview");
    if (canDelete && !isActive) actions.push("Delete");
    return actions;
  }, [canEdit, canView, canDelete]);

  const getSafeUrl = (endpoint) => {
    const base = API_LINK.endsWith("/") ? API_LINK.slice(0, -1) : API_LINK;
    const path = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
    return `${base}/${path}`;
  };

  useEffect(() => {
    setIsClient(true);
    const fetchApps = async () => {
      try {
        const url = getSafeUrl("Pengumuman/GetListAplikasi");
        const res = await fetchData(url, {}, "GET");
        if (res?.data) {
            setListAplikasi(res.data.map((item) => ({
              Value: item.idAplikasi,
              Text: item.namaAplikasi,
            })));
        }
      } catch {
        setListAplikasi([]);
      }
    };
    fetchApps();
  }, []);

  const loadData = useCallback(
    async (page, cari, idAplikasi, filterSort) => {
      setLoading(true);
      try {
        const queryParams = {
          Halaman: page,
          Limit: pageSize,
          Filter: filterSort,
          ...(cari ? { InputCari: cari } : {}),
          ...(idAplikasi ? { IdAplikasi: idAplikasi } : {}),
        };

        const url = getSafeUrl("Pengumuman/GetDataPengumuman");
        const res = await fetchData(url, queryParams, "GET");

        if (res.error) throw new Error("Gagal memuat data");

        const { data, totalData } = res;
        
        const pagedData = data.map((item, index) => {
          const isActive = item.statusPengumuman === "Tampil" || item.statusPengumuman === "Aktif";
          return {
            Key: item.idPengumuman,
            id: item.idPengumuman,
            No: (page - 1) * pageSize + index + 1,
            Aplikasi: item.namaAplikasi || "-",
            "Tanggal Terbit": item.tanggalPengumumanF,
            "Subyek Pengumuman": item.subyekPengumuman || "-",
            Status: isActive ? "Aktif" : "Tidak Aktif",
            Aksi: getActions(isActive),
            Alignment: ["center", "center", "center", "center", "center", "center"],
          };
        });

        setDataList(pagedData);
        setTotalData(totalData);
        setCurrentPage(page);
      } catch {
        Toast.error("Gagal memuat data pengumuman.");
        if(page === 1) setDataList([]); 
      } finally {
        setLoading(false);
      }
    },
    [pageSize, getActions]
  );

  useEffect(() => {
    if (!isClient) return;
    if (!ssoData) {
      router.push("./auth/login");
      return;
    }
    if (userData && !userData.permission?.includes("daftar_pengumuman.view")) {
        Toast.error("Anda tidak memiliki akses ke halaman ini");
        router.push("/pages/beranda");
        return;
    }
    loadData(currentPage, searchKeyword, activeAppFilter, activeSortFilter);
  }, [isClient, ssoData, router, searchKeyword, loadData, userData, activeAppFilter, activeSortFilter, currentPage]);

  const handleDelete = useCallback(
    async (id) => {
      if (!canDelete) return Toast.error("Anda tidak memiliki izin menghapus data.");

      const result = await SweetAlert({
        title: "Hapus Data?",
        text: "Data yang dihapus tidak dapat dikembalikan!",
        icon: "warning",
        confirmText: "Ya, Hapus",
      });

      if (!result) return;

      setDataList((prev) => prev.filter((item) => item.id !== id));
      setTotalData((prev) => prev - 1);
      
      Toast.success("Data berhasil dihapus");

      try {
        const url = getSafeUrl(`Pengumuman/DeletePengumuman/${id}`);
        const res = await fetchData(url, {}, "POST");
        
        if (res?.error && res?.errNo !== -2) {
             Toast.error("Gagal menghapus data: " + (res?.message || "Kesalahan server"));
        }

      } catch {
        Toast.error("Terjadi kesalahan saat menghapus data.");
      }
    },
    [canDelete] 
  );

  const handleToggle = useCallback(
    async (id) => {
      if (!canEdit) return Toast.error("Anda tidak memiliki izin mengubah status.");

      const itemTarget = dataList.find((item) => item.id === id);
      if (!itemTarget) return;

      const isCurrentlyActive = itemTarget.Status === "Aktif";
      const targetEndpoint = isCurrentlyActive ? "HidePengumuman" : "ShowPengumuman";
      const newStatusText = isCurrentlyActive ? "Tidak Aktif" : "Aktif";

      const result = await SweetAlert({
        title: "Ubah Status?",
        text: `Apakah Anda yakin ingin ${isCurrentlyActive ? "Menonaktifkan" : "Mengaktifkan"} pengumuman ini?`,
        icon: "warning",
        confirmText: "Ya, Lanjutkan",
      });

      if (!result) return;

      setDataList((prevList) => 
            prevList.map((item) => {
                if (item.id === id) {
                    const newActiveState = !isCurrentlyActive;
                    return {
                        ...item,
                        Status: newActiveState ? "Aktif" : "Tidak Aktif",
                        Aksi: getActions(newActiveState)
                    };
                }
                return item;
            })
      );

      Toast.success(`Berhasil mengubah status menjadi ${newStatusText}`);

      try {
        const url = getSafeUrl(`Pengumuman/${targetEndpoint}/${id}`);
        const res = await fetchData(url, {}, "POST");
        
        if (res?.error && res?.errNo !== -2) {
             Toast.error("Gagal mengubah status: " + (res?.message || "Kesalahan server"));
        }
        
      } catch {
        Toast.error("Terjadi kesalahan saat mengubah status.");
      }
    },
    [dataList, canEdit, getActions]
  );

  const handleSearch = useCallback((k) => {
      setSearchKeyword(k);
      setCurrentPage(1); 
      loadData(1, k, activeAppFilter, activeSortFilter);
    }, [activeSortFilter, activeAppFilter, loadData]);

  const handleFilterApply = useCallback(() => {
    setActiveAppFilter(aplikasiRef.current?.value || "");
    setActiveSortFilter(sortRef.current?.value || "date desc");
    setCurrentPage(1);
    loadData(1, searchKeyword, aplikasiRef.current?.value, sortRef.current?.value);
  }, [searchKeyword, loadData]);

  const handleNavigation = useCallback((page) => loadData(page, searchKeyword, activeAppFilter, activeSortFilter), [searchKeyword, activeAppFilter, activeSortFilter, loadData]);
  const handleAdd = useCallback(() => canCreate ? router.push("/pages/pengumuman/pengumuman/add") : Toast.error("Akses ditolak"), [router, canCreate]);
  const handleDetail = useCallback((id) => canView && router.push(`/pages/pengumuman/pengumuman/detail/${encryptIdUrl(id)}`), [router, canView]);
  const handleEdit = useCallback((id) => canEdit && router.push(`/pages/pengumuman/pengumuman/edit/${encryptIdUrl(id)}`), [router, canEdit]);

  const filterContent = useMemo(() => (
      <>
        <DropDown ref={sortRef} arrData={dataFilterSort} label="Urutkan" type="pilih" defaultValue={activeSortFilter} />
        <DropDown ref={aplikasiRef} arrData={listAplikasi} label="Aplikasi" type="pilih" defaultValue={activeAppFilter} />
      </>
    ), [activeSortFilter, activeAppFilter, listAplikasi]);

  if (!isClient) {
      return (
        <MainContent
            layout="Admin"
            loading={true}
            title="Pengumuman"
            breadcrumb={[{ label: "Beranda", href: "/pages/beranda" }, { label: "Pengumuman - Pengumuman" }]}
        >
            <div className="min-h-screen" />
        </MainContent>
      );
  }

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Pengumuman"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Pengumuman" },
                { label: "Pengumuman" }
            ]}    >
      <Formsearch
        onAdd={handleAdd}
        onSearch={handleSearch}
        onFilter={handleFilterApply}
        showAddButton={canCreate} 
        showFilterButton={true}
        showExportButton={false}
        filterContent={filterContent}
      />

      <Table
        data={dataList}
        onDetail={handleDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />

      <Paging
        pageSize={pageSize}
        pageCurrent={currentPage}
        totalData={totalData}
        navigation={handleNavigation}
      />
    </MainContent>
  );
}
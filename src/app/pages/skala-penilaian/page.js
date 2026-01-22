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

export default function MasterSkalaPenilaianPage() {
    const ssoData = useMemo(() => getSSOData(), []);
    const userData = useMemo(() => getUserData(), []);
    const router = useRouter();
    const [dataSkala, setDataSkala] = useState([]); // <-- Ganti nama state
    const [loading, setLoading] = useState(true);
    const sortRef = useRef();
    const statusRef = useRef();
    const [isClient, setIsClient] = useState(false);

    const dataFilterSort = [
        { Value: "[Skala Penilaian] asc", Text: "Skala [↑]" },
        { Value: "[Skala Penilaian] desc", Text: "Skala [↓]" },
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
            setLoading(true);
            try {
                const response = await fetchData(
                    API_LINK + "SkalaPenilaian/GetAllSkalaPenilaian",
                    {
                        Status: status,
                        ...(cari ? { SearchKeyword: cari } : {}),
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
                    "Skala": item.skala,
                    "Definisi": item.definisi,
                    "Status": item.status,
                    Aksi: [
                        ...(isClient && userData?.permission?.includes("skala_penilaian.edit")
                            ? ["Toggle", "Edit"]
                            : []),
                    ],
                    Alignment: [
                        "center",
                        "center",
                        "left",
                        "center",
                        "center",
                    ],
                }));

                setDataSkala(pagedData || []);
                setTotalData(totalData || 0);
                setCurrentPage(page);
            } catch (err) {
                Toast.error(err.message);
                setDataSkala([]);
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
        router.push("/pages/kuesioner/skala-penilaian/add");
    }, [router]);

    const handleEdit = useCallback((id) => {
        router.push(`/pages/kuesioner/skala-penilaian/edit/${encryptIdUrl(id)}`);
    }, [router]);

    const handleToggle = useCallback(
        async (id) => {
            const item = dataSkala.find((d) => d.id === id);
            if (!item) {
                Toast.error("Data tidak ditemukan.");
                return;
            }

            const newStatus = item.Status === "Aktif" ? "Tidak Aktif" : "Aktif";
            const actionText =
                newStatus === "Aktif" ? "mengaktifkan" : "menonaktifkan";

            const result = await SweetAlert({
                title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Data`,
                text: `Apakah Anda yakin ingin ${actionText} data ini?`,
                icon: "warning",
                confirmText: "Ya, saya yakin!",
            });

            if (!result) return;
            setLoading(true);

            try {
                const payload = {
                    Id: id,
                    Status: newStatus,
                };

                const data = await fetchData(
                    API_LINK + "SkalaPenilaian/SetStatusSkalaPenilaian",
                    payload,
                    "POST"
                );

                if (data.error) {
                    throw new Error(data.message);
                }

                Toast.success(data.message || "Status berhasil diubah.");
                loadData(currentPage, sortBy, search, sortStatus);
            } catch (err) {
                Toast.error(err.message);
            } finally {
                setLoading(false);
            }
        },
        [dataSkala, currentPage, sortBy, search, sortStatus, loadData]
    );

    useEffect(() => {
        setIsClient(true);
        if (ssoData) {
            loadData(currentPage, sortBy, search, sortStatus);
        }
    }, [ssoData, loadData, currentPage, sortBy, search, sortStatus]);

    useEffect(() => {
        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("/auth/login");
        }
    }, [ssoData, router]);

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
            title="Master   Skala Penilaian"
            breadcrumb={[
                { label: "Beranda", href: "/beranda" },
                { label: "Kuesioner" },
                { label: "Skala Penilaian" },
            ]}
        >
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onAdd={handleAdd}
                    onFilter={handleFilterApply}
                    showAddButton={isClient && userData?.permission?.includes("skala_penilaian.create")}
                    showExportButton={false}
                    searchPlaceholder="Cari data skala penilaian"
                    addButtonText="Tambah"
                    filterContent={filterContent}
                />
            </div>
            <div className="row align-items-center g-3">
                <div className="col-12">
                    <Table
                        data={dataSkala}
                        onDetail={null}
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
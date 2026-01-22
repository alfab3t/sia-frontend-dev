"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Paging from "@/components/common/Paging";
import Table from "@/components/common/Table";
import Toast from "@/components/common/Toast";
import DropDown from "@/components/common/Dropdown";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import Loading from "@/components/common/Loading";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { encryptIdUrl } from "@/lib/encryptor";
import { getSSOData, getUserData } from "@/context/user";

const BREADCRUMB_ITEMS = [
    { label: "Sistem Informasi Akademik", href: "./auth/sso" },
    { label: "Administrasi Akademik - Jenis Surat" }
];

export default function MasterJenisSuratPage() {
    const ssoData = useMemo(() => getSSOData(), []);
    const userData = useMemo(() => getUserData(), []);
    const router = useRouter();
    
    const [dataJenisSurat, setDataJenisSurat] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [manualLoading, setManualLoading] = useState(false);
    const sortRef = useRef();
    const statusRef = useRef();
    const peruntukanRef = useRef();
    const [isClient, setIsClient] = useState(false);
    const hasLoadedRef = useRef(false);
    
    const dataFilterSort = useMemo(() => ([
        { Value: "jsu_nama_surat asc", Text: "Nama Jenis Surat [↑]" },
        { Value: "jsu_nama_surat desc", Text: "Nama Jenis Surat [↓]" },
    ]), []);

    const dataFilterStatus = useMemo(() => ([
        { Value: "Aktif", Text: "Aktif" },
        { Value: "Tidak Aktif", Text: "Tidak Aktif" },
    ]), []);

    const dataFilterPeruntukan = useMemo(() => ([
        { Value: "1", Text: "Ya" },
        { Value: "0", Text: "Tidak" },
    ]), []);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
    const [status, setStatus] = useState("Aktif"); 
    const [peruntukan, setPeruntukan] = useState("");

    const canEdit = useMemo(() => 
        isClient && userData?.permission?.includes("jenis_surat.edit"), 
        [isClient, userData?.permission]
    );

    const loadData = useCallback(
        async (page, sort, cari, statusFilter, peruntukanFilter) => {
            try {
                setManualLoading(true);

                const params = {
                    PageNumber: page,
                    PageSize: pageSize,
                    Urut: sort,
                };

                if (cari && cari.trim() !== "") {
                    params.SearchKeyword = cari;
                }
                
                if (statusFilter && statusFilter !== "") {
                    params.Status = statusFilter;
                }

                if (peruntukanFilter && peruntukanFilter !== "") {
                    params.AllowMahasiswa = peruntukanFilter;
                }

                const responseData = await fetchData(
                    API_LINK + "JenisSurat/GetAllJenisSurat",
                    params,
                    "GET"
                );

                if (responseData.error) {
                    throw new Error(responseData.message);
                }

                const { data, totalData } = responseData;

                const pagedData = (data || []).map((item, index) => ({
                    No: (page - 1) * pageSize + index + 1,
                    id: item.id,
                    "Nama Jenis Surat": item.namaSurat,
                    "Format Nomor Surat": item.formatNoSurat || "-",
                    "Format Surat": item.formatSurat || "-", 
                    "Untuk Mahasiswa?": item.allowMahasiswaDisplay === "Ya" 
                        ? `<span class="badge bg-success" style="font-size: 0.8em; padding: 0.2em 0.6em;">Ya</span>` 
                        : `<span class="badge bg-danger" style="font-size: 0.8em; padding: 0.2em 0.6em;">Tidak</span>`,
                    Status: item.status || "Aktif",
                    Aksi: [
                        ...(canEdit ? ["Toggle", "Edit"] : [])
                    ].filter(Boolean),
                    Alignment: ["center", "left", "left", "left", "center", "center", "center"],
                }));

                setDataJenisSurat(pagedData);
                setTotalData(totalData || 0);
                setCurrentPage(page);
            } catch (err) {
                Toast.error(err.message);
                setDataJenisSurat([]);
                setTotalData(0);
            } finally {
                setManualLoading(false);
            }
        },
        [pageSize, canEdit]
    );

    const handleSearch = useCallback(
        (query) => {
            setSearch(query);
            setCurrentPage(1);
            loadData(1, sortBy, query, status, peruntukan);
        },
        [sortBy, status, peruntukan, loadData]
    );

    const handleFilterApply = useCallback(() => {
        const newSortBy = sortRef.current.value;
        const newStatus = statusRef.current.value;
        const newPeruntukan = peruntukanRef.current.value;

        setSortBy(newSortBy);
        setStatus(newStatus);
        setPeruntukan(newPeruntukan);
        setCurrentPage(1);
        loadData(1, newSortBy, search, newStatus, newPeruntukan);
    }, [search, loadData]);

    const handleNavigation = useCallback(
        (page) => {
            loadData(page, sortBy, search, status, peruntukan);
        },
        [sortBy, search, status, peruntukan, loadData]
    );

    const handleEdit = useCallback(
        (id) => {
            if (!canEdit) {
                Toast.error("Anda tidak memiliki izin untuk mengubah data jenis surat");
                return;
            }
            router.push(`/pages/administrasi-akademik/jenis-surat/edit/${encryptIdUrl(id)}`);
        },
        [router, canEdit]
    );

    const handleToggle = useCallback(
        async (id) => {
            if (!canEdit) {
                Toast.error("Anda tidak memiliki izin untuk mengubah status data jenis surat");
                return;
            }

            try {
                const currentData = dataJenisSurat.find(item => item.id === id);
                const currentStatus = currentData?.Status;
                
                const newStatus = currentStatus === "Aktif" ? "Tidak Aktif" : "Aktif";

                const data = await fetchData(
                    `${API_LINK}JenisSurat/SetStatusJenisSurat/${id}?status=${newStatus}`,
                    {},
                    "POST"
                );
                
                if (data.error) {
                    throw new Error(data.message);
                }

                if (data.message === "SUCCESS") {
                    Toast.success(`Status berhasil diubah menjadi ${newStatus}`);
                    loadData(currentPage, sortBy, search, status, peruntukan);
                } else {
                    throw new Error(data.message || "Gagal mengubah status");
                }
            } catch (err) {
                Toast.error(err.message);
            }
        },
        [currentPage, sortBy, search, status, peruntukan, loadData, dataJenisSurat, canEdit]
    );

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        
        const timer = setTimeout(() => setPageLoading(false), 200);

        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }

        if (hasLoadedRef.current) {
            return;
        }

        hasLoadedRef.current = true;
        loadData(currentPage, sortBy, search, status, peruntukan);

        return () => clearTimeout(timer);
    }, [isClient, ssoData, router, currentPage, sortBy, search, status, peruntukan, loadData]);

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
                    isDisabled={manualLoading}
                />
                <DropDown
                    ref={peruntukanRef}
                    arrData={dataFilterPeruntukan}
                    type="semua" 
                    label="Untuk Mahasiswa?"
                    forInput="peruntukan"
                    defaultValue={peruntukan}
                    isDisabled={manualLoading}
                />
                <DropDown
                    ref={statusRef}
                    arrData={dataFilterStatus}
                    type="pilih" 
                    label="Status"
                    forInput="status"
                    defaultValue={status}
                    isDisabled={manualLoading}
                />
            </>
        ),
        [
            sortBy,
            status,
            peruntukan,
            manualLoading,
            dataFilterSort,
            dataFilterPeruntukan,
            dataFilterStatus
        ]
    );

    return (
        <>
            <Loading loading={manualLoading || pageLoading} message="Memuat data..." />
            
            <MainContent
                layout="Admin"
                loading={false}
                title="Jenis Surat"
                breadcrumb={BREADCRUMB_ITEMS}
            >
                <div>
                    <Formsearch
                        onSearch={handleSearch}
                        onFilter={handleFilterApply}
                        showAddButton={false} 
                        showExportButton={false}
                        searchPlaceholder="Cari nama jenis surat"
                        filterContent={filterContent}
                        isLoading={manualLoading}
                    />
                </div>
                <div className="row align-items-center g-3">
                    <div className="col-12">
                        <Table
                            data={dataJenisSurat}
                            onEdit={handleEdit}
                            onToggle={handleToggle}
                            loading={manualLoading}
                        />
                        {totalData > 0 && !manualLoading && (
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
        </>
    );
}
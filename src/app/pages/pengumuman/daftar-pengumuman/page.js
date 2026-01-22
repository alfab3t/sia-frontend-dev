"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { getSSOData, getUserData } from "@/context/user";
import { API_LINK } from "@/lib/constant";
import { encryptIdUrl } from "@/lib/encryptor";

import Table from "@/components/common/Table";
import Formsearch from '@/components/common/Formsearch';
import MainContent from "@/components/layout/MainContent";
import fetchData from "@/lib/fetch";
import DropDown from "@/components/common/Dropdown";
import Paging from "@/components/common/Paging";


export default function DaftarPengumumanPage() {
    const ssoData = useMemo(() => getSSOData(), []);
    const userData = useMemo(() => getUserData(), []);
    const router = useRouter();
    const sortRef = useRef();
    const [pageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);

    const dataFilterSort = [
        { Value: "date desc", Text: "Tanggal Terbit [↓]" },
        { Value: "date asc", Text: "Tanggal Terbit [↑]" },
        { Value: "app desc", Text: "Aplikasi [↓]" },
        { Value: "app asc", Text: "Aplikasi [↑]" },
    ];

    const [dataPengumuman, setDataPengumuman] = useState([]);
    const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
    const [search, setSearch] = useState("");

    const loadData = useCallback(
        async (filter, cari, page) => {
            try {
                setLoading(true);

                const response = await fetchData(
                    API_LINK + "Pengumuman/GetAllPengumuman",
                    {
                        Filter: filter,
                        ...(cari === "" ? {} : { InputCari: cari }),
                        Halaman: page,
                        Limit: pageSize,
                    },
                    "GET"
                );
                if (response.error) throw new Error(response.message);

                const { data, totalData } = response;

                const pagedData = data.map((item, index) => {
                    let statusMapped = "Tidak Aktif";
                    if (item.statusPengumuman === "Tampil" || item.statusPengumuman === "Aktif") statusMapped = "Aktif";

                    let actionList = statusMapped === "Aktif"
                        ? ["Toggle", "Detail", "Preview"]
                        : ["Toggle", "Detail", "Edit", "Preview", "Delete"];

                    return {
                        id: item.idPengumuman,
                        No: (page - 1) * pageSize + index + 1,
                        Aplikasi: item.namaAplikasi,
                        "Tanggal Terbit": item.tanggalPengumumanF,
                        "Subyek Pengumuman": item.subyekPengumuman,
                        "Aksi": actionList,
                        Alignment: ["center", "center", "center", "center", "center"],
                    }
                });

                setDataPengumuman(pagedData || []);
                setTotalData(totalData || 0);
                setCurrentPage(page);
            } catch (err) {
                Toast.error(err.message);
                setDataPengumuman([]);
                setTotalData(0);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, isClient, userData]
    );

    useEffect(() => {
        setIsClient(true);

        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("./auth/login");
            return;
        }

        loadData(sortBy, search, 1);
    }, [ssoData, router, search, loadData]);

    const handleFilterApply = useCallback(() => {
        const newSortRef = sortRef.current.value;

        setSortBy(newSortRef)
        setCurrentPage(1);
        loadData(newSortRef, search, 1);
    }, [sortBy, search, loadData]);

    const handleSearch = useCallback(
        (query) => {
            setSearch(query);
            loadData(sortBy, search, 1);
        },
        [sortBy, search, loadData]
    );

    const handleDetail = useCallback((id) => {
        router.push(`/pages/pengumuman/daftar-pengumuman/detail/${encryptIdUrl(id)}`);
    }, [router]);

    const handleNavigation = useCallback(
        (page) => {
            loadData(sortBy, search, page);
        },

        [search, loadData]
    );

    const filterContent = useMemo(
        () => (
                <DropDown
                    ref={sortRef}
                    arrData={dataFilterSort}
                    type="pilih"
                    label="Urutan"
                    forInput="sortBy"
                    defaultValue={sortBy}
                />
        ),
        [sortBy, dataFilterSort]
    );

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Pengumuman"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Pengumuman" },
                { label: "Daftar Pengumuman" }
            ]}
        >
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onFilter={handleFilterApply}
                    showFilterButton={true}
                    showExportButton={false}
                    showAddButton={false}
                    filterContent={filterContent}
                >
                </Formsearch>
            </div>
            <div className="row align-items-center g-3">
                <div className="col-12">
                    <Table
                        data={dataPengumuman}
                        onDetail={handleDetail}
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
        </MainContent >
    );
}
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

function hideStatusColumnInData(arr) {
    if (!Array.isArray(arr)) return arr;

    arr.forEach((item) => {
        if (item && Object.hasOwn(item, "Status")) {
            const val = item.Status;
            Object.defineProperty(item, "Status", {
                value: val,
                enumerable: false,
                writable: true,
                configurable: true,
            });
        }
    });

    return arr;
}

export default function MasterIndustriPage() {
    const ssoData = useMemo(() => getSSOData(), []);
    const userData = useMemo(() => getUserData(), []);
    const router = useRouter();
    const [dataIndustri, setDataIndustri] = useState([]);
    const [loading, setLoading] = useState(true);
    const sortRef = useRef();
    const statusRef = useRef();
    const [isClient, setIsClient] = useState(false);

    const dataFilterSort = useMemo(
        () => [
            { Value: "ipr_nama ASC", Text: "Nama Industri [↑]" },
            { Value: "[Nama] DESC", Text: "Nama Industri [↓]" },
            { Value: "[Grup] asc", Text: "Nama Grup [↑]" },
            { Value: "[Grup] desc", Text: "Nama Grup [↓]" },
        ],
        [],
    );

    const dataFilterStatus = useMemo(
        () => [
            { Value: "Aktif", Text: "Aktif" },
            { Value: "Tidak Aktif", Text: "Tidak Aktif" },
        ],
        [],
    );

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
                    API_LINK + "MasterIndustri/GetAllMasterIndustri",
                    {
                        Status: status,
                        ...(cari === "" ? {} : { SearchKeyword: cari }),
                        Urut: sort,
                        PageNumber: page,
                        PageSize: pageSize,
                    },
                    "GET",
                );

                if (response.error) {
                    throw new Error(response.message);
                }

                const { data, totalData } = response;
                const pagedData = data.map((item, index) => ({
                    No: (page - 1) * pageSize + index + 1,
                    id: item.id,
                    "Nama Industri": item.namaIndustri,
                    Cabang: item.cabang || "-",
                    Grup: item.grup,
                    Status: item.status,
                    Aksi: [
                        "Toggle",
                        "Detail",
                        "Edit",
                        "",
                        ...(isClient &&
                        userData?.permission?.includes("industri.edit")
                            ? ["Edit", "Toggle"]
                            : []),
                    ],
                    Alignment: [
                        "center",
                        "left",
                        "center",
                        "left",
                        "center",
                        "center",
                    ],
                }));

                hideStatusColumnInData(pagedData);
                setDataIndustri(pagedData || []);
                setTotalData(totalData || 0);
                setCurrentPage(page);
            } catch (err) {
                Toast.error(err.message);
                setDataIndustri([]);
                setTotalData(0);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, userData],
    );

    const tableConfig = useMemo(
        () => ({
            widths: {
                No: "3%",
            },
        }),
        [],
    );

    const handleSearch = useCallback(
        (query) => {
            setSearch(query);
            setCurrentPage(1);
            loadData(1, sortBy, query, sortStatus);
        },
        [sortBy, sortStatus, loadData],
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
        [sortBy, search, sortStatus, loadData],
    );

    const handleAdd = useCallback(() => {
        router.push("/pages/praktik-kerja-industri/master-industri/add");
    }, [router]);

    const handleDetail = useCallback(
        (id) =>
            router.push(
                `/pages/praktik-kerja-industri/master-industri/detail/${encryptIdUrl(
                    id,
                )}`,
            ),
        [router],
    );

    const handleEdit = useCallback(
        (id) =>
            router.push(
                `/pages/praktik-kerja-industri/master-industri/edit/${encryptIdUrl(
                    id,
                )}`,
            ),
        [router],
    );

    const handleToggle = useCallback(
        async (id) => {
            const result = await SweetAlert({
                title: "Ubah Status Data Industri",
                text: "Apakah Anda yakin ingin mengubah status data industri ini?",
                icon: "warning",
                confirmText: "Ya, saya yakin!",
            });

            if (!result) return;

            setLoading(true);

            try {
                const data = await fetchData(
                    API_LINK + "MasterIndustri/SetStatus/" + id,
                    {},
                    "POST",
                );

                if (data.error) {
                    throw new Error(data.message);
                }

                Toast.success("Status data industri berhasil diubah.");
                loadData(1, sortBy, search, sortStatus);
            } catch (err) {
                Toast.error(err.message);
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
                    type=""
                    label="Urut Berdasarkan"
                    forInput="sortBy"
                    defaultValue={sortBy}
                />
                <DropDown
                    ref={statusRef}
                    arrData={dataFilterStatus}
                    type=""
                    label="Status"
                    forInput="sortStatus"
                    defaultValue={sortStatus}
                />
            </>
        ),
        [sortBy, sortStatus, dataFilterSort, dataFilterStatus],
    );

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Master Industri"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Praktik Kerja Industri" },
                { label: "Master Industri" },
            ]}
        >
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onAdd={handleAdd}
                    onFilter={handleFilterApply}
                    showAddButton={
                        isClient &&
                        userData?.permission?.includes("master_industri.create")
                    }
                    showExportButton={false}
                    searchPlaceholder="Cari data industri"
                    addButtonText="Tambah"
                    filterContent={filterContent}
                />
            </div>
            <div className="row align-items-center g-3">
                <div className="col-12">
                    <Table
                        data={dataIndustri}
                        hideColumns={["Status"]}
                        onDetail={handleDetail}
                        onEdit={handleEdit}
                        onToggle={handleToggle}
                        config={tableConfig}
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

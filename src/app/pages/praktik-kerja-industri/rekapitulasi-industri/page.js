"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Paging from "@/components/common/Paging";
import Table from "@/components/common/Table";
import Toast from "@/components/common/Toast";
import DropDown from "@/components/common/Dropdown";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";

export default function RekapitulasiIndustriPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [dataRekapIndustri, setDataRekapIndustri] = useState([]);
    const [dataRekapPivot, setDataRekapPivot] = useState([]);

    const [tahunAjaranInd, setTahunAjaranInd] = useState("2025/2026");
    const [sortByInd, setSortByInd] = useState("Nama Industri ASC");

    const [tahunAjaranPivot, setTahunAjaranPivot] = useState("2025/2026");
    const [sortByPivot, setSortByPivot] = useState("NamaGrup ASC");

    const [searchInd, setSearchInd] = useState("");
    const [searchPivot, setSearchPivot] = useState("");

    const [pagingInd, setPagingInd] = useState({ current: 1, total: 0 });
    const [pagingPivot, setPagingPivot] = useState({ current: 1, total: 0 });

    const pageSize = 10;

    const sortRefInd = useRef();
    const tahunRefInd = useRef();
    const sortRefPivot = useRef();
    const tahunRefPivot = useRef();

    const loadData = useCallback(
        async ({
            pageInd = 1,
            pagePivot = 1,
            sortInd = sortByInd,
            sortPiv = sortByPivot,
            cariInd = searchInd,
            cariPivot = searchPivot,
            tahunInd = tahunAjaranInd,
            tahunPiv = tahunAjaranPivot,
        } = {}) => {
            setLoading(true);
            try {
                const paramsInd = {
                    Keyword: cariInd,
                    OrderBy: sortInd,
                    TahunAjaran: tahunInd,
                };

                const paramsPivot = {
                    Keyword: cariPivot,
                    OrderBy: sortPiv,
                    TahunAjaran: tahunPiv,
                };

                const respInd = await fetchData(
                    API_LINK + "RekapitulasiIndustri/GetAllRekapitulasi",
                    { ...paramsInd, PageNumber: pageInd, PageSize: pageSize },
                    "GET",
                );

                const respPivot = await fetchData(
                    API_LINK + "RekapitulasiIndustri/GetAllPivot",
                    {
                        ...paramsPivot,
                        PageNumber: pagePivot,
                        PageSize: pageSize,
                    },
                    "GET",
                );

                if (respInd?.data) {
                    setDataRekapIndustri(
                        respInd.data.map((item, idx) => {
                            const key = `ind-${pageInd}-${idx}`;
                            return {
                                Key: key,
                                id: key,
                                No: (pageInd - 1) * pageSize + idx + 1,
                                "Tahun Akademik": item.tahunAjaran,
                                "Nama Industri": item.namaIndustri,
                                "Nama Grup": item.grupIndustri,
                                P4: item.p4,
                                TPM: item.tpm,
                                MI: item.mi,
                                TO: item.to,
                                MK: item.mk,
                                TAB: item.tab,
                                TPHP: item.tphp,
                                "Jumlah (Mahasiswa)": item.jumlah,
                                Aksi: ["Detail"],
                                Alignment: [
                                    "center",
                                    "center",
                                    "left",
                                    "left",
                                    "center",
                                    "center",
                                    "center",
                                    "center",
                                    "center",
                                    "center",
                                    "center",
                                    "center",
                                    "center",
                                ],
                            };
                        }),
                    );
                    setPagingInd({
                        current: pageInd,
                        total: respInd.totalData || 0,
                    });
                }

                if (respPivot) {
                    setDataRekapPivot(
                        respPivot.map((item, idx) => {
                            const key = `pivot-${pagePivot}-${idx}`;
                            return {
                                Key: key,
                                id: key,
                                No: (pagePivot - 1) * pageSize + idx + 1,
                                "Program Studi": item.programStudi,
                                ...item.jumlahPerIndustri,
                                Total: item.total,
                                "Jumlah Mahasiswa": item.jumlahMahasiswa,
                                Sisa: item.sisa,
                                Alignment: new Array(
                                    Object.keys(item.jumlahPerIndustri).length +
                                        5,
                                )
                                    .fill("center")
                                    .map((val, i) =>
                                        i === 1 ? "left" : "center",
                                    ),
                            };
                        }),
                    );
                    setPagingPivot({
                        current: pagePivot,
                        total: respPivot[0]?.totalData || respPivot.length,
                    });
                }
            } catch (err) {
                console.error("Error loading rekapitulasi data:", err);
                Toast.error("Gagal memuat data rekapitulasi.");
            } finally {
                setLoading(false);
            }
        },
        [
            sortByInd,
            sortByPivot,
            searchInd,
            searchPivot,
            tahunAjaranInd,
            tahunAjaranPivot,
        ],
    );

    const handleDetail = useCallback(
        (rowKey) => {
            const row = dataRekapIndustri.find((item) => item.Key === rowKey);
            if (!row) return;

            router.push(
                `/pages/praktik-kerja-industri/rekapitulasi-industri/detail?nama=${encodeURIComponent(
                    row["Nama Industri"],
                )}&tahun=${encodeURIComponent(
                    row["Tahun Akademik"].replaceAll(" ", ""),
                )}`,
            );
        },
        [router, dataRekapIndustri],
    );

    useEffect(() => {
        loadData({
            pageInd: 1,
            pagePivot: 1,
            sortInd: sortByInd,
            sortPiv: sortByPivot,
            cariInd: searchInd,
            cariPivot: searchPivot,
            tahunInd: tahunAjaranInd,
            tahunPiv: tahunAjaranPivot,
        });
    }, [loadData]);

    const handleFilterApplyInd = () => {
        const newSort = sortRefInd.current.value;
        const newTahun = tahunRefInd.current.value;
        setSortByInd(newSort);
        setTahunAjaranInd(newTahun);
        loadData({
            pageInd: 1,
            pagePivot: pagingPivot.current,
            sortInd: newSort,
            sortPiv: sortByPivot,
            cariInd: searchInd,
            cariPivot: searchPivot,
            tahunInd: newTahun,
            tahunPiv: tahunAjaranPivot,
        });
    };

    const handleFilterApplyPivot = () => {
        const newSort = sortRefPivot.current.value;
        const newTahun = tahunRefPivot.current.value;
        setSortByPivot(newSort);
        setTahunAjaranPivot(newTahun);
        loadData({
            pageInd: pagingInd.current,
            pagePivot: 1,
            sortInd: sortByInd,
            sortPiv: newSort,
            cariInd: searchInd,
            cariPivot: searchPivot,
            tahunInd: tahunAjaranInd,
            tahunPiv: newTahun,
        });
    };

    const generateTahunAjaran = (startYear, endYear) => {
        const years = [];
        for (let i = startYear; i >= endYear; i--) {
            const period = `${i}/${i + 1}`;
            years.push({ Value: period, Text: period });
        }
        return years;
    };

    const filterContentInd = useMemo(
        () => (
            <>
                <DropDown
                    ref={sortRefInd}
                    label="Urut Berdasarkan"
                    forInput="sortBy"
                    arrData={[
                        {
                            Value: "Nama Industri ASC",
                            Text: "Nama Industri [↑]",
                        },
                        {
                            Value: "Nama Industri DESC",
                            Text: "Nama Industri [↓]",
                        },
                        { Value: "Nama Grup ASC", Text: "Nama Grup [↑]" },
                        { Value: "Nama Grup DESC", Text: "Nama Grup [↓]" },
                        { Value: "Jumlah ASC", Text: "Jumlah [↑]" },
                        { Value: "Jumlah DESC", Text: "Jumlah [↓]" },
                    ]}
                    defaultValue={sortByInd}
                />
                <DropDown
                    ref={tahunRefInd}
                    label="Tahun Akademik"
                    forInput="tahun"
                    arrData={generateTahunAjaran(2025, 2017)}
                    defaultValue={tahunAjaranInd}
                />
            </>
        ),
        [sortByInd, tahunAjaranInd],
    );

    const filterContentPivot = useMemo(
        () => (
            <>
                <DropDown
                    ref={sortRefPivot}
                    label="Urut Berdasarkan"
                    forInput="sortBy"
                    arrData={[
                        { Value: "NamaGrup ASC", Text: "Program Studi [↑]" },
                        { Value: "NamaGrup DESC", Text: "Program Studi [↓]" },
                        {
                            Value: "NamaIndustri ASC",
                            Text: "Total Industri [↑]",
                        },
                        {
                            Value: "NamaIndustri DESC",
                            Text: "Total Industri [↓]",
                        },
                        { Value: "Jumlah ASC", Text: "Jumlah Mahasiswa [↑]" },
                        { Value: "Jumlah DESC", Text: "Jumlah Mahasiswa [↓]" },
                    ]}
                    defaultValue={sortByPivot}
                />
                <DropDown
                    ref={tahunRefPivot}
                    label="Tahun Akademik"
                    forInput="tahun"
                    arrData={generateTahunAjaran(2025, 2017)}
                    defaultValue={tahunAjaranPivot}
                />
            </>
        ),
        [sortByPivot, tahunAjaranPivot],
    );

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Rekapitulasi Industri"
            breadcrumb={[
                { label: "Sistem Informasi Akademik", href: "/" },
                { label: "Praktik Kerja Industri" },
                { label: "Rekapitulasi Industri" },
            ]}
        >
            <div className="d-flex flex-column gap-5">
                <div className="card border-0 shadow-sm p-3">
                    <Formsearch
                        onSearch={(q) => {
                            setSearchInd(q);
                            loadData({
                                pageInd: 1,
                                pagePivot: pagingPivot.current,
                                sortInd: sortByInd,
                                sortPiv: sortByPivot,
                                cariInd: q,
                                cariPivot: searchPivot,
                                tahunInd: tahunAjaranInd,
                                tahunPiv: tahunAjaranPivot,
                            });
                        }}
                        onFilter={handleFilterApplyInd}
                        showExportButton={false}
                        filterContent={filterContentInd}
                        showAddButton={false}
                    />
                    <div className="table-responsive mt-3">
                        <Table
                            data={dataRekapIndustri}
                            onDetail={handleDetail}
                        />
                    </div>
                    <Paging
                        pageSize={pageSize}
                        pageCurrent={pagingInd.current}
                        totalData={pagingInd.total}
                        navigation={(p) =>
                            loadData({
                                pageInd: p,
                                pagePivot: pagingPivot.current,
                                sortInd: sortByInd,
                                sortPiv: sortByPivot,
                                cariInd: searchInd,
                                cariPivot: searchPivot,
                                tahunInd: tahunAjaranInd,
                                tahunPiv: tahunAjaranPivot,
                            })
                        }
                    />
                </div>

                <div className="card border-0 shadow-sm p-3">
                    <Formsearch
                        onSearch={(q) => {
                            setSearchPivot(q);
                            loadData({
                                pageInd: pagingInd.current,
                                pagePivot: 1,
                                sortInd: sortByInd,
                                sortPiv: sortByPivot,
                                cariInd: searchInd,
                                cariPivot: q,
                                tahunInd: tahunAjaranInd,
                                tahunPiv: tahunAjaranPivot,
                            });
                        }}
                        showAddButton={false}
                        showExportButton={false}
                        filterContent={filterContentPivot}
                        onFilter={handleFilterApplyPivot}
                    />
                    <div className="table-responsive mt-3">
                        <Table data={dataRekapPivot} />
                    </div>
                    <Paging
                        pageSize={pageSize}
                        pageCurrent={pagingPivot.current}
                        totalData={pagingPivot.total}
                        navigation={(p) =>
                            loadData({
                                pageInd: pagingInd.current,
                                pagePivot: p,
                                sortInd: sortByInd,
                                sortPiv: sortByPivot,
                                cariInd: searchInd,
                                cariPivot: searchPivot,
                                tahunInd: tahunAjaranInd,
                                tahunPiv: tahunAjaranPivot,
                            })
                        }
                    />
                </div>
            </div>
        </MainContent>
    );
}

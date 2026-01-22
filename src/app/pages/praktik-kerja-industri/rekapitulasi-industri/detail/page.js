"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import Table from "@/components/common/Table";
import Paging from "@/components/common/Paging";
import Button from "@/components/common/Button";
import Label from "@/components/common/Label";
import Toast from "@/components/common/Toast";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import PropTypes from "prop-types";

const DetailItem = ({ label, value }) => (
    <div className="col-lg-4 mb-3">
        <Label text={label} className="mb-1" />
        <div className="fw-medium">
            {value !== null && value !== undefined && value !== ""
                ? value
                : "-"}
        </div>
    </div>
);

DetailItem.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
};

function DetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const namaIndustri = searchParams.get("nama");
    const tahunAjaran = searchParams.get("tahun");

    const [loading, setLoading] = useState(false);
    const [dataDetail, setDataDetail] = useState([]);
    const [paging, setPaging] = useState({ current: 1, total: 0 });

    const pageSize = 10;

    const tableConfig = useMemo(
        () => ({
            columns: [
                "No",
                "Tahun Akademik",
                "Cabang",
                "NIM",
                "Nama Mahasiswa",
                "Prodi",
            ],
            widths: {
                No: "60px",
                "Tahun Akademik": "140px",
                Cabang: "100px",
                NIM: "140px",
                "Nama Mahasiswa": "auto",
                Prodi: "120px",
            },
        }),
        [],
    );

    const loadDetailData = useCallback(
        async (page = 1) => {
            if (!namaIndustri || !tahunAjaran) return;

            setLoading(true);
            try {
                const params = {
                    NamaIndustri: namaIndustri,
                    TahunAjaran: tahunAjaran,
                    PageNumber: page,
                    PageSize: pageSize,
                };

                const response = await fetchData(
                    API_LINK + "RekapitulasiIndustri/DetailRekapitulasi",
                    params,
                    "GET",
                );

                if (response?.data && Array.isArray(response.data)) {
                    setDataDetail(
                        response.data.map((item, idx) => {
                            const key = `detail-${page}-${idx}`;
                            return {
                                Key: key,
                                id: key,
                                No: (page - 1) * pageSize + idx + 1,
                                "Tahun Akademik": item.tahunAjaran || "-",
                                Cabang: item.cabangIndustri || "-",
                                NIM: item.nim || "-",
                                "Nama Mahasiswa": item.namaMahasiswa || "-",
                                Prodi: item.konsentrasi || "-",
                                Alignment: [
                                    "center",
                                    "center",
                                    "center",
                                    "center",
                                    "left",
                                    "center",
                                ],
                            };
                        }),
                    );

                    setPaging({
                        current: page,
                        total: response.totalData || 0,
                    });
                } else {
                    setDataDetail([]);
                }
            } catch (err) {
                console.error("Error loading detail:", err);
                Toast.error("Gagal memuat detail mahasiswa.");
            } finally {
                setLoading(false);
            }
        },
        [namaIndustri, tahunAjaran],
    );

    useEffect(() => {
        loadDetailData(1);
    }, [loadDetailData]);

    return (
        <>
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                    <h5 className="text-primary mb-3 pb-2 border-bottom">
                        Informasi Rekapitulasi
                    </h5>

                    <div className="row">
                        <DetailItem
                            label="Nama Industri"
                            value={namaIndustri}
                        />
                        <DetailItem
                            label="Tahun Akademik"
                            value={tahunAjaran}
                        />
                        <DetailItem
                            label="Jumlah Mahasiswa"
                            value={paging.total}
                        />
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <h6 className="fw-semibold mb-3">
                        Daftar Mahasiswa Prakerin
                    </h6>

                    <div className="table-responsive">
                        <Table
                            data={dataDetail}
                            config={tableConfig}
                            isLoading={loading}
                        />
                    </div>

                    <div className="mt-3">
                        <Paging
                            pageSize={pageSize}
                            pageCurrent={paging.current}
                            totalData={paging.total}
                            navigation={(p) => loadDetailData(p)}
                        />
                    </div>
                </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
                <Button
                    classType="secondary"
                    label="Kembali"
                    onClick={() => router.back()}
                />
            </div>
        </>
    );
}

export default function DetailRekapIndustriPage() {
    return (
        <MainContent
            layout="Admin"
            title="Rekapitulasi Industri"
            breadcrumb={[
                { label: "Sistem Informasi Akademik", href: "/" },
                {
                    label: "Rekapitulasi Industri",
                    href: "/praktik-kerja-industri/rekapitulasi-industri",
                },
                { label: "Detail Mahasiswa" },
            ]}
        >
            <Suspense
                fallback={<div className="p-5 text-center">Memuat Data...</div>}
            >
                <DetailContent />
            </Suspense>
        </MainContent>
    );
}

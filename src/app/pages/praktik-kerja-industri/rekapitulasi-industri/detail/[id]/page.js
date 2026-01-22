"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import Table from "@/components/common/Table";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import { decryptIdUrl } from "@/lib/encryptor";

export default function DetailRekapitulasiPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    // Mengambil Nama Industri dari URL query atau state untuk judul
    const namaIndustri = searchParams.get("nama") || "Industri";
    const id = decryptIdUrl(params.id);

    const [dataMahasiswa, setDataMahasiswa] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!id) {
            Toast.error("ID tidak valid");
            router.back();
            return;
        }

        try {
            setLoading(true);
            const response = await fetchData(
                `${API_LINK}RekapitulasiIndustri/detail`,
                { idIndustri: id },
                "GET",
            );

            if (response && Array.isArray(response)) {
                const formatted = response.map((mhs, idx) => ({
                    No: idx + 1,
                    "Tahun Akademik": mhs.tahunAkademik,
                    Cabang: mhs.cabang || "-",
                    NIM: mhs.nim,
                    "Nama Mahasiswa": mhs.namaMahasiswa,
                    Prodi: mhs.prodi,
                    Alignment: [
                        "center",
                        "center",
                        "center",
                        "center",
                        "left",
                        "left",
                    ],
                }));
                setDataMahasiswa(formatted);
            }
        } catch {
            Toast.error("Gagal memuat daftar mahasiswa");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title={`Daftar Mahasiswa Prakerin di ${namaIndustri}`}
            breadcrumb={[
                { label: "Sistem Informasi Akademik", href: "/" },
                { label: "Praktik Kerja Industri" },
                {
                    label: "Rekapitulasi Industri",
                    href: "/pages/rekapitulasi-industri",
                },
                { label: "Detail Mahasiswa" },
            ]}
        >
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <div className="table-responsive">
                        <Table data={dataMahasiswa} />
                    </div>

                    <div className="d-flex justify-content-start mt-4">
                        <Button
                            classType="secondary"
                            label="Kembali"
                            iconName="arrow-left"
                            onClick={() => router.back()}
                        />
                    </div>
                </div>
            </div>
        </MainContent>
    );
}

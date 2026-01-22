"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PropTypes from "prop-types";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";
import { getSSOData } from "@/context/user";

const DetailItem = ({ label, value }) => (
    <div className="col-lg-6 mb-3">
        <div className="detail-item">
            <small className="text-muted d-block mb-1">
                <strong>{label}</strong>
            </small>
            {value !== null && value !== undefined && value !== "" ? value : "-"}
        </div>
    </div>
);

DetailItem.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
};

const KriteriaTable = ({ data }) => (
    <div className="table-responsive mt-3">
        <table className="table table-bordered table-hover">
            <thead className="table-light">
                <tr>
                    <th>Kriteria</th>
                    <th>Persentase (%)</th>
                </tr>
            </thead>
            <tbody>
                {data && data.length > 0 ? (
                    data.map((item, index) => (
                        <tr key={item.id || item.Id || index}>
                            <td>{item.Kriteria || item.kriteria}</td>
                            <td className="text-end">{item.Persentase || item.persentase}%</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="2" className="text-center text-muted">
                            Tidak ada data kriteria
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

KriteriaTable.propTypes = {
    data: PropTypes.array,
};

const StatusBadge = ({ status }) => {
    const getBadgeClass = () => {
        const statusLower = (status || "").toLowerCase();
        if (statusLower === "disetujui") return "badge bg-success";
        if (statusLower === "ditolak") return "badge bg-danger";
        if (statusLower === "draft") return "badge bg-warning text-dark";
        if (statusLower === "revisi") return "badge bg-warning text-dark";
        if (statusLower.includes("menunggu approval")) return "badge bg-info";
        return "badge bg-secondary";
    };
    return (
        <span className={getBadgeClass()}>
            {status}
        </span>
    );
};

StatusBadge.propTypes = {
    status: PropTypes.string.isRequired,
};

export default function DetailKriteriaPenilaianDosenPage() {
    const path = useParams();
    const router = useRouter();
    const id = decryptIdUrl(path.id);
    const ssoData = getSSOData();

    const [data, setData] = useState(null);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalProsentase, setTotalProsentase] = useState(0);

    const hasLoaded = useRef(false);

    const loadData = useCallback(async () => {
        if (hasLoaded.current) {
            return;
        }
        if (!id) {
            Toast.error("ID kriteria tidak valid.");
            router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
            return;
        }

        try {
            setLoading(true);

            const response = await fetchData(
                `${API_LINK}Kriteria/DetailKriteria/${id}`,
                {},
                "GET"
            );

            if (response.success && response.data) {
                const kriteriaData = response.data.kriteria || response.data.Kriteria || response.data;
                const detailsData = kriteriaData.details || kriteriaData.Details || response.data.details || [];

                const status = kriteriaData.status || kriteriaData.Status || "";

                const formattedData = {
                    tahunAjaran: kriteriaData.tahunAjaran || kriteriaData.TahunAjaran || "",
                    semester: kriteriaData.semester || kriteriaData.Semester || "",
                    mataKuliah: kriteriaData.mataKuliah || kriteriaData.MataKuliah || "",
                    dosen: kriteriaData.dosen || kriteriaData.Dosen || "",
                    status: status,
                    alasanTolak: kriteriaData.alasanTolak || kriteriaData.AlasanTolak || kriteriaData.alasan || "",
                    id: kriteriaData.id || kriteriaData.Id || id,
                    createdBy: kriteriaData.createdBy || kriteriaData.CreatedBy || "",
                    tipeKriteria: kriteriaData.tipeKriteria || kriteriaData.TipeKriteria || "",
                    konsentrasi: kriteriaData.konsentrasi || kriteriaData.Konsentrasi || ""
                };

                const total = detailsData.reduce((sum, item) => {
                    return sum + (Number.parseInt(item.Persentase || item.persentase || 0) || 0);
                }, 0);

                setData(formattedData);
                setDetails(detailsData);
                setTotalProsentase(total);
                hasLoaded.current = true;
            } else {
                Toast.error(response.message || "Gagal memuat data kriteria");
                router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
            }
        } catch (err) {
            Toast.error("Terjadi kesalahan saat memuat data kriteria");
            console.error("Error loading kriteria detail:", err);
            router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    const handleBack = useCallback(() => {
        router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
    }, [router]);

    useEffect(() => {
        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }

        if (id && !hasLoaded.current) {
            loadData();
        }
    }, [id, ssoData, router, loadData]);

    if (loading && !data) {
        return (
            <MainContent
                layout="Admin"
                loading={true}
                title="Detail Kriteria Penilaian Dosen"
                breadcrumb={[
                    { label: "Beranda", href: "/pages/beranda" },
                    { label: "Hasil Studi" },
                    { label: "Kriteria Penilaian Dosen", href: "/pages/hasil-studi/kriteria-penilaian-dosen" },
                    { label: "Detail" },
                ]}
            />
        );
    }

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Detail Kriteria Penilaian Dosen"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Hasil Studi" },
                { label: "Kriteria Penilaian Dosen", href: "/pages/hasil-studi/kriteria-penilaian-dosen" },
                { label: "Detail" },
            ]}
        >
            <div className="card border-0 shadow-lg">
                <div className="card-body p-4">
                    {data ? (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="text-primary mb-0">Informasi Kriteria Penilaian</h5>
                            </div>
                            <div className="row mb-4">
                                <DetailItem label="Tahun Akademik" value={data.tahunAjaran} />
                                <DetailItem label="Semester" value={data.semester} />
                                <DetailItem label="Status" value={<StatusBadge status={data.status} />} />
                                <DetailItem label="Dosen" value={data.dosen} />
                                <DetailItem label="Mata Kuliah" value={data.mataKuliah} />
                                <DetailItem label="Program Studi" value={data.konsentrasi} />
                                <DetailItem label="Alasan Penolakan" value={data.alasanTolak} />
                            </div>

                            

                            <div className="mb-4">
                                <h5 className="text-primary mb-3 pb-2 border-bottom">
                                    Kriteria Penilaian
                                </h5>
                                <KriteriaTable data={details} />
                                <div className="mt-3 text-end">
                                    <small className={`${totalProsentase === 100 ? 'text-success' : 'text-danger'} fw-bold`}>
                                        Total: {totalProsentase}%
                                        {totalProsentase !== 100 && " (Harus 100%)"}
                                    </small>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-5">
                            <div className="alert alert-warning">
                                <h5>Data Tidak Ditemukan</h5>
                                <p className="mb-0">
                                    Data kriteria dengan ID <strong>{id}</strong> tidak ditemukan.
                                </p>
                            </div>
                            <Button
                                classType="primary"
                                label="Kembali ke Daftar Kriteria"
                                onClick={handleBack}
                                type="button"
                            />
                        </div>
                    )}

                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="d-flex justify-content-between">
                                <Button
                                    classType="secondary"
                                    label="Kembali"
                                    onClick={handleBack}
                                    type="button"
                                    iconName="arrow-left"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainContent>
    );
}
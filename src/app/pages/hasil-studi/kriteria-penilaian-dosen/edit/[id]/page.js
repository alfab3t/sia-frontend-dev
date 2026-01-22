"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PropTypes from "prop-types";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import SweetAlert from "@/components/common/SweetAlert";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl } from "@/lib/encryptor";
import { getSSOData, getUserData } from "@/context/user";

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
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.number]),
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
    status: PropTypes.string,
};

export default function EditKriteriaPenilaianDosenPage() {
    const path = useParams();
    const router = useRouter();
    const id = decryptIdUrl(path.id);
    const ssoData = getSSOData();
    const userData = getUserData();

    const [formData, setFormData] = useState({
        tahunAjaran: "",
        semester: "",
        mataKuliah: "",
        mataKuliahId: "",
        dosen: "",
        status: "",
        alasanTolak: "",
        kniId: "",
        tipeKriteria: "",
        konsentrasi: "",
    });

    const [kriteriaData, setKriteriaData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [errors, setErrors] = useState({});
    const [totalProsentase, setTotalProsentase] = useState(0);

    const hasLoaded = useRef(false);

    const loadInitialData = useCallback(async () => {
        if (hasLoaded.current || loadingData) {
            return;
        }
        if (!id || id === "null" || id === "undefined") {
            Toast.error("ID kriteria tidak valid");
            router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
            return;
        }

        try {
            setLoadingData(true);
            hasLoaded.current = true;

            const response = await fetchData(
                `${API_LINK}Kriteria/DetailKriteria/${id}`,
                {},
                "GET"
            );

            if (response.success && response.data) {
                const data = response.data;
                const kriteriaInfo = data.kriteria || data.Kriteria || data;
                const details = kriteriaInfo.details || kriteriaInfo.Details || data.details || [];

                
                const canEdit = userData?.permission?.includes("kriteria_penilaian_dosen.edit");
                if (!canEdit) {
                    Toast.error("Anda tidak memiliki izin untuk mengedit kriteria ini");
                    router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
                    return;
                }

                const status = kriteriaInfo.status || kriteriaInfo.Status || "";
                const statusLower = status.toLowerCase();

                
                if (statusLower !== "draft" && statusLower !== "revisi") {
                    Toast.error("Kriteria tidak dapat diedit. Hanya status Draft atau Revisi yang dapat diedit.");
                    router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
                    return;
                }

                const tahunAjaran = kriteriaInfo.tahunAjaran || kriteriaInfo.TahunAjaran || "";
                const semester = kriteriaInfo.semester || kriteriaInfo.Semester || "";
                const mataKuliahNama = kriteriaInfo.mataKuliah || kriteriaInfo.MataKuliah || "";
                const mataKuliahId = kriteriaInfo.mataKuliahId || kriteriaInfo.MataKuliahId || "";
                const dosen = kriteriaInfo.dosen || kriteriaInfo.Dosen || "";
                const alasanTolak = kriteriaInfo.alasanTolak || kriteriaInfo.AlasanTolak || "";
                const tipeKriteria = kriteriaInfo.tipeKriteria || kriteriaInfo.TipeKriteria || "";
                const konsentrasi = kriteriaInfo.konsentrasi || kriteriaInfo.Konsentrasi || "";
                const kniId = kriteriaInfo.id || kriteriaInfo.Id || id;

                setFormData({
                    tahunAjaran,
                    semester,
                    mataKuliah: mataKuliahNama,
                    mataKuliahId: mataKuliahId,
                    dosen,
                    status: status,
                    alasanTolak: alasanTolak,
                    tipeKriteria: tipeKriteria,
                    konsentrasi: konsentrasi,
                    kniId: kniId
                });

                if (details.length > 0) {
                    const formattedDetails = details.map((item, index) => ({
                        id: Date.now() + index,
                        Kriteria: item.Kriteria || item.kriteria || "",
                        Persentase: Number.parseInt(item.Persentase || item.persentase || 0)
                    }));
                    setKriteriaData(formattedDetails);
                    const total = formattedDetails.reduce((sum, item) =>
                        sum + (Number.parseInt(item.Persentase) || 0), 0
                    );
                    setTotalProsentase(total);
                } else {
                    setKriteriaData([{ id: Date.now(), Kriteria: "", Persentase: 0 }]);
                    setTotalProsentase(0);
                }
            } else {
                throw new Error(response.message || "Data tidak ditemukan");
            }
        } catch (err) {
            Toast.error("Gagal memuat data kriteria: " + err.message);
            router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
        } finally {
            setLoadingData(false);
        }
    }, [id, router, userData]); 

    const handleKriteriaChange = useCallback((index, field, value) => {
        setKriteriaData(prev => {
            const newData = prev.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        [field]: field === 'Persentase' ? Math.max(0, Math.min(100, Number.parseInt(value) || 0)) : value
                    }
                    : item
            );
            const total = newData.reduce((sum, item) =>
                sum + (Number.parseInt(item.Persentase) || 0), 0
            );
            setTotalProsentase(total);
            return newData;
        });

        if (errors.kriteria || errors.prosentase) {
            setErrors(prev => ({ ...prev, kriteria: "", prosentase: "" }));
        }
    }, [errors]);

    const handleAddKriteria = useCallback(() => {
        setKriteriaData(prev => {
            const newData = [
                ...prev,
                { id: Date.now(), Kriteria: "", Persentase: 0 }
            ];
            const total = newData.reduce((sum, item) =>
                sum + (Number.parseInt(item.Persentase) || 0), 0
            );
            setTotalProsentase(total);
            return newData;
        });
    }, []);

    const handleRemoveKriteria = useCallback((index) => {
        if (kriteriaData.length <= 1) {
            Toast.error("Minimal harus ada satu kriteria");
            return;
        }
        setKriteriaData(prev => {
            const newData = prev.filter((_, i) => i !== index);
            const total = newData.reduce((sum, item) =>
                sum + (Number.parseInt(item.Persentase) || 0), 0
            );
            setTotalProsentase(total);
            return newData;
        });
    }, [kriteriaData]);

    const validateForm = useCallback(() => {
        const newErrors = {};
        const hasEmptyKriteria = kriteriaData.some(item => !item.Kriteria?.trim());
        const hasInvalidProsentase = kriteriaData.some(item =>
            Number.isNaN(item.Persentase) || item.Persentase < 0 || item.Persentase > 100
        );

        if (hasEmptyKriteria) {
            newErrors.kriteria = "Nama kriteria tidak boleh kosong";
        }
        if (hasInvalidProsentase) {
            newErrors.prosentase = "Prosentase harus antara 0-100";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [kriteriaData]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        
        if (!userData?.permission?.includes("kriteria_penilaian_dosen.edit")) {
            Toast.error("Anda tidak memiliki izin untuk mengedit kriteria ini");
            return;
        }

        
        const statusLower = formData.status?.toLowerCase() || "";
        if (statusLower !== "draft" && statusLower !== "revisi") {
            Toast.error("Kriteria tidak dapat diedit. Hanya status Draft atau Revisi yang dapat diedit.");
            return;
        }

        if (!validateForm()) {
            return;
        }

        if (totalProsentase !== 100) {
            Toast.error(`Total bobot harus 100% (saat ini: ${totalProsentase}%)`);
            return;
        }

        const hasEmptyKriteria = kriteriaData.some(item => !item.Kriteria?.trim());
        const hasInvalidProsentase = kriteriaData.some(item =>
            Number.isNaN(item.Persentase) || item.Persentase <= 0 || item.Persentase > 100
        );

        if (hasEmptyKriteria) {
            Toast.error("Semua nama kriteria harus diisi");
            return;
        }
        if (hasInvalidProsentase) {
            Toast.error("Semua bobot harus diisi dengan nilai 1-100");
            return;
        }

        const result = await SweetAlert({
            title: "Update Kriteria",
            text: "Apakah Anda yakin ingin memperbarui kriteria penilaian ini?",
            icon: "warning",
            confirmText: "Ya, Update",
            showCancelButton: true,
        });

        if (!result) return;

        setLoading(true);

        try {
            const finalTotal = kriteriaData.reduce((sum, item) =>
                sum + (Number.parseInt(item.Persentase) || 0), 0
            );

            if (finalTotal !== 100) {
                Toast.error(`Total bobot harus tepat 100% (saat ini: ${finalTotal}%). Silakan periksa kembali.`);
                setLoading(false);
                return;
            }

            const payload = {
                KriteriaId: id,
                KriteriaDetails: kriteriaData.map(item => ({
                    Kriteria: item.Kriteria,
                    Persentase: item.Persentase
                }))
            };

            const response = await fetchData(
                `${API_LINK}Kriteria/UpdateKriteria`,
                payload,
                "PUT"
            );

            if (response.success) {
                Toast.success("Kriteria penilaian berhasil diperbarui");
                router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
            } else {
                throw new Error(response.message || "Gagal memperbarui data");
            }
        } catch (err) {
            Toast.error("Gagal memperbarui kriteria: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [id, kriteriaData, totalProsentase, validateForm, router, userData, formData.status]);

    const handleCancel = useCallback(() => {
        router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
    }, [router]);

    useEffect(() => {
        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }

        if (id && !hasLoaded.current) {
            loadInitialData();
        }
    }, [id, ssoData, router, loadInitialData]);

    if (loadingData) {
        return (
            <MainContent
                layout="Admin"
                loading={true}
                title="Edit Kriteria Penilaian Dosen"
                breadcrumb={[
                    { label: "Beranda", href: "/pages/beranda" },
                    { label: "Hasil Studi" },
                    { label: "Kriteria Penilaian Dosen", href: "/pages/hasil-studi/kriteria-penilaian-dosen" },
                    { label: "Edit" },
                ]}
            />
        );
    }

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Edit Kriteria Penilaian Dosen"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Hasil Studi" },
                { label: "Kriteria Penilaian Dosen", href: "/pages/hasil-studi/kriteria-penilaian-dosen" },
                { label: "Edit" },
            ]}
        >
            <div className="card border-0 shadow-lg">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="text-primary mb-0">Edit Kriteria Penilaian</h5>
                    </div>

                    <div className="mb-4">
                        <h5 className="text-primary mb-3 pb-2 border-bottom">
                            Informasi Kriteria Penilaian
                        </h5>
                        <div className="row mb-4">
                            <DetailItem label="Tahun Akademik" value={formData.tahunAjaran} />
                            <DetailItem label="Semester" value={formData.semester} />
                            <DetailItem label="Status" value={<StatusBadge status={formData.status} />} />
                            <DetailItem label="Dosen" value={formData.dosen} />
                            <DetailItem label="Mata Kuliah" value={formData.mataKuliah} />
                            <DetailItem label="Program Studi" value={formData.konsentrasi} />
                            <DetailItem label="Alasan Penolakan" value={formData.alasanTolak} />
                            
                        </div>

                        
                    </div>

                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="text-primary mb-3 pb-2 border-bottom">
                                Kriteria Penilaian
                            </h5>
                            <Button
                                classType="outline-primary"
                                iconName="plus"
                                label="Tambah Kriteria"
                                onClick={handleAddKriteria}
                                type="button"
                                size="sm"
                                disabled={loading}
                            />
                        </div>

                        <div className="table-responsive mt-3">
                            <table className="table table-bordered table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Kriteria</th>
                                        <th>Persentase (%)</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kriteriaData.length > 0 ? (
                                        kriteriaData.map((item, index) => (
                                            <tr key={item.id || index}>
                                                <td>
                                                    <Input
                                                        name={`kriteria-${index}`}
                                                        value={item.Kriteria}
                                                        onChange={(e) => handleKriteriaChange(index, 'Kriteria', e.target.value)}
                                                        error={errors.kriteria && index === 0 ? errors.kriteria : ""}
                                                        placeholder="Nama kriteria"
                                                        hideLabel
                                                        disabled={loading}
                                                    />
                                                </td>
                                                <td>
                                                    <Input
                                                        type="number"
                                                        name={`prosentase-${index}`}
                                                        value={item.Persentase}
                                                        onChange={(e) => handleKriteriaChange(index, 'Persentase', e.target.value)}
                                                        error={errors.prosentase && index === 0 ? errors.prosentase : ""}
                                                        placeholder="0-100"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        hideLabel
                                                        disabled={loading}
                                                        className="text-end"
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    {kriteriaData.length > 1 && (
                                                        <Button
                                                            classType="outline-danger"
                                                            label=""
                                                            onClick={() => handleRemoveKriteria(index)}
                                                            type="button"
                                                            iconName="trash"
                                                            size="sm"
                                                            disabled={loading}
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center text-muted">
                                                Tidak ada data kriteria
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 text-end">
                            <small className={`${totalProsentase === 100 ? 'text-success' : 'text-danger'} fw-bold`}>
                                Total: {totalProsentase}%
                                {totalProsentase !== 100 && " (Harus 100%)"}
                            </small>
                        </div>
                    </div>

                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="d-flex justify-content-between">
                                <Button
                                    classType="secondary"
                                    label="Kembali"
                                    onClick={handleCancel}
                                    type="button"
                                    iconName="arrow-left"
                                />
                                <div className="d-flex gap-2">
                                    <Button
                                        classType="secondary"
                                        label="Batal"
                                        onClick={handleCancel}
                                        type="button"
                                    />
                                    <Button
                                        classType="primary"
                                        iconName={loading ? "" : "save"}
                                        label={loading ? "Menyimpan..." : "Simpan Perubahan"}
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading || totalProsentase !== 100}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainContent>
    );
}
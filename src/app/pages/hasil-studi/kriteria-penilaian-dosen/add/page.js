"use client";
import { useState, useCallback, useEffect } from "react";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import { useRouter } from "next/navigation";
import Toast from "@/components/common/Toast";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import { getUserData, getSSOData } from "@/context/user";

export default function AddKriteriaPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        TahunAjaran: "",
        Semester: "",
        MataKuliahId: "",
        Jenis: "",
        Details: [],
    });

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [errors, setErrors] = useState({});
    const [dataTahunAkademik, setDataTahunAkademik] = useState([]);
    const [dataMataKuliah, setDataMataKuliah] = useState([]);
    const [loadingTemplate, setLoadingTemplate] = useState(false);

    const dataSemester = [
        { Value: "Ganjil", Text: "Ganjil" },
        { Value: "Genap", Text: "Genap" },
    ];

    const dataTemplateKriteria = [
        { Value: "UUT", Text: "UTS, UAS, Tugas" },
        { Value: "RPS", Text: "Berdasarkan RPS" },
        { Value: "Last", Text: "Kriteria Penilaian Tahun Akademik Sebelumnya" },
        { Value: "Kustom", Text: "Kustom" },
    ];

    const predefinedKriteria = {
        UUT: [
            { Kriteria: "Tugas", Prosentase: 30 },
            { Kriteria: "UTS", Prosentase: 30 },
            { Kriteria: "UAS", Prosentase: 40 },
        ],
    };

    const compareTahunAjaran = (tahun1, tahun2) => {
        try {
            const [start1] = tahun1.split("/").map(Number);
            const [start2] = tahun2.split("/").map(Number);
            return start1 - start2;
        } catch {
            return 0;
        }
    };

    const loadMataKuliah = useCallback(async (tahunAjaran, semester) => {
        if (!tahunAjaran || !semester) return;
        try {
            const url = `${API_LINK}Kriteria/Dropdown/MataKuliahKriteria?tahunAjaran=${encodeURIComponent(tahunAjaran)}&semester=${encodeURIComponent(semester)}`;
            const res = await fetchData(url, {}, "GET");
            if (res?.success) {
                const raw = res.data?.Data || res.data || [];
                const data = raw.map((item) => ({
                    Value: item.mkuId || item.id || "",
                    Text: item.mkuNama || item.nama || "",
                }));
                setDataMataKuliah([{ Value: "", Text: "Pilih Mata Kuliah" }, ...data]);
                setFormData((prev) => ({ ...prev, MataKuliahId: "" }));
            }
        } catch {
            Toast.error("Gagal memuat mata kuliah");
        }
    }, []);

    const loadTemplateFromLastYear = async () => {
        if (!formData.MataKuliahId || !formData.TahunAjaran || !formData.Semester) {
            Toast.error("Pilih mata kuliah, tahun ajaran, dan semester terlebih dahulu");
            return;
        }

        setLoadingTemplate(true);

        try {
            const url = `${API_LINK}Kriteria/TemplateKriteria?` +
                `MataKuliahId=${encodeURIComponent(formData.MataKuliahId)}&` +
                `TahunAjaran=${encodeURIComponent(formData.TahunAjaran)}&` +
                `Semester=${encodeURIComponent(formData.Semester)}&` +
                `Tipe=TAHUNLALU`;

            const res = await fetchData(url, {}, "GET");

            if (res.success) {
                const details = res.data?.kriteriaDetails || res.data?.KriteriaDetails || [];

                if (details.length > 0) {
                    const mappedDetails = details.map((item, index) => ({
                        Id: item.id || item.Id || `temp-last-${Date.now()}-${index}`,
                        Kriteria: item.kriteria || item.Kriteria || "",
                        Prosentase: (item.persentase || item.Persentase || 0).toString(),
                    }));

                    setFormData((prev) => ({
                        ...prev,
                        Details: mappedDetails
                    }));

                    
                } else {
                    setFormData((prev) => ({ ...prev, Details: [] }));
                    Toast.error("Tidak ditemukan template kriteria dari tahun akademik sebelumnya");
                }
            } else {
                setFormData((prev) => ({ ...prev, Details: [] }));
                Toast.error(res.message || "Gagal memuat template");
            }
        } catch {
            setFormData((prev) => ({ ...prev, Details: [] }));
            Toast.error("Terjadi kesalahan saat memuat template");
        } finally {
            setLoadingTemplate(false);
        }
    };

    const handleNativeSelectChange = useCallback((name, value) => {
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };
            if (name === "TahunAjaran" || name === "Semester") {
                newData.MataKuliahId = "";
                newData.Jenis = "";
                newData.Details = [];
                const tahun = name === "TahunAjaran" ? value : prev.TahunAjaran;
                const sem = name === "Semester" ? value : prev.Semester;
                if (tahun && sem) {
                    loadMataKuliah(tahun, sem);
                }
            }
            return newData;
        });
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    }, [errors, loadMataKuliah]);

    const handleRadioChange = (value) => {
        setFormData((prev) => ({ ...prev, Jenis: value }));

        if (errors.Jenis) {
            setErrors((prev) => ({ ...prev, Jenis: "" }));
        }

        if (value === "UUT") {
            setFormData((prev) => ({
                ...prev,
                Details: predefinedKriteria.UUT.map((item) => ({
                    Id: `temp-uut-${Date.now()}-${Math.random()}`,
                    Kriteria: item.Kriteria,
                    Prosentase: item.Prosentase.toString(),
                })),
            }));
        } else if (value === "Kustom") {
            setFormData((prev) => ({
                ...prev,
                Details: [{
                    Id: `temp-kustom-${Date.now()}`,
                    Kriteria: "",
                    Prosentase: ""
                }],
            }));
        } else if (value === "RPS") {
            setFormData((prev) => ({
                ...prev,
                Details: []
            }));
            Toast.error("Template berdasarkan RPS belum tersedia");
        } else if (value === "Last") {
            loadTemplateFromLastYear();
        }
    };

    const handleAddKriteria = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            Details: [
                ...prev.Details,
                {
                    Id: `temp-new-${Date.now()}-${Math.random()}`,
                    Kriteria: "",
                    Prosentase: ""
                },
            ],
        }));
    }, []);

    const handleKriteriaChange = useCallback((index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            Details: prev.Details.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    }, []);

    const handleRemoveKriteria = useCallback((index) => {
        setFormData((prev) => ({
            ...prev,
            Details: prev.Details.filter((_, i) => i !== index),
        }));
    }, []);

    const validateForm = useCallback(() => {
        const errs = {};
        if (!formData.MataKuliahId) errs.MataKuliahId = "Mata kuliah wajib dipilih";
        if (!formData.Jenis) errs.Jenis = "Template kriteria wajib dipilih";
        if (!formData.TahunAjaran) errs.TahunAjaran = "Tahun akademik wajib dipilih";
        if (!formData.Semester) errs.Semester = "Semester wajib dipilih";

        if (formData.Details.length === 0) {
            errs.Details = "Minimal satu kriteria penilaian";
        } else {
            formData.Details.forEach((k, i) => {
                if (!k.Kriteria?.trim()) errs[`kriteria_${i}_nama`] = "Nama kriteria wajib diisi";
                const p = Number(k.Prosentase) || 0;
                if (p <= 0 || p > 100) errs[`kriteria_${i}_bobot`] = "Bobot harus 1-100%";
            });
            const total = formData.Details.reduce((s, k) => s + (Number(k.Prosentase) || 0), 0);
            if (total !== 100) {
                Toast.error("Total bobot harus 100%");
                return false;
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        const userData = getUserData();
        if (!userData?.permission?.includes("kriteria_penilaian_dosen.create")) {
            Toast.error("Anda tidak memiliki izin untuk membuat kriteria");
            return;
        }

        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                TahunAjaran: formData.TahunAjaran,
                Semester: formData.Semester,
                MataKuliahId: formData.MataKuliahId,
                TipeKriteria: formData.Jenis,
                KriteriaDetails: formData.Details.map((k) => ({
                    Kriteria: k.Kriteria,
                    Persentase: Number(k.Prosentase) || 0,
                })),
            };

            const res = await fetchData(API_LINK + "Kriteria/CreateKriteria", payload, "POST");

            if (res.success) {
                Toast.success("Kriteria berhasil ditambahkan");
                router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
            } else {
                Toast.error(res.message || "Gagal menyimpan");
            }
        } catch {
            Toast.error("Terjadi kesalahan saat menyimpan kriteria");
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, router]);

    useEffect(() => {
        const ssoData = getSSOData();
        const userData = getUserData();

        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }

        if (!userData?.permission?.includes("kriteria_penilaian_dosen.create")) {
            Toast.error("Anda tidak memiliki izin untuk membuat kriteria");
            router.push("/pages/hasil-studi/kriteria-penilaian-dosen");
            return;
        }

        const loadData = async () => {
            try {
                setLoadingData(true);

                const periodResponse = await fetchData(API_LINK + "Kriteria/ActivePeriodKriteria", {}, "GET");
                if (!periodResponse.success || !periodResponse.data) {
                    Toast.error("Gagal memuat periode aktif");
                    return;
                }

                const tahunAjaran = periodResponse.data.tahunAjaran || "";
                const semester = periodResponse.data.semester || "";
                setFormData((prev) => ({
                    ...prev,
                    TahunAjaran: tahunAjaran,
                    Semester: semester,
                }));

                const tahunResponse = await fetchData(API_LINK + "Kriteria/Dropdown/TahunAjaranKriteria", {}, "GET");
                if (tahunResponse?.success) {
                    const rawData = tahunResponse.data || [];
                    const filtered = rawData
                        .filter((item) => {
                            const itemTahun = item.id || item.nama || "";
                            if (!itemTahun || !tahunAjaran) return true;
                            return compareTahunAjaran(itemTahun, tahunAjaran) <= 0;
                        })
                        .map((item) => ({
                            Value: item.id || item.nama || "",
                            Text: item.id || item.nama || "",
                        }))
                        .sort((a, b) => {
                            const ya = Number(a.Value.split("/")[0]);
                            const yb = Number(b.Value.split("/")[0]);
                            return yb - ya;
                        });
                    setDataTahunAkademik([{ Value: "", Text: "Pilih Tahun Akademik" }, ...filtered]);
                }

                if (tahunAjaran && semester) {
                    await loadMataKuliah(tahunAjaran, semester);
                }
            } catch {
                Toast.error("Gagal memuat data awal");
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, [router, loadMataKuliah]);

    const totalProsentase = formData.Details.reduce((s, k) => s + (Number(k.Prosentase) || 0), 0);


    const renderRPSTemplateInfo = () => {
        if (formData.Jenis === "RPS") {
            return (
                <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    <span>Template berdasarkan RPS belum tersedia. Silakan tambah kriteria manual.</span>
                </div>
            );
        }
        return null;
    };

    return (
        <MainContent
            layout="Admin"
            loading={loadingData}
            title="Tambah Kriteria Penilaian Dosen"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Hasil Studi" },
                { label: "Kriteria Penilaian Dosen", href: "/pages/hasil-studi/kriteria-penilaian-dosen" },
                { label: "Tambah" },
            ]}
        >
            <div className="card border-0 shadow-lg">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="row mb-4">
                            <div className="col-lg-6">
                                <div className="mb-3">
                                    <h5 className="text-primary">Tahun Akademik *</h5>
                                    <select
                                        className="form-select"
                                        value={formData.TahunAjaran}
                                        onChange={(e) => handleNativeSelectChange("TahunAjaran", e.target.value)}
                                        disabled={loadingData}
                                    >
                                        {dataTahunAkademik.map((item) => (
                                            <option key={item.Value} value={item.Value}>{item.Text}</option>
                                        ))}
                                    </select>
                                    {errors.TahunAjaran && <div className="text-danger small mt-1">{errors.TahunAjaran}</div>}
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="mb-3">
                                    <h5 className="text-primary">Semester *</h5>
                                    <select
                                        className="form-select"
                                        value={formData.Semester}
                                        onChange={(e) => handleNativeSelectChange("Semester", e.target.value)}
                                        disabled={loadingData}
                                    >
                                        <option value="">Pilih Semester</option>
                                        {dataSemester.map((item) => (
                                            <option key={item.Value} value={item.Value}>{item.Text}</option>
                                        ))}
                                    </select>
                                    {errors.Semester && <div className="text-danger small mt-1">{errors.Semester}</div>}
                                </div>
                            </div>
                            <hr className="my-4" />
                        </div>

                        <div className="mb-3">
                            <h5 className="text-primary">Mata Kuliah *</h5>
                            <select
                                className="form-select"
                                value={formData.MataKuliahId}
                                onChange={(e) => handleNativeSelectChange("MataKuliahId", e.target.value)}
                                disabled={loading || loadingData}
                            >
                                {dataMataKuliah.map((item) => (
                                    <option key={item.Value} value={item.Value}>{item.Text}</option>
                                ))}
                            </select>
                            {errors.MataKuliahId && <div className="text-danger small mt-1">{errors.MataKuliahId}</div>}
                            {dataMataKuliah.length === 1 && <div className="text-muted small mt-1">Pilih Tahun dan Semester dulu</div>}
                        </div>

                        <hr className="my-4" />

                        <div className="mb-3">
                            <h5 className="text-primary">Template Kriteria *</h5>
                            <div className="row">
                                {dataTemplateKriteria.map((t) => (
                                    <div key={t.Value} className="col-md-6 mb-2">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="jenis"
                                                id={t.Value}
                                                value={t.Value}
                                                checked={formData.Jenis === t.Value}
                                                onChange={(e) => handleRadioChange(e.target.value)}
                                                disabled={loading || !formData.MataKuliahId}
                                            />
                                            <label className="form-check-label" htmlFor={t.Value}>{t.Text}</label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.Jenis && <div className="text-danger small mt-1">{errors.Jenis}</div>}
                        </div>

                       

                        {formData.Jenis === "Last" && formData.Details.length === 0 && !loadingTemplate && (
                            <div className="alert alert-warning mt-3">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                <span>Tidak ditemukan template kriteria dari tahun akademik sebelumnya. Silakan pilih template lain.</span>
                            </div>
                        )}

                        <hr className="my-4" />

                        {formData.Jenis && (
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-3">
                                    <h5 className="text-primary">Kriteria Penilaian</h5>
                                    {(formData.Jenis === "Kustom" || formData.Jenis === "RPS") && (
                                        <Button
                                            classType="outline-primary"
                                            label="Tambah Kriteria"
                                            onClick={handleAddKriteria}
                                            type="button"
                                            iconName="plus"
                                            disabled={loading}
                                        />
                                    )}
                                </div>

                                {formData.Details.length > 0 ? (
                                    <>
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Kriteria</th>
                                                    <th>Persentase (%)</th>
                                                    <th>Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.Details.map((k, i) => {
                                                    const rowKey = k.Id || `new-${i}-${Date.now()}`;

                                                    return (
                                                        <tr key={rowKey}>
                                                            <td>
                                                                <Input
                                                                    value={k.Kriteria}
                                                                    onChange={(e) => handleKriteriaChange(i, "Kriteria", e.target.value)}
                                                                    placeholder="Nama kriteria"
                                                                    hideLabel
                                                                    disabled={loading}
                                                                    error={errors[`kriteria_${i}_nama`]}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Input
                                                                    type="number"
                                                                    value={k.Prosentase}
                                                                    onChange={(e) => handleKriteriaChange(i, "Prosentase", e.target.value)}
                                                                    placeholder="0-100"
                                                                    hideLabel
                                                                    disabled={loading}
                                                                    error={errors[`kriteria_${i}_bobot`]}
                                                                />
                                                            </td>
                                                            <td className="text-center">
                                                                {formData.Details.length > 1 && (
                                                                    <Button
                                                                        classType="outline-danger"
                                                                        onClick={() => handleRemoveKriteria(i)}
                                                                        iconName="trash"
                                                                        size="sm"
                                                                        disabled={loading}
                                                                    />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        <div className={`alert ${totalProsentase === 100 ? "alert-success" : "alert-warning"} mt-3`}>
                                            <strong>Total: {totalProsentase}%</strong>
                                            {totalProsentase !== 100 && <span className="ms-2">(Harus 100%)</span>}
                                        </div>
                                    </>
                                ) : renderRPSTemplateInfo()}
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button
                                classType="secondary"
                                label="Batal"
                                onClick={() => router.push("/pages/hasil-studi/kriteria-penilaian-dosen")}
                                type="button"
                                disabled={loading}
                            />
                            <Button
                                classType="primary"
                                label={loading ? "Menyimpan..." : "Buat Kriteria"}
                                type="submit"
                                disabled={loading || totalProsentase !== 100}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </MainContent>
    );
}
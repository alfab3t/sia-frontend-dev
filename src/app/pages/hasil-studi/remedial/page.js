"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Table from "@/components/common/Table";
import DropDown from "@/components/common/Dropdown";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import SweetAlert from "@/components/common/SweetAlert";
import Toast from "@/components/common/Toast";
import Icon from "@/components/common/Icon"; 
import { getSSOData, getUserData } from "@/context/user";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";

const createUniqueDropdownData = (items) => {
    return items.map((item, index) => ({
        ...item,
        Value: item.Value === "" ? `empty_${index}` : `${item.Value}_${index}`,
        originalValue: item.Value || ""
    }));
};

const extractOriginalValue = (valueWithIndex) => {
    if (!valueWithIndex) return "";
    if (valueWithIndex.startsWith("empty_")) return "";
    const parts = valueWithIndex.split("_");
    parts.pop();
    return parts.join("_");
};

export default function RemedialPage() {
    const ssoData = useMemo(() => getSSOData(), []);
    const userData = useMemo(() => getUserData(), []);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [konsentrasiId, setKonsentrasiId] = useState("");
    const [tahunAjaran, setTahunAjaran] = useState("");
    const [semester, setSemester] = useState("");
    const [mataKuliahId, setMataKuliahId] = useState("");
    const [kelas, setKelas] = useState("");
    const [dosen, setDosen] = useState("-");
    const [konsentrasiList, setKonsentrasiList] = useState([]);
    const [tahunAjaranList, setTahunAjaranList] = useState([]);
    const [mataKuliahList, setMataKuliahList] = useState([]);
    const [kelasList, setKelasList] = useState([]);
    const [remedialData, setRemedialData] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRemedial, setSelectedRemedial] = useState(null);
    const [nilaiRemedial, setNilaiRemedial] = useState("");
    const [nilaiError, setNilaiError] = useState("");

    const semesterOptions = useMemo(() => createUniqueDropdownData([
        { Value: "", Text: "-- Pilih Semester --" },
        { Value: "Ganjil", Text: "Ganjil" },
        { Value: "Genap", Text: "Genap" }
    ]), []);

    const loadKonsentrasi = useCallback(async () => {
        try {
            const response = await fetchData(`${API_LINK}Remedial/GetListKonsentrasi`, {}, "GET");
            if (response.success) {
                const mappedData = response.data.map(item => ({
                    ...item,
                    Value: item.Value || item.value || item.kon_id || "",
                    Text: item.Text || item.text || item.kon_nama || item.Nama || ""
                }));
                const finalOptions = createUniqueDropdownData([{ Value: "", Text: "-- Semua --" }, ...mappedData]);
                setKonsentrasiList(finalOptions);

                if (mappedData.length === 1) {
                const autoSelected = finalOptions.find(item => extractOriginalValue(item.Value) === mappedData[0].Value);
                
                if (autoSelected) {
                    setKonsentrasiId(autoSelected.Value);
                }
            }
            }
        } catch (error) {
            console.error(error);
            Toast.error("Gagal memuat data konsentrasi");
        }
    }, []);

    const loadTahunAjaran = useCallback(async () => {
        try {
            const response = await fetchData(`${API_LINK}Remedial/GetListTahunAjaran`, {}, "GET");
            if (response.success) {
                const mappedData = response.data.map(item => ({
                    ...item,
                    Value: item.Value || item.value || item.kak_tahun_ajaran || "",
                    Text: item.Text || item.text || item.kak_tahun_ajaran || ""
                }));
                const options = createUniqueDropdownData([{ Value: "", Text: "-- Pilih Tahun Akademik --" }, ...mappedData]);
                setTahunAjaranList(options);

                const periodeResponse = await fetchData(`${API_LINK}Remedial/ActivePeriode`, {}, "GET");
                if (periodeResponse.success) {
                    const activeTahun = periodeResponse.data.tahunAjaran;
                    const activeSemester = periodeResponse.data.semester;

                    const matchingTahun = options.find(item => extractOriginalValue(item.Value) === activeTahun);
                    if (matchingTahun) setTahunAjaran(matchingTahun.Value);

                    const matchingSemester = semesterOptions.find(item => extractOriginalValue(item.Value) === activeSemester);
                    if (matchingSemester) setSemester(matchingSemester.Value);
                }
            }
        } catch (error) {
            console.error(error);
            Toast.error("Gagal memuat data tahun ajaran");
        }
    }, [semesterOptions]);

    const loadMataKuliah = useCallback(async () => {
        const originalTahunAjaran = extractOriginalValue(tahunAjaran);
        const originalSemester = extractOriginalValue(semester);

        if (!originalTahunAjaran || !originalSemester) {
            setMataKuliahList(createUniqueDropdownData([{ Value: "", Text: "-- Pilih Mata Kuliah --" }]));
            return;
        }

        try {
            const response = await fetchData(`${API_LINK}Remedial/GetListMataKuliah`, {
                konsentrasiId: extractOriginalValue(konsentrasiId),
                tahunAjaran: originalTahunAjaran,
                semester: originalSemester
            }, "GET");

            if (response.success) {
                const mappedData = response.data.map(item => ({
                    ...item,
                    Value: item.Value || item.value || item.IdMatakuliah || "",
                    Text: item.Text || item.text || item.mku_nama || item.Nama || ""
                }));
                setMataKuliahList(createUniqueDropdownData([{ Value: "", Text: "-- Pilih Mata Kuliah --" }, ...mappedData]));
            } else {
                setMataKuliahList(createUniqueDropdownData([{ Value: "", Text: "-- Pilih Mata Kuliah --" }]));
            }
        } catch (error) {
            console.error(error);
            Toast.error("Gagal memuat data mata kuliah");
        }
    }, [tahunAjaran, semester, konsentrasiId]);

    const loadKelas = useCallback(async () => {
        const originalMataKuliahId = extractOriginalValue(mataKuliahId);
        
        const originalTahun = extractOriginalValue(tahunAjaran);
        const originalSemester = extractOriginalValue(semester);

        if (!originalMataKuliahId) {
            setKelasList(createUniqueDropdownData([{ Value: "", Text: "-- Pilih Kelas --" }]));
            setKelas("");
            setDosen("-");
            return;
        }

        try {
            const response = await fetchData(`${API_LINK}Remedial/GetListKelas`, { 
                mataKuliahId: originalMataKuliahId,
                tahunAjaran: originalTahun,
                semester: originalSemester
            }, "GET");

            if (response.success) {
                const mappedData = response.data.map(item => ({
                    ...item,
                    Value: item.Value || item.value || item.kel_id || "",
                    Text: item.Text || item.text || item.kel_id || item.Kelas || ""
                }));
                setKelasList(createUniqueDropdownData([{ Value: "", Text: "-- Pilih Kelas --" }, ...mappedData]));
            } else {
                setKelasList(createUniqueDropdownData([{ Value: "", Text: "-- Pilih Kelas --" }]));
            }
        } catch (error) {
            console.error(error);
            Toast.error("Gagal memuat data kelas");
        }
        setDosen("-");
        setKelas("");
    }, [mataKuliahId, tahunAjaran, semester]);

    const loadDosen = useCallback(async () => {
        const originalMataKuliahId = extractOriginalValue(mataKuliahId);
        const originalKelas = extractOriginalValue(kelas);
        if (!originalMataKuliahId || !originalKelas) {
            setDosen("-");
            return;
        }
        try {
            const response = await fetchData(`${API_LINK}Remedial/GetDosen`, { mataKuliahId: originalMataKuliahId, kelas: originalKelas }, "GET");
            if (response.success) setDosen(response.data.namaDosen || "-");
            else setDosen("-");
        } catch (error) { 
            console.error(error);
            setDosen("-"); 
        }
    }, [mataKuliahId, kelas]);

    const loadRemedialData = useCallback(async () => {
        const originalMataKuliahId = extractOriginalValue(mataKuliahId);
        const originalKelas = extractOriginalValue(kelas);

        if (!originalMataKuliahId) {
            setRemedialData([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetchData(`${API_LINK}Remedial/GetDataRemedial`, {
                SearchKeyword: searchKeyword,
                KonsentrasiId: extractOriginalValue(konsentrasiId),
                TahunAjaran: extractOriginalValue(tahunAjaran),
                Semester: extractOriginalValue(semester),
                IdMatakuliah: originalMataKuliahId,
                Kelas: originalKelas,
                PageNumber: 1,
                PageSize: 100
            }, "GET");

            if (response.success) {
                const hasEditPermission = userData?.permission?.includes("remedial.edit");

                const formattedData = response.data.map((item, index) => ({
                    No: index + 1,
                    id: item.nilaiMahasiswaId,
                    "NIM": item.mahasiswaId,
                    "Nama": item.mahasiswaNama,
                    "Skor Final": item.nilaiAkhir?.toFixed(2) || "0.00",
                    "Angka Mutu": item.angkaMutu || "-",
                    "Nilai Remedial": item.nilaiRemedial?.toFixed(2) || "-",
                    "Angka Mutu Setelah": item.angkaMutuRemedial || "-",
                    "Aksi": (hasEditPermission && item.canEdit) ? ["Edit"] : [],
                    Alignment: ["center", "center", "left", "center", "center", "center", "center", "center"]
                }));
                setRemedialData(formattedData);
            } else {
                setRemedialData([]);
            }
        } catch (error) {
            console.error(error);
            Toast.error("Gagal memuat data remedial");
            setRemedialData([]);
        } finally {
            setLoading(false);
        }
    }, [mataKuliahId, kelas, searchKeyword, konsentrasiId, tahunAjaran, semester, userData]);

    const handleEdit = useCallback((id) => {
        setNilaiError("");
        
        const itemTabel = remedialData.find(item => item.id === id);

        if (itemTabel) {
            setSelectedRemedial({
                nilaiMahasiswaId: itemTabel.id,
                mahasiswaId: itemTabel["NIM"],
                mahasiswaNama: itemTabel["Nama"],
                nilaiAkhir: Number.parseFloat(itemTabel["Skor Final"]),
                angkaMutu: itemTabel["Angka Mutu"],
                nilaiRemedial: itemTabel["Nilai Remedial"] === "-" ? null : Number.parseFloat(itemTabel["Nilai Remedial"])
            });

            setNilaiRemedial(itemTabel["Nilai Remedial"] === "-" ? "" : itemTabel["Nilai Remedial"]);
            
            setShowEditModal(true);
        } else {
            Toast.error("Data tidak ditemukan di tabel");
        }
    }, [remedialData]);

    const confirmSaveRemedial = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetchData(`${API_LINK}Remedial/UpdateNilaiRemedial`, {
                NilaiMahasiswaId: selectedRemedial.nilaiMahasiswaId.toString(), 
                SkorFinal: Number.parseFloat(selectedRemedial.nilaiAkhir),             
                NilaiRemedial: Number.parseFloat(nilaiRemedial)
            }, "PUT");

            if (response.success) {
                Toast.success("Nilai remedial berhasil disimpan");
                setShowEditModal(false);
                loadRemedialData(); 
            } else {
                Toast.error(response.message || "Gagal menyimpan nilai remedial");
            }
        } catch (error) {
            console.error(error);
            Toast.error("Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    }, [selectedRemedial, nilaiRemedial, loadRemedialData]);

    const handleSaveRemedial = useCallback(async () => {
        if (!selectedRemedial) return;

        if (!nilaiRemedial) {
            setNilaiError("Nilai wajib diisi"); 
            return;
        }

        const nilai = Number.parseFloat(nilaiRemedial);
        
        if (Number.isNaN(nilai) || nilai < 0 || nilai > 100) {
            setNilaiError("Nilai harus antara 0 - 100");
            return;
        }

        if (nilai < selectedRemedial.nilaiAkhir) {
            setNilaiError(`Nilai tidak boleh lebih kecil dari nilai awal (${selectedRemedial.nilaiAkhir})`);
            return; 
        }

        SweetAlert({
            title: "Konfirmasi",
            text: "Maksimum angka mutu setelah remedial adalah C.\n\nApakah Anda yakin ingin mengubah nilai remedial untuk mahasiswa ini?",
            icon: "warning",
            confirmText: "Ya, Simpan",
        }).then((result) => {
            if (result) {
                confirmSaveRemedial();
            }
        });
    }, [selectedRemedial, nilaiRemedial, confirmSaveRemedial]);

    useEffect(() => {
        if (!ssoData) return;
        loadKonsentrasi();
        loadTahunAjaran();
    }, [ssoData, loadKonsentrasi, loadTahunAjaran]);

    useEffect(() => {
        if (extractOriginalValue(tahunAjaran) && extractOriginalValue(semester)) loadMataKuliah();
    }, [loadMataKuliah, tahunAjaran, semester]);

    useEffect(() => {
        if (extractOriginalValue(mataKuliahId)) loadKelas();
    }, [loadKelas, mataKuliahId]);

    useEffect(() => {
        if (extractOriginalValue(mataKuliahId) && extractOriginalValue(kelas)) loadDosen();
    }, [loadDosen, mataKuliahId, kelas]);

    useEffect(() => {
        const originalMataKuliahId = extractOriginalValue(mataKuliahId);
        if (originalMataKuliahId) {
            setLoading(true);
            const timer = setTimeout(() => { loadRemedialData(); }, 300);
            return () => clearTimeout(timer);
        } else {
            setLoading(false);
            setRemedialData([]);
        }
    }, [loadRemedialData, mataKuliahId]);


    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Hasil Studi - Remedial"
            breadcrumb={[{ label: "Beranda", href: "/pages/beranda" }, { label: "Hasil Studi" }, { label: "Remedial" }]}
        >
            <div className="alert alert-warning fade show mb-4">
                <div className="d-flex">
                    <div className="flex-shrink-0"><i className="bi bi-exclamation-triangle-fill me-2"></i></div>
                    <div>
                        Remedial hanya dapat dilakukan pada mahasiswa dengan nilai mutu akhir <b>D</b> atau <b>E</b>.<br />
                        Pengubahan nilai remedial hanya dapat dilakukan pada rentang waktu periode penilaian di tahun akademik dan semester berjalan dan status penilaian pada mata kuliah tersebut telah <b>Final</b>.
                    </div>
                </div>
            </div>

            <div className="row g-3">
                <div className="col-lg-4"><DropDown arrData={konsentrasiList} type="pilih" label="Program Studi" forInput="konsentrasi" value={konsentrasiId} onChange={(e) => { setKonsentrasiId(e.target.value); setMataKuliahId(""); setKelas(""); setDosen("-"); }} /></div>
                <div className="col-lg-4"><DropDown arrData={tahunAjaranList} type="pilih" label="Tahun Akademik" forInput="tahunAjaran" value={tahunAjaran} onChange={(e) => { setTahunAjaran(e.target.value); setMataKuliahId(""); setKelas(""); setDosen("-"); }} /></div>
                <div className="col-lg-4"><DropDown arrData={semesterOptions} type="pilih" label="Semester" forInput="semester" value={semester} onChange={(e) => { setSemester(e.target.value); setMataKuliahId(""); setKelas(""); setDosen("-"); }} /></div>
                <div className="col-lg-4"><DropDown arrData={mataKuliahList} type="pilih" label="Mata Kuliah" forInput="mataKuliah" value={mataKuliahId} onChange={(e) => { setMataKuliahId(e.target.value); setKelas(""); setDosen("-"); }} /></div>
                <div className="col-lg-4"><DropDown arrData={kelasList} type="pilih" label="Kelas" forInput="kelas" value={kelas} onChange={(e) => setKelas(e.target.value)} /></div>
                <div className="col-lg-4"><Input label="Dosen" value={dosen} readOnly={true} /></div>
            </div>
 

            <Formsearch
                onSearch={setSearchKeyword}
                searchPlaceholder="Pencarian"
                showAddButton={false}
                showExportButton={false}
                showFilterButton={false}
                btnSearchTitle="Cari" 
            />

            
            <div className="table-responsive">
                <Table 
                    data={remedialData} 
                    onEdit={handleEdit} 
                />
            </div>
            
            {showEditModal && selectedRemedial && (
                <div className="modal fade show" style={{
                    display:'block',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1050
                }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-4">

                            <div className="text-center mb-4">
                                <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                                    style={{ width: '80px', height: '80px', backgroundColor: '#eef6fc', color: '#66b0ff' }}>

                                    <Icon 
                                        name="info-circle" 
                                        cssClass="fs-1 fw-bold" 
                                        style={{ fontSize: '3rem', fontStyle: 'normal' }} 
                                    />
                                </div>

                                <h3 className="fw-bold mb-1 text-dark">Ubah Nilai Remedial</h3>
                                <p className="text-muted mb-0">
                                    {selectedRemedial.mahasiswaNama} <br />
                                    <small>({selectedRemedial.mahasiswaId})</small>
                                </p>
                            </div>

                            <div className="modal-body p-0 mt-2">
                                <Input
                                    label="Nilai Akhir Saat Ini"
                                    name="nilaiLama"
                                    value={`${selectedRemedial.nilaiAkhir?.toFixed(2)} (${selectedRemedial.angkaMutu})`}
                                    onChange={() => { }}
                                    disabled={true}
                                    readOnly={true}
                                    placeholder=""
                                />

                                <Input
                                    label="Nilai Remedial Baru"
                                    name="nilaiRemedial"
                                    type="text" 
                                    inputMode="numeric"
                                    value={nilaiRemedial}
                                    error={nilaiError} 

                                    onChange={(e) => {
                                        const cleanValue = e.target.value.replaceAll(/\D/g, '');
                                        if (cleanValue === "" || Number.parseInt(cleanValue) <= 100) {
                                            setNilaiRemedial(cleanValue);
                                            if (nilaiError) setNilaiError(""); 
                                        }
                                    }}
                                    placeholder="Contoh: 80"
                                    helperText="Maksimum angka mutu setelah remedial adalah C"
                                    required={true}
                                />
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4 pt-2">
                                <Button 
                                    label="Batal"
                                    classType="secondary px-4" 
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setNilaiError("");
                                    }}
                                    type="button"
                                />

                                <Button 
                                    label="Simpan"
                                    classType="primary px-4 fw-bold"
                                    onClick={handleSaveRemedial}
                                    type="button"
                                    style={{ backgroundColor: '#66b0ff', borderColor: '#66b0ff' }} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainContent>
    );
}
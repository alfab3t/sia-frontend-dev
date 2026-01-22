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

export default function MasterKriteriaPage() {
    const ssoData = useMemo(() => getSSOData(), []);
    const userData = useMemo(() => getUserData(), []);
    const router = useRouter();
    const [dataKriteria, setDataKriteria] = useState([]);
    const [loading, setLoading] = useState(true);
    const statusRef = useRef();
    const konsentrasiRef = useRef();
    const tahunAjaranRef = useRef();
    const semesterRef = useRef();
    const [isClient, setIsClient] = useState(false);

    const dataFilterStatus = [
        { Value: "", Text: "Semua Status" },
        { Value: "Draft", Text: "Draft" },
        { Value: "Menunggu Approval Prodi", Text: "Menunggu Approval Prodi" },
        { Value: "Disetujui", Text: "Disetujui" },
        { Value: "Revisi", Text: "Revisi" },
    ];

    const dataSemesterOptions = [
        { Value: "", Text: "-- Semua --" },
        { Value: "1", Text: "Semester 1" },
        { Value: "2", Text: "Semester 2" },
        { Value: "3", Text: "Semester 3" },
        { Value: "4", Text: "Semester 4" },
        { Value: "5", Text: "Semester 5" },
        { Value: "6", Text: "Semester 6" },
        { Value: "7", Text: "Semester 7" },
        { Value: "8", Text: "Semester 8" },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [ddStatus, setDdStatus] = useState("");
    const [ddKonsentrasi, setDdKonsentrasi] = useState("");
    const [ddTahunAjaran, setDdTahunAjaran] = useState("");
    const [ddSemester, setDdSemester] = useState("");
    const [dataKonsentrasi, setDataKonsentrasi] = useState([{ Value: "", Text: "-- Semua --" }]);
    const [dataTahunAjaran, setDataTahunAjaran] = useState([{ Value: "", Text: "-- Semua --" }]);

    const safeString = (value, defaultValue = "-") => {
        if (value == null || value === "") return defaultValue;
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean") return String(value);

        if (typeof value === "object") {
            const keys = ["nama", "name", "text", "label", "value", "title", "Nama", "Name"];
            for (const key of keys) {
                const val = value[key];
                if (val != null && (typeof val === "string" || typeof val === "number" || typeof val === "boolean")) {
                    return typeof val === "string" ? val : String(val);
                }
            }
        }

        return String(value);
    };

    const loadActivePeriod = useCallback(async () => {
        try {
            const periodResponse = await fetchData(`${API_LINK}Kriteria/ActivePeriodKriteria`, {}, "GET");
            if (periodResponse.success && periodResponse.data) {
                return {
                    tahunAjaran: periodResponse.data.tahunAjaran || "",
                    semester: periodResponse.data.semester || ""
                };
            }
            return { tahunAjaran: "", semester: "" };
        } catch {
            return { tahunAjaran: "", semester: "" };
        }
    }, []);

    const loadDropdownData = useCallback(async () => {
        try {
            const period = await loadActivePeriod();
            const activeTahunAjaran = period.tahunAjaran;
            const activeStartYear = activeTahunAjaran
                ? Number.parseInt(activeTahunAjaran.split('/')[0])
                : 0;

            const konsResponse = await fetchData(`${API_LINK}Kriteria/Dropdown/KonsentrasiKriteria`, {}, "GET");
            if (konsResponse.success) {
                const data = konsResponse.data?.data || konsResponse.data || [];
                const filteredData = data
                    .map(item => ({
                        Value: safeString(item.id || item.Id || item.value || item.Value),
                        Text: safeString(item.nama || item.Nama || item.text || item.Text || item.label || item.Label),
                    }))
                    .filter(item => item.Value && item.Text && item.Text !== "-- Semua --");

                const formattedKons = [{ Value: "", Text: "-- Semua --" }, ...filteredData];
                setDataKonsentrasi(formattedKons);
            }

            const tahunResponse = await fetchData(`${API_LINK}Kriteria/Dropdown/TahunAjaranKriteria`, {}, "GET");
            if (tahunResponse.success) {
                const data = tahunResponse.data?.data || tahunResponse.data || [];
                const baseTahunData = data
                    .map(item => ({
                        Value: safeString(item.id || item.Id || item.value || item.Value || item.nama || item.Nama),
                        Text: safeString(item.nama || item.Nama || item.text || item.Text || item.label || item.Label || item.id || item.Id),
                        StartYear: Number.parseInt(safeString(item.nama || item.Nama || item.value || item.Value).split('/')[0]) || 0
                    }))
                    .filter(item => item.Value && item.Text && item.Text !== "-- Semua --");

                let filteredTahunData = baseTahunData;
                if (activeStartYear > 0) {
                    filteredTahunData = baseTahunData.filter(item => (item.StartYear || 0) <= activeStartYear);
                }

                const sortedTahunData = [...filteredTahunData].sort((a, b) => b.StartYear - a.StartYear);

                let finalTahunData = sortedTahunData;
                if (activeTahunAjaran) {
                    const activeYearIndex = sortedTahunData.findIndex(item => item.Value === activeTahunAjaran);
                    if (activeYearIndex !== -1 && activeYearIndex > 0) {
                        const activeYearItem = sortedTahunData[activeYearIndex];
                        const withoutActive = sortedTahunData.filter(item => item.Value !== activeTahunAjaran);
                        finalTahunData = [activeYearItem, ...withoutActive];
                    }
                }

                const formattedTahun = [{ Value: "", Text: "-- Semua --" }, ...finalTahunData];
                setDataTahunAjaran(formattedTahun);
                setDdTahunAjaran("");
                if (tahunAjaranRef.current) tahunAjaranRef.current.value = "";
            } else {
                setDataTahunAjaran([{ Value: "", Text: "-- Semua --" }]);
            }
        } catch {
            Toast.error("Gagal memuat data dropdown");
        }
    }, [loadActivePeriod]);

    const loadData = useCallback(
        async (page, status, kons, thn, sem, cari) => {
            try {
                setLoading(true);

                const response = await fetchData(
                    `${API_LINK}Kriteria/GetAllKriteria`,
                    {
                        ...(cari?.trim() && { SearchKeyword: cari }),
                        ...(status?.trim() && { Status: status }),
                        ...(kons?.trim() && { KonsentrasiId: kons }),
                        ...(thn?.trim() && { TahunAjaran: thn }),
                        ...(sem?.trim() && { Semester: sem }),
                        Urut: "desc",
                        PageNumber: page,
                        PageSize: pageSize,
                    },
                    "GET"
                );

                if (!response.success) {
                    throw new Error(response.message || "Gagal memuat data");
                }

                const dataArray = Array.isArray(response.data) ? response.data : [];
                const totalItems = response.totalData || 0;

                
                const isClientNow = globalThis.window !== undefined;
                const canEdit = isClientNow && userData?.permission?.includes("kriteria_penilaian_dosen.edit");
                const canApproveReject = isClientNow && userData?.permission?.includes("kriteria_penilaian_dosen.approve_reject");

                const pagedData = dataArray.map((item, index) => {
                    const statusItem = safeString(item.status, "").toLowerCase();
                    const actions = ["Detail"];

                    
                    if ((statusItem === "draft" || statusItem === "revisi") && canEdit) {
                        actions.push("Edit", "Sent");
                    } else if (statusItem.includes("menunggu approval") && canApproveReject) {
                        actions.push("Approve", "Reject");
                    }

                    return {
                        No: (page - 1) * pageSize + index + 1,
                        id: safeString(item.id),
                        Prodi: safeString(item.konsentrasi),
                        Tahun: safeString(item.tahunAjaran),
                        Semester: safeString(item.semester),
                        "Mata Kuliah": safeString(item.mataKuliah),
                        Dosen: safeString(item.dosen),
                        Status: safeString(item.status),
                        Aksi: actions,
                        Alignment: ["center", "left", "center", "center", "left", "left", "center", "center"]
                    };
                });

                setDataKriteria(pagedData);
                setTotalData(Number(totalItems) || 0);
                setCurrentPage(page);
            } catch (err) {
                Toast.error(err.message || "Terjadi kesalahan saat memuat data");
                setDataKriteria([]);
                setTotalData(0);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, userData]
    );

    const handleSearch = useCallback(
        (query) => {
            setSearch(query);
            setCurrentPage(1);
            loadData(1, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, query);
        },
        [ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, loadData]
    );

    const handleFilterApply = useCallback(() => {
        const newStatus = statusRef.current?.value || "";
        const newKon = konsentrasiRef.current?.value || "";
        const newThn = tahunAjaranRef.current?.value || "";
        const newSem = semesterRef.current?.value || "";

        setDdStatus(newStatus);
        setDdKonsentrasi(newKon);
        setDdTahunAjaran(newThn);
        setDdSemester(newSem);
        setCurrentPage(1);
        loadData(1, newStatus, newKon, newThn, newSem, search);
    }, [search, loadData]);

    const handleNavigation = useCallback(
        (page) => {
            loadData(page, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search);
        },
        [ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search, loadData]
    );

    const handleAdd = useCallback(() => {
        router.push("/pages/hasil-studi/kriteria-penilaian-dosen/add");
    }, [router]);

    const handleDetail = useCallback(
        (id) =>
            router.push(`/pages/hasil-studi/kriteria-penilaian-dosen/detail/${encryptIdUrl(id)}`),
        [router]
    );

    const handleEdit = useCallback(
        (id) =>
            router.push(`/pages/hasil-studi/kriteria-penilaian-dosen/edit/${encryptIdUrl(id)}`),
        [router]
    );

    const handleSent = useCallback(
        async (id) => {
            try {
                const checkResponse = await fetchData(`${API_LINK}Kriteria/CheckTotalKriteria/${id}`, {}, "GET");
                if (!checkResponse.success || !checkResponse.data?.isValid) {
                    Toast.error("Total prosentase harus 100% sebelum dikirim");
                    return;
                }

                const result = await SweetAlert({
                    title: "Kirim Pengajuan Kriteria Penilaian",
                    text: "Apakah Anda yakin akan mengirimkan pengajuan kriteria penilaian ini?",
                    icon: "warning",
                    confirmText: "Ya, Kirim!",
                });

                if (!result) return;

                const response = await fetchData(`${API_LINK}Kriteria/SentKriteria/${id}`, {}, "POST");
                if (response.success) {
                    Toast.success("Kriteria berhasil dikirim untuk approval");
                    loadData(currentPage, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search);
                } else {
                    Toast.error(response.message || "Gagal mengirim kriteria");
                }
            } catch {
                Toast.error("Gagal mengirim kriteria");
            }
        },
        [currentPage, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search, loadData]
    );

    const handleApprove = useCallback(
        async (id) => {
            const result = await SweetAlert({
                title: "Setujui Pengajuan Kriteria Penilaian",
                text: "Data pengajuan kriteria penilaian yang sudah disetujui tidak dapat diubah kembali.\n\nApakah Anda yakin akan menyetujui pengajuan kriteria penilaian ini?",
                icon: "warning",
                confirmText: "Ya, Setujui!",
            });

            if (!result) return;

            try {
                const response = await fetchData(`${API_LINK}Kriteria/ApproveKriteria/${id}`, {}, "POST");
                if (response.success) {
                    Toast.success("Kriteria berhasil disetujui");
                    loadData(currentPage, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search);
                } else {
                    Toast.error(response.message || "Gagal menyetujui kriteria");
                }
            } catch {
                Toast.error("Terjadi kesalahan saat menyetujui kriteria");
            }
        },
        [currentPage, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search, loadData]
    );

    const handleReject = useCallback(
        async (id) => {
            const value = await SweetAlert({
                title: "Tolak Kriteria",
                text: "Masukkan Alasan Anda",
                icon: "info",
                confirmText: "Simpan",
                inputType: "input",
                placeholder: "Masukkan Alasan",
            });

            if (value === null || value === false) {
                return;
            }

            
            if (!value || value.trim().length < 5) {
                Toast.error("Alasan penolakan minimal 5 karakter!");
                return;
            }

            try {
                const payload = { KriteriaId: id, Alasan: value.trim() };
                const response = await fetchData(`${API_LINK}Kriteria/RejectKriteria/${id}`, payload, "POST");

                if (response.success) {
                    Toast.success("Kriteria berhasil ditolak");
                    loadData(currentPage, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search);
                } else {
                    Toast.error(response.message || "Gagal menolak kriteria");
                }
            } catch {
                Toast.error("Terjadi kesalahan saat menolak kriteria");
            }
        },
        [currentPage, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search, loadData]
    );

    useEffect(() => {
        setIsClient(true);

        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("./auth/login");
            return;
        }

        const initializeData = async () => {
            try {
                await loadDropdownData();
                loadData(1, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search);
            } catch {
                Toast.error("Gagal memuat data awal");
            }
        };

        initializeData();
    }, [loadDropdownData, loadData, router, ssoData, ddStatus, ddKonsentrasi, ddTahunAjaran, ddSemester, search]);

    const filterContent = useMemo(
        () => (
            <>
                <DropDown
                    ref={konsentrasiRef}
                    arrData={dataKonsentrasi}
                    type="pilih"
                    label="Program Studi"
                    forInput="konsentrasi"
                    defaultValue={ddKonsentrasi}
                />
                <DropDown
                    ref={tahunAjaranRef}
                    arrData={dataTahunAjaran}
                    type="pilih"
                    label="Tahun Akademik"
                    forInput="tahunAjaran"
                    defaultValue={ddTahunAjaran}
                />
                <DropDown
                    ref={semesterRef}
                    arrData={dataSemesterOptions}
                    type="pilih"
                    label="Semester"
                    forInput="semester"
                    defaultValue={ddSemester}
                />
                <DropDown
                    ref={statusRef}
                    arrData={dataFilterStatus}
                    type="pilih"
                    label="Status"
                    forInput="status"
                    defaultValue={ddStatus}
                />
            </>
        ),
        [dataKonsentrasi, dataTahunAjaran, ddKonsentrasi, ddTahunAjaran, ddSemester, ddStatus]
    );

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Kriteria Penilaian Dosen"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Hasil Studi" },
                { label: "Kriteria Penilaian Dosen" },
            ]}
        >
            <div>
                <Formsearch
                    onSearch={handleSearch}
                    onAdd={handleAdd}
                    onFilter={handleFilterApply}
                    showAddButton={
                        
                        isClient && userData?.permission?.includes("kriteria_penilaian_dosen.create")
                    }
                    showExportButton={false}
                    searchPlaceholder="Cari Mata Kuliah..."
                    addButtonText="Tambah Kriteria"
                    filterContent={filterContent}
                />
            </div>
            <div className="row align-items-center g-3">
                <div className="col-12">
                    <Table
                        data={dataKriteria}
                        onDetail={handleDetail}
                        onEdit={handleEdit}
                        onSent={handleSent}
                        onApprove={handleApprove}
                        onReject={handleReject}
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
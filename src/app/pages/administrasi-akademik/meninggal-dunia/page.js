"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import Table from "@/components/common/Table";
import Paging from "@/components/common/Paging";
import DropDown from "@/components/common/Dropdown";
import Label from "@/components/common/Label";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import { getUserData, getSSOData } from "@/context/user";
import { useRouter } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import { encryptIdUrl } from "@/lib/encryptor";
import SweetAlert from "@/components/common/SweetAlert";

function useUserRoles(userData, permission) {
    const roles = useMemo(() => {
        const roleId = userData?.roleId || "";
        const isProdi = roleId === "ROL71";
        const isWadir1 = roleId === "ROL999";
        const isFinance = roleId === "ROL01";
        const isAdmin = roleId === "ROL21";
        
        return { isProdi, isFinance, isWadir1, isAdmin };
    }, [userData, permission]);

    return roles;
}

function usePermissions(userData) {
    const [permission, setPermission] = useState(null);

    useEffect(() => {
        const loadPermission = async () => {
            try {
                const payload = {
                    username: userData?.username || "",
                    appId: "APP08",
                    roleId: userData?.roleId || ""
                };

                const res = await fetch(`${API_LINK}Auth/getpermission`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                
                const data = await res.json();
                
                if (data?.errorMessage === "") {
                    setPermission(data);
                } else {
                    setPermission(null);
                }
            } catch {
                setPermission(null);
            }
        };

        if (userData?.username) {
            loadPermission();
        }
    }, [userData]);

    return permission;
}

export default function Page_MeninggalDunia() {
    const ssoData = useMemo(() => getSSOData(), []);
    const userData = useMemo(() => getUserData(), []);
    const router = useRouter();
    
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const permission = usePermissions(userData);
    const { isProdi, isFinance, isWadir1, isAdmin } = useUserRoles(userData, permission);

    const useProdiKonsentrasi = (isProdi, userData) => {
        const [prodiKonsentrasi, setProdiKonsentrasi] = useState(null);
        const [loadingProdiKonsentrasi, setLoadingProdiKonsentrasi] = useState(false);

        useEffect(() => {
            if (!isProdi || !userData) return;
            
            const loadProdiKonsentrasi = async () => {
                try {
                    setLoadingProdiKonsentrasi(true);
                    const username = userData?.nama || userData?.username || "";
                    
                    if (!username) return;

                    const response = await fetch(`${API_LINK}Mahasiswa/GetKonsentrasiList?username=${username}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data && data.length > 0) {
                            const konsentrasiName = data[0].nama || "";
                            const cleanName = konsentrasiName.replace(/\s*\([^)]*\)\s*$/, '').trim();
                            setProdiKonsentrasi(cleanName);
                        }
                    }
                } catch {
                } finally {
                    setLoadingProdiKonsentrasi(false);
                }
            };

            loadProdiKonsentrasi();
        }, [isProdi, userData]);

        return { prodiKonsentrasi, loadingProdiKonsentrasi };
    };

    const { prodiKonsentrasi, loadingProdiKonsentrasi } = useProdiKonsentrasi(isProdi, userData);


    const [dataPengajuan, setDataPengajuan] = useState([]);
    const [loadingPengajuan, setLoadingPengajuan] = useState(true);
    const [pengajuanPage, setPengajuanPage] = useState(1);
    const [pengajuanTotalData, setPengajuanTotalData] = useState(0);
    const pengajuanPageSize = 10;

    const buildApiParams = useCallback((roles, userData, search, page) => {
        const { isProdi, isWadir1, isFinance, isAdmin } = roles;
        
        const params = new URLSearchParams();
        
        params.append('mhsId', '%');
        
        if (isWadir1) params.append('status', "Belum Disetujui Wadir 1");
        else if (isFinance) params.append('status', "Belum Disetujui Finance");
        else if (isAdmin) params.append('status', "Menunggu Upload SK");
        
        if (isProdi) params.append('userId', userData?.username || "");

        let backendRole = "";
        if (isProdi) backendRole = "ROL71";
        else if (isWadir1) backendRole = "ROL999";
        else if (isFinance) backendRole = "ROL01";
        else if (isAdmin) backendRole = "ROL21";

        if (backendRole) params.append('role', backendRole);
        if (search) params.append('search', search);
        params.append('pageNumber', page);
        params.append('pageSize', pengajuanPageSize);

        return params;
    }, [pengajuanPageSize]);

    const filterDataByRole = useCallback((data, roles, prodiKonsentrasi) => {
        const { isProdi } = roles;
        
        return data.filter(item => {
            const currentStatus = item.status || item.mdu_status || "";
            
            if (isProdi) {
                return filterProdiData(item, currentStatus, prodiKonsentrasi);
            } else {
                return currentStatus !== "Disetujui";
            }
        });
    }, []);

    const filterProdiData = useCallback((item, currentStatus, prodiKonsentrasi) => {
        const itemProdi = item.prodi || item.kon_nama || item.konsentrasi || "";
        
        if (prodiKonsentrasi && itemProdi !== prodiKonsentrasi) {
            return false;
        }
        
        return currentStatus === "Draft" || currentStatus === "Belum Disetujui Wadir 1";
    }, []);

    const determineItemActions = useCallback((item, roles, userData) => {
        const { isProdi, isWadir1, isFinance, isAdmin } = roles;
        const currentStatus = item.status || item.mdu_status || "";
        const hasUploadedSK = item.srt_no || item.suratNo || item.mdu_srt_no;

        if (isProdi) {
            return determineProdiActions(currentStatus);
        } else if (isWadir1) {
            return determineWadir1Actions(currentStatus);
        } else if (isFinance) {
            return determineFinanceActions(currentStatus);
        } else if (isAdmin) {
            return determineAdminActions(currentStatus, hasUploadedSK);
        }

        return ["Detail"];
    }, []);

    const determineProdiActions = useCallback((currentStatus) => {
        if (currentStatus === "Draft") {
            return ["Detail", "Edit", "Delete", "Ajukan"];
        } else if (currentStatus === "Belum Disetujui Wadir 1") {
            return ["Detail"];
        }
        return ["Detail"];
    }, []);

    const determineWadir1Actions = useCallback((currentStatus) => {
        if (currentStatus === "Belum Disetujui Wadir 1") {
            return ["Detail", "Approve", "Reject"];
        }
        return ["Detail"];
    }, []);

    const determineFinanceActions = useCallback((currentStatus) => {
        if (currentStatus === "Belum Disetujui Finance") {
            return ["Detail", "Approve", "Reject"];
        }
        return ["Detail"];
    }, []);

    const determineAdminActions = useCallback((currentStatus, hasUploadedSK) => {
        const isAllApprovalsComplete = currentStatus && 
            !currentStatus.includes("Belum Disetujui Prodi") && 
            !currentStatus.includes("Belum Disetujui Wadir 1") && 
            !currentStatus.includes("Belum Disetujui Finance") &&
            !currentStatus.includes("Draft") &&
            !currentStatus.includes("Ditolak");
            
        const isReadyForSK = currentStatus === "Menunggu Upload SK" || 
                           currentStatus === "Disetujui" ||
                           isAllApprovalsComplete;
        
        if (isReadyForSK) {
            return hasUploadedSK ? ["Detail", "DownloadSK"] : ["Detail", "UploadSK"];
        }
        return ["Detail"];
    }, []);

    const loadPengajuan = useCallback(
        async (page = 1) => {
            try {
                setLoadingPengajuan(true);

                const roles = { isProdi, isWadir1, isFinance, isAdmin };
                const params = buildApiParams(roles, userData, "", page);
                
                if (!params) {
                    setDataPengajuan([]);
                    setPengajuanTotalData(0);
                    return;
                }

                const url = `${API_LINK}MeninggalDunia/GetAll?${params}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new Error("Invalid JSON response from server");
                }

                let actualData = extractArrayFromResponse(data);
                if (!Array.isArray(actualData)) {
                    setDataPengajuan([]);
                    setPengajuanTotalData(0);
                    return;
                }

                const filteredData = filterDataByRole(actualData, roles, prodiKonsentrasi);
                const totalFilteredItems = filteredData.length;
                const startIndex = (page - 1) * pengajuanPageSize;
                const endIndex = startIndex + pengajuanPageSize;
                const paginatedData = filteredData.slice(startIndex, endIndex);

                const formattedData = paginatedData.map((item, index) => 
                    formatTableRow(item, index, startIndex, roles, userData)
                );

                setDataPengajuan(formattedData);
                setPengajuanTotalData(totalFilteredItems);
                setPengajuanPage(page);
            } catch (err) {
                Toast.error(`Gagal memuat data pengajuan: ${err.message}`);
                setDataPengajuan([]);
                setPengajuanTotalData(0);
            } finally {
                setLoadingPengajuan(false);
            }
        },
        [isProdi, isWadir1, isFinance, isAdmin, userData, prodiKonsentrasi, buildApiParams, filterDataByRole, pengajuanPageSize]
    );

    const extractArrayFromResponse = useCallback((data) => {
        if (!data || typeof data !== 'object') return data;
        
        const arrayProperties = ['data', 'items', 'result'];
        for (const prop of arrayProperties) {
            if (data[prop] && Array.isArray(data[prop])) {
                return data[prop];
            }
        }
        
        if (Array.isArray(data)) return data;
        
        const firstArrayProp = Object.keys(data).find(key => Array.isArray(data[key]));
        return firstArrayProp ? data[firstArrayProp] : data;
    }, []);

    const getWadir1Icon = useCallback((status) => {
        if (!status) return "⏳";
        
        const statusLower = status.toLowerCase();
        if (statusLower === "draft" || statusLower === "belum disetujui prodi") return "✗";
        if (statusLower === "belum disetujui wadir 1") return "✗";
        if (statusLower === "ditolak") return "✗";
        if (statusLower.includes("disetujui") || statusLower.includes("finance") || statusLower.includes("upload sk")) return "✓";
        return "⏳";
    }, []);

    const formatTableRow = useCallback((item, index, startIndex, roles, userData) => {
        const { isAdmin } = roles;
        const currentStatus = item.status || item.mdu_status || "";
        const actions = determineItemActions(item, roles, userData);

        const tableData = {
            No: startIndex + index + 1,
            id: item.id || item.mdu_id || item.idDisplay,
            "No Pengajuan": item.noPengajuan || item.id || item.idDisplay || item.mdu_id || "-",
            "Tanggal Pengajuan": item.tanggalPengajuan || item.tanggal || item.mdu_created_date || "-",
            "No SK": item.nomorSK || item.srt_no || item.suratNo || item.mdu_srt_no || "-",
            "Disetujui Wadir 1": getWadir1Icon(currentStatus),
            Status: currentStatus || "-",
        };

        if (isAdmin) {
            const skColumn = currentStatus === "Menunggu Upload SK" ? "DownloadSK" : "-";
            tableData["SK Meninggal Dunia"] = skColumn;
            tableData.Aksi = actions;
            tableData.Alignment = new Array(9).fill("center");
        } else {
            tableData.Aksi = actions;
            tableData.Alignment = new Array(8).fill("center");
        }

        return tableData;
    }, [determineItemActions, getWadir1Icon]);


    const [dataRiwayat, setDataRiwayat] = useState([]);
    const [loadingRiwayat, setLoadingRiwayat] = useState(true);
    const [riwayatPage, setRiwayatPage] = useState(1);
    const [riwayatTotal, setRiwayatTotal] = useState(0);
    const riwayatPageSize = 10;
    const [riwayatSearch, setRiwayatSearch] = useState("");
    const [filterSort, setFilterSort] = useState("tanggal asc");
    const [filterProdi, setFilterProdi] = useState("");

    const sortRef = useRef();
    const prodiRef = useRef();

    const dataFilterProdi = [
        { Value: "", Text: "— Semua Prodi —" },
        { Value: "Manajemen Informatika", Text: "Manajemen Informatika" },
        { Value: "Mekatronika", Text: "Mekatronika" },
        { Value: "Teknik Alat Berat", Text: "Teknik Alat Berat" },
        { Value: "Teknik Otomotif", Text: "Teknik Otomotif" },
        { Value: "Teknik Pengolahan Hasil Perkebunan", Text: "Teknik Pengolahan Hasil Perkebunan" },
        { Value: "Teknik Produksi dan Proses Manufaktur", Text: "Teknik Produksi dan Proses Manufaktur" },
        { Value: "Teknologi Konstruksi Bangunan Gedung", Text: "Teknologi Konstruksi Bangunan Gedung" },
        { Value: "Teknologi Rekayasa Logistik", Text: "Teknologi Rekayasa Logistik" },
        { Value: "Teknologi Rekayasa Pemeliharaan Alat Berat", Text: "Teknologi Rekayasa Pemeliharaan Alat Berat" },
        { Value: "Teknologi Rekayasa Perangkat Lunak", Text: "Teknologi Rekayasa Perangkat Lunak" },
    ];

    const loadRiwayat = useCallback(
        async (page = 1, keyword = riwayatSearch, sort = filterSort, prodi = filterProdi) => {
            try {
                setLoadingRiwayat(true);

                const params = new URLSearchParams();
                
                if (keyword && keyword.trim() !== "") {
                    params.append('SearchKeyword', keyword.trim());
                }
                
                const sortMap = {
                    "tanggal asc": "tanggal asc",
                    "tanggal desc": "tanggal desc", 
                    "nomor asc": "nomor asc",
                    "nomor desc": "nomor desc",
                    "mdu_created_date asc": "tanggal asc",
                    "mdu_created_date desc": "tanggal desc",
                    "mdu_id asc": "nomor asc",
                    "mdu_id desc": "nomor desc"
                };
                
                const sortParam = sortMap[sort] || sort;
                if (sortParam) params.append('Sort', sortParam);
                params.append('PageNumber', page);
                params.append('PageSize', riwayatPageSize);

                const url = `${API_LINK}MeninggalDunia/Riwayat?${params}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new Error("Invalid JSON response from server");
                }

                let actualData = extractArrayFromResponse(data);
                if (!Array.isArray(actualData)) {
                    setDataRiwayat([]);
                    setRiwayatTotal(0);
                    return;
                }

                const formattedData = actualData.map((item, index) => {
                    let actions = ["Detail"];
                    if (item.status === "Disetujui") {
                        actions = ["Detail", "DownloadSK"];
                    }

                    return {
                        No: ((page - 1) * riwayatPageSize) + index + 1,
                        id: item.id,
                        "No Pengajuan": item.noPengajuan || item.id || "-",
                        "Tanggal Pengajuan": item.tanggalPengajuan || "-",
                        "Nomor SK": item.nomorSK || "-",
                        "NIM": item.nim || "-",
                        "Nama Mahasiswa": item.namaMahasiswa || "-",
                        Prodi: item.prodi || "-",
                        Status: item.status || "-",
                        Aksi: actions,
                        Alignment: new Array(9).fill("center"),
                    };
                });

                setDataRiwayat(formattedData);
                const backendTotalData = data.totalData || 0;
                setRiwayatTotal(backendTotalData);
                setRiwayatPage(page);

            } catch (err) {
                Toast.error(`Gagal memuat data riwayat: ${err.message}`);
                setDataRiwayat([]);
                setRiwayatTotal(0);
            } finally {
                setLoadingRiwayat(false);
            }
        },
        [userData, riwayatSearch, filterSort, filterProdi, riwayatPageSize, extractArrayFromResponse]
    );


    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedMeninggalId, setSelectedMeninggalId] = useState(null);
    const [selectedSKFile, setSelectedSKFile] = useState(null);
    const [selectedSPKBFile, setSelectedSPKBFile] = useState(null);
    const [skFilePreview, setSKFilePreview] = useState(null);
    const [spkbFilePreview, setSPKBFilePreview] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);

    const handleUploadSK = (id) => {
        setSelectedMeninggalId(id);
        setShowUploadModal(true);
        setSelectedSKFile(null);
        setSelectedSPKBFile(null);
        setSKFilePreview(null);
        setSPKBFilePreview(null);
    };

    const handleSKFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            Toast.error("Format file tidak didukung. Gunakan PDF, JPG, JPEG, atau PNG.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            Toast.error("Ukuran file maksimal 10MB.");
            return;
        }

        setSelectedSKFile(file);
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setSKFilePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setSKFilePreview(null);
        }
    };

    const handleSPKBFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            Toast.error("Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, JPEG, atau PNG.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            Toast.error("Ukuran file maksimal 10MB.");
            return;
        }

        setSelectedSPKBFile(file);
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setSPKBFilePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setSPKBFilePreview(null);
        }
    };

    const handleUploadConfirm = async () => {
        if (!selectedSKFile || !selectedMeninggalId) {
            Toast.error("Pilih file SK terlebih dahulu.");
            return;
        }

        if (!selectedSPKBFile) {
            Toast.error("Pilih file SPKB terlebih dahulu.");
            return;
        }

        setUploadLoading(true);

        try {
            const formData = new FormData();
            formData.append('MduId', selectedMeninggalId);
            formData.append('SK', selectedSKFile);
            formData.append('SKPB', selectedSPKBFile);
            formData.append('ModifiedBy', userData?.nama || userData?.username || 'user_admin');

            const response = await fetch(`${API_LINK}MeninggalDunia/upload-sk`, {
                method: 'PUT',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            Toast.success(result.message || "SK berhasil diupload!");
            setShowUploadModal(false);
            setSelectedSKFile(null);
            setSelectedSPKBFile(null);
            setSKFilePreview(null);
            setSPKBFilePreview(null);
            setSelectedMeninggalId(null);
            
            await loadPengajuan(pengajuanPage);
            if (isProdi || isWadir1 || isFinance || isDAAK || isAdmin) {
                await loadRiwayat(riwayatPage);
            }

        } catch (error) {
            Toast.error(`Gagal upload SK: ${error.message}`);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleUploadCancel = () => {
        setShowUploadModal(false);
        setSelectedSKFile(null);
        setSelectedSPKBFile(null);
        setSKFilePreview(null);
        setSPKBFilePreview(null);
        setSelectedMeninggalId(null);
    };

    const handleDownloadSK = async (id) => {
        try {
            const username = userData?.nama || userData?.username || "";
            
            if (!username) {
                Toast.error("Data user tidak lengkap. Silakan login ulang.");
                return;
            }

            const params = new URLSearchParams({
                username: username,
                format: "pdf"
            });

            const downloadUrl = `${API_LINK}MeninggalDunia/cetak-sk/${encodeURIComponent(id)}?${params.toString()}`;

            const checkParams = new URLSearchParams({
                username: username,
                format: "json"
            });
            
            const checkUrl = `${API_LINK}MeninggalDunia/cetak-sk/${encodeURIComponent(id)}?${checkParams.toString()}`;
            
            const checkResponse = await fetch(checkUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!checkResponse.ok) {
                if (checkResponse.status === 403) {
                    Toast.error("Anda tidak memiliki akses untuk download SK ini.");
                } else {
                    Toast.error(`Gagal mengakses SK: HTTP ${checkResponse.status}`);
                }
                return;
            }

            const checkResult = await checkResponse.json();

            if (!checkResult.canPrint) {
                Toast.error(checkResult.reason || "Tidak dapat download SK saat ini.");
                return;
            }

            window.open(downloadUrl, "_blank");
            Toast.success("SK berhasil didownload!");

        } catch (error) {
            Toast.error(`Gagal download SK: ${error.message}`);
        }
    };

    const handleAjukan = async (id) => {
        const confirm = await SweetAlert({
            title: "Ajukan Pengajuan Meninggal Dunia",
            text: "Setelah diajukan, data tidak dapat diedit kembali. Ajukan sekarang?",
            icon: "warning",
            confirmText: "Ya, Ajukan!",
        });

        if (!confirm) return;

        setLoadingPengajuan(true);

        try {
            const encodedId = encodeURIComponent(id);
            const url = `${API_LINK}MeninggalDunia/finalize/${encodedId}`;

            const res = await fetch(url, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                
                try {
                    const errorData = JSON.parse(errorText);
                    const errorMsg = errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
                    Toast.error(`Gagal mengajukan: ${errorMsg}`);
                } catch {
                    Toast.error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return;
            }

            const raw = await res.text();
            let result;
            try {
                result = JSON.parse(raw);
            } catch {
                Toast.error("Response server tidak valid.");
                return;
            }

            if (result?.officialId) {
                Toast.success(`Pengajuan berhasil diajukan dengan ID: ${result.officialId}`);
                
                if (isProdi) {
                    const prodiCreatedApps = JSON.parse(sessionStorage.getItem('prodiCreatedMeninggalApps') || '[]');
                    const updatedApps = prodiCreatedApps.filter(appId => appId !== id);
                    sessionStorage.setItem('prodiCreatedMeninggalApps', JSON.stringify(updatedApps));
                }
                
                loadPengajuan(1);
            } else {
                const errorMsg = result?.message || result?.error || "Gagal mengajukan pengajuan.";
                Toast.error(errorMsg);
            }
        } catch (err) {
            Toast.error(`Gagal mengajukan: ${err.message}`);
        } finally {
            setLoadingPengajuan(false);
        }
    };

    const handleAdd = () => {
        router.push("/pages/administrasi-akademik/meninggal-dunia/add");
    };

    const handleDetail = (id) => {
        const encodedId = encodeURIComponent(encryptIdUrl(id));
        router.push(
            `/pages/administrasi-akademik/meninggal-dunia/detail/${encodedId}`
        );
    };

    const handleEdit = (id) => {
        const encodedId = encodeURIComponent(encryptIdUrl(id));
        router.push(
            `/pages/administrasi-akademik/meninggal-dunia/edit/${encodedId}`
        );
    };

    const handleDelete = async (id) => {
        const confirm = await SweetAlert({
            title: "Hapus Pengajuan",
            text: "Yakin ingin menghapus pengajuan ini?",
            icon: "warning",
            confirmText: "Ya, Hapus!",
        });

        if (!confirm) return;

        setLoadingPengajuan(true);

        try {
            const encodedId = encodeURIComponent(id);
            const url = `${API_LINK}MeninggalDunia/${encodedId}`;
            const res = await fetch(url, { method: "DELETE" });
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();

            if (data?.message?.includes("berhasil")) {
                Toast.success(data.message);
                loadPengajuan(1);
            } else {
                throw new Error(data.message || "Gagal menghapus pengajuan");
            }
        } catch (err) {
            Toast.error(err.message);
        } finally {
            setLoadingPengajuan(false);
        }
    };

    const handleApprove = async (itemId) => {
        const confirm = await SweetAlert({
            title: "Setujui Pengajuan Meninggal Dunia",
            text: "Yakin ingin menyetujui pengajuan meninggal dunia ini?",
            icon: "warning",
            confirmText: "Ya, Setujui!",
        });

        if (!confirm) return;

        setLoadingPengajuan(true);

        try {
            const approvedBy = userData?.nama || userData?.username || userData?.userid || "";
            
            let role = "";
            if (isProdi) role = "prodi";
            else if (isWadir1) role = "wadir1";
            else if (isFinance) role = "finance";

            const payload = { approvedBy, role };
            const encodedItemId = encodeURIComponent(itemId);
            const url = `${API_LINK}MeninggalDunia/approve/${encodedItemId}`;

            const res = await fetch(url, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                
                try {
                    const errorData = JSON.parse(errorText);
                    const errorMsg = errorData.message || errorData.error || `HTTP ${res.status}`;
                    Toast.error(`Gagal menyetujui: ${errorMsg}`);
                } catch {
                    Toast.error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return;
            }

            Toast.success("Pengajuan meninggal dunia berhasil disetujui!");
            loadPengajuan(1); 
            
        } catch (err) {
            Toast.error(`Gagal menyetujui: ${err.message}`);
        } finally {
            setLoadingPengajuan(false);
        }
    };

    const handleReject = async (itemId) => {
        const confirm = await SweetAlert({
            title: "Tolak Pengajuan Meninggal Dunia",
            text: "Yakin ingin menolak pengajuan meninggal dunia ini?",
            icon: "warning",
            confirmText: "Ya, Tolak!",
        });

        if (!confirm) return;

        setLoadingPengajuan(true);

        try {
            let autoReason = "";
            let backendRole = "";
            
            if (isProdi) {
                autoReason = "Ditolak oleh Program Studi";
                backendRole = "prodi";
            } else if (isWadir1) {
                autoReason = "Ditolak oleh Wakil Direktur 1";
                backendRole = "wadir1";
            } else if (isFinance) {
                autoReason = "Ditolak oleh Bagian Keuangan";
                backendRole = "finance";
            } else {
                autoReason = "Pengajuan ditolak";
                backendRole = "prodi";
            }

            const payload = {
                keterangan: autoReason,
                role: backendRole
            };

            const encodedItemId = encodeURIComponent(itemId);
            const url = `${API_LINK}MeninggalDunia/reject/${encodedItemId}`;

            const res = await fetch(url, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                
                try {
                    const errorData = JSON.parse(errorText);
                    const errorMsg = errorData.message || errorData.error || errorData.details || `HTTP ${res.status}: ${res.statusText}`;
                    Toast.error(`Gagal menolak pengajuan: ${errorMsg}`);
                } catch {
                    Toast.error(`Gagal menolak pengajuan: HTTP ${res.status}\n\n${errorText}`);
                }
                return;
            }

            const raw = await res.text();
            let result;
            try {
                result = JSON.parse(raw);
            } catch {
                Toast.error("Response server tidak valid:\n\n" + raw);
                return;
            }

            if (result?.message?.includes("berhasil")) {
                Toast.success(result.message);
                loadPengajuan(1);
                loadRiwayat(1);
            } else {
                throw new Error(result?.message || "Gagal menolak pengajuan");
            } 
            
        } catch (err) {
            Toast.error(`Gagal menolak: ${err.message}`);
        } finally {
            setLoadingPengajuan(false);
        }
    };
    const handleRiwayatFilter = () => {
        const newSort = sortRef.current.value;
        const newProdi = prodiRef.current.value;

        setFilterSort(newSort);
        setFilterProdi(newProdi);

        loadRiwayat(1, riwayatSearch, newSort, newProdi);
    };

    const handleSearchRiwayat = useCallback(
        (query) => {
            setRiwayatSearch(query);
            setRiwayatPage(1); 
            loadRiwayat(1, query);
        },
        [loadRiwayat]
    );

    const filterContentRiwayat = (
        <>
            <DropDown
                ref={sortRef}
                arrData={[
                    { Value: "tanggal asc", Text: "Tanggal Pengajuan [↑]" },
                    { Value: "tanggal desc", Text: "Tanggal Pengajuan [↓]" },
                    { Value: "nomor asc", Text: "Nomor Pengajuan [↑]" },
                    { Value: "nomor desc", Text: "Nomor Pengajuan [↓]" },
                ]}
                type="pilih"
                label="Urut Berdasarkan"
                forInput="urutRiwayat"
                defaultValue={filterSort}
            />

            <DropDown
                ref={prodiRef}
                arrData={dataFilterProdi}
                type="pilih"
                label="Program Studi"
                forInput="filterProdi"
                defaultValue={filterProdi}
            />
        </>
    );


    useEffect(() => {
        if (!ssoData) {
            Toast.error("Sesi habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }

        if (!userData) return;

        if (isProdi) {
            if (loadingProdiKonsentrasi || !prodiKonsentrasi) {
                return;
            }
        }

        loadPengajuan(1);
        
        if (isProdi || isWadir1 || isFinance || isAdmin) {
            loadRiwayat(1);
        }
    }, [ssoData, userData, loadPengajuan, loadRiwayat, isProdi, isWadir1, isFinance, isAdmin, router, prodiKonsentrasi, loadingProdiKonsentrasi]);

    return (
        <MainContent
            layout="Admin"
            loading={loadingPengajuan || loadingRiwayat}
            title="Pengajuan Meninggal Dunia"
            breadcrumb={[
                { label: "Sistem Informasi Akademik" },
                { label: "Administrasi Akademik" },
                { label: "Meninggal Dunia" },
            ]}
        >
            {/* ======================== TABEL PENGAJUAN =========================== */}
            {/* Finance role should NOT see Pengajuan table - only Riwayat */}
            {!isFinance && (
                <div className="mb-4">
                    <h5>Daftar Pengajuan Meninggal Dunia</h5>
                    
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        {isClient && isProdi && (
                            <Button
                                classType="primary"
                                label="+ Tambah"
                                onClick={handleAdd}
                            />
                        )}
                        <div></div>
                    </div>

                    {(() => {
                        if (loadingPengajuan) {
                            return (
                                <div className="text-center py-4">
                                    <div className="spinner-border" aria-live="polite">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Memuat data pengajuan...</p>
                                </div>
                            );
                        } else if (dataPengajuan.length > 0) {
                            return (
                                <>
                                    <Table
                                        data={dataPengajuan}
                                        onDetail={handleDetail}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onAjukan={handleAjukan}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        onUploadSK={handleUploadSK}
                                        onDownloadSK={handleDownloadSK}
                                    />

                                    {pengajuanTotalData > 0 && (
                                        <Paging
                                            pageSize={pengajuanPageSize}
                                            pageCurrent={pengajuanPage}
                                            totalData={pengajuanTotalData}
                                            navigation={loadPengajuan}
                                        />
                                    )}
                                </>
                            );
                        } else {
                            return (
                                <div className="text-center py-5">
                                    <div className="mb-3">
                                        <i className="fas fa-inbox fa-3x text-muted"></i>
                                    </div>
                                    <h5 className="text-muted">Tidak ada data pengajuan</h5>
                                    <p className="text-muted">
                                        {(() => {
                                            if (isProdi) {
                                                return "Tidak ada pengajuan meninggal dunia. Anda dapat membuat pengajuan untuk mahasiswa dengan klik tombol '+ Tambah'.";
                                            } else {
                                                return "Tidak ada pengajuan meninggal dunia yang perlu ditinjau saat ini.";
                                            }
                                        })()}
                                    </p>
                                </div>
                            );
                        }
                    })()}
                </div>
            )}

            {/* ======================== TABEL RIWAYAT =========================== */}
            {(isProdi || isWadir1 || isFinance || isAdmin) && (
                <div className="mt-5">
                    <h5>Daftar Riwayat Meninggal Dunia</h5>
                    
                    <Formsearch
                        onSearch={handleSearchRiwayat}
                        onFilter={handleRiwayatFilter}
                        onExport={() => {
                            const params = new URLSearchParams();
                            if (riwayatSearch && riwayatSearch.trim() !== "") {
                                params.append('SearchKeyword', riwayatSearch.trim());
                            }
                            if (filterSort && filterSort !== "") {
                                params.append('Sort', filterSort);
                            }
                            
                            const queryString = params.toString();
                            const exportUrl = `${API_LINK}MeninggalDunia/Riwayat/excel${queryString ? '?' + queryString : ''}`;
                            window.open(exportUrl, "_blank");
                        }}
                        searchPlaceholder="Cari No. Pengajuan, NIM, Nama, atau Prodi"
                        showAddButton={false}
                        showFilterButton={true}
                        showExportButton={true}
                        exportButtonText="Unduh Excel"
                        filterContent={filterContentRiwayat}
                    />

                    {(() => {
                        if (loadingRiwayat) {
                            return (
                                <div className="text-center py-4">
                                    <div className="spinner-border" aria-live="polite">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Memuat data riwayat...</p>
                                </div>
                            );
                        } else if (dataRiwayat.length > 0) {
                            return (
                                <>
                                    <Table
                                        data={dataRiwayat}
                                        onDetail={handleDetail}
                                        onDownloadSK={handleDownloadSK}
                                    />

                                    {riwayatTotal > 0 && (
                                        <Paging
                                            pageSize={riwayatPageSize}
                                            pageCurrent={riwayatPage}
                                            totalData={riwayatTotal}
                                            navigation={(page) => loadRiwayat(page)}
                                        />
                                    )}
                                </>
                            );
                        } else {
                            return (
                                <div className="text-center py-5">
                                    <div className="mb-3">
                                        <i className="fas fa-history fa-3x text-muted"></i>
                                    </div>
                                    <h5 className="text-muted">Tidak ada data riwayat</h5>
                                    <p className="text-muted">Belum ada riwayat meninggal dunia yang tersedia.</p>
                                </div>
                            );
                        }
                    })()}
                </div>
            )}

            {/* SK Upload Modal */}
            {showUploadModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Upload SK Meninggal Dunia</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={handleUploadCancel}
                                    disabled={uploadLoading}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <Label
                                        text="Berkas Surat Keterangan Meninggal Dunia"
                                        htmlFor="skMeninggalFile"
                                        required={true}
                                    />
                                    <input
                                        type="file"
                                        id="skMeninggalFile"
                                        className="form-control rounded-4 blue-element"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={handleSKFileSelect}
                                        disabled={uploadLoading}
                                    />
                                    <small className="text-muted">
                                        Format yang didukung: PDF, DOC, DOCX, JPG, JPEG, PNG (Maksimal 10MB)
                                    </small>
                                </div>

                                <div className="mb-3">
                                    <Label
                                        text="Berkas Surat Keterangan Pernah Berkuliah"
                                        htmlFor="spkbFile"
                                        required={true}
                                    />
                                    <input
                                        type="file"
                                        id="spkbFile"
                                        className="form-control rounded-4 blue-element"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={handleSPKBFileSelect}
                                        disabled={uploadLoading}
                                    />
                                    <small className="text-muted">
                                        Format yang didukung: PDF, DOC, DOCX, JPG, JPEG, PNG (Maksimal 10MB)
                                    </small>
                                </div>

                                {skFilePreview && (
                                    <div className="mb-3">
                                        <h6 className="form-label">Preview SK:</h6>
                                        <div className="text-center">
                                            <img 
                                                src={skFilePreview} 
                                                alt="Preview SK" 
                                                className="img-fluid" 
                                                style={{ maxHeight: '300px', border: '1px solid #ddd', borderRadius: '4px' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {spkbFilePreview && (
                                    <div className="mb-3">
                                        <h6 className="form-label">Preview SPKB:</h6>
                                        <div className="text-center">
                                            <img 
                                                src={spkbFilePreview} 
                                                alt="Preview SPKB" 
                                                className="img-fluid" 
                                                style={{ maxHeight: '300px', border: '1px solid #ddd', borderRadius: '4px' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={handleUploadCancel}
                                    disabled={uploadLoading}
                                >
                                    Batal
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={handleUploadConfirm}
                                    disabled={!selectedSKFile || uploadLoading}
                                >
                                    {uploadLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                                            <span>Mengupload...</span>
                                        </>
                                    ) : (
                                        'Simpan'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainContent>
    );
}
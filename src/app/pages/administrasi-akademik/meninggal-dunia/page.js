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
import Cookies from "js-cookie";

// Helper function to get authorization headers
const getAuthHeaders = () => {
    const token = Cookies.get("jwtToken");
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// Helper function for FormData uploads (no Content-Type header)
const getAuthHeadersForFormData = () => {
    const token = Cookies.get("jwtToken");
    return {
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

export default function Page_MeninggalDunia() {
    const ssoData = useMemo(() => getSSOData(), []);
    const userData = useMemo(() => getUserData(), []);
    const router = useRouter();
    
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const roleId = userData?.roleId || "";

    const [prodiKonsentrasi, setProdiKonsentrasi] = useState(null);
    const [loadingProdiKonsentrasi, setLoadingProdiKonsentrasi] = useState(false);

    useEffect(() => {
        if (roleId !== "ROL71" || !userData) return;

        const loadProdiKonsentrasi = async () => {
            try {
                setLoadingProdiKonsentrasi(true);
                const username = userData?.nama || userData?.username || "";

                if (!username) return;

                const response = await fetch(`${API_LINK}MeninggalDunia/GetKonsentrasiBySekprod?username=${username}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const konsentrasiName = data[0].nama || "";
                        const cleanName = konsentrasiName.replaceAll(/\s*\([^)]*\)\s*$/g, '').trim();
                        setProdiKonsentrasi(cleanName);
                    }
                }
            } catch {
                setProdiKonsentrasi(null);
            } finally {
                setLoadingProdiKonsentrasi(false);
            }
        };

        loadProdiKonsentrasi();
    }, [roleId, userData]);


    const [dataPengajuan, setDataPengajuan] = useState([]);
    const [loadingPengajuan, setLoadingPengajuan] = useState(true);
    const [pengajuanPage, setPengajuanPage] = useState(1);
    const [pengajuanTotalData, setPengajuanTotalData] = useState(0);
    const pengajuanPageSize = 10;

    const filterDataByRole = useCallback((data, prodiKonsentrasi) => {
        return data.filter(item => {
            const currentStatus = item.status || item.mdu_status || "";
            if (roleId === "ROL71") return filterProdiData(item, currentStatus, prodiKonsentrasi);
            if (roleId === "ROL74") return currentStatus !== "Draft";
            return currentStatus !== "Disetujui";
        });
    }, [roleId]);

    const filterProdiData = useCallback((item, currentStatus, prodiKonsentrasi) => {
        const itemProdi = item.prodi || item.kon_nama || item.konsentrasi || "";
        
        // Filter by program - only show items from user's program
        if (prodiKonsentrasi) {
            const userProgram = prodiKonsentrasi.toLowerCase().trim();
            const itemProgram = itemProdi.toLowerCase().trim();
            
            // Handle both full name and abbreviated name matching
            const programMatches = 
                itemProgram === userProgram ||
                itemProgram.includes(userProgram) ||
                userProgram.includes(itemProgram) ||
                // Extract abbreviation from parentheses if exists
                (userProgram.includes('(') && userProgram.includes(')') && 
                 itemProgram.includes(userProgram.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '')) ||
                // Match without parentheses content
                itemProgram.replaceAll(/\s*\([^)]*\)\s*$/g, '').trim() === 
                userProgram.replaceAll(/\s*\([^)]*\)\s*$/g, '').trim();
            
            if (!programMatches) {
                return false;
            }
        }
        
        // For Prodi users, only show Draft and Belum Disetujui Wadir 1 statuses
        // Exclude rejected/ditolak statuses from pengajuan table
        const statusLower = currentStatus.toLowerCase().trim();
        const allowedStatuses = [
            "draft",
            "belum disetujui wadir 1"
        ];
        
        return allowedStatuses.includes(statusLower);
    }, []);

    const determineProdiActions = useCallback((currentStatus) => {
        let actions = [];
        const statusLower = currentStatus.toLowerCase().trim();
        if (statusLower === "draft") {
            if (isClient && userData?.permission?.includes("meninggal_dunia.edit")) actions.push("Edit");
            if (isClient && userData?.permission?.includes("meninggal_dunia.delete")) actions.push("Delete");
            if (isClient && userData?.permission?.includes("meninggal_dunia.create")) actions.push("Sent");
        }
        return actions;
    }, [isClient, userData]);

    const determineWadir1Actions = useCallback((currentStatus) => {
        let actions = [];
        if (currentStatus === "Belum Disetujui Wadir 1") {
            if (isClient && userData?.permission?.includes("meninggal_dunia.approve_reject")) {
                actions.push("Approve", "Reject");
            }
        }
        return actions;
    }, [isClient, userData]);

    const determineFinanceActions = useCallback((currentStatus) => {
        let actions = [];
        if (currentStatus === "Belum Disetujui Finance") {
            if (isClient && userData?.permission?.includes("meninggal_dunia.approve_reject")) {
                actions.push("Approve", "Reject");
            }
        }
        return actions;
    }, [isClient, userData]);

    const determineAdminActions = useCallback((currentStatus, hasUploadedSK) => {
        let actions = [];
        if (currentStatus === "Menunggu Upload SK") {
            if (isClient && userData?.permission?.includes("meninggal_dunia.edit")) {
                actions.push("Upload");
            }
        }
        if (currentStatus === "Disetujui" && hasUploadedSK) {
            if (isClient && userData?.permission?.includes("meninggal_dunia.print")) {
                actions.push("DownloadSK");
            }
        }
        if (currentStatus === "Disetujui") {
            if (isClient && userData?.permission?.includes("meninggal_dunia.print")) {
                actions.push("Print");
            }
        }
        
        return actions;
    }, [isClient, userData]);

    const determineItemActions = useCallback((item) => {
        const currentStatus = item.status || item.mdu_status || "";
        const hasUploadedSK = item.srt_no || item.suratNo || item.mdu_srt_no;

        let actions = ["Detail"];

        if (roleId === "ROL71") {
            actions = [...actions, ...determineProdiActions(currentStatus)];
        } else if (roleId === "ROL999") {
            actions = [...actions, ...determineWadir1Actions(currentStatus)];
        } else if (roleId === "ROL01") {
            actions = [...actions, ...determineFinanceActions(currentStatus)];
        } else if (roleId === "ROL74") {
            actions = [...actions, ...determineAdminActions(currentStatus, hasUploadedSK)];
        }

        return actions;
    }, [roleId, determineProdiActions, determineWadir1Actions, determineFinanceActions, determineAdminActions]);

    const extractArrayFromResponse = useCallback((data) => {
        // Backend now returns array directly without wrapper
        if (Array.isArray(data)) {
            return data;
        }
        
        // Fallback: check for common wrapper properties
        if (!data || typeof data !== 'object') return [];
        
        const arrayProperties = ['data', 'items', 'result'];
        for (const prop of arrayProperties) {
            if (data[prop] && Array.isArray(data[prop])) {
                return data[prop];
            }
        }
        
        // If no array found, return empty array
        return [];
    }, []);

    const getWadir1Icon = useCallback((status) => {
        if (!status) return "✗";
        
        const statusLower = status.toLowerCase();
        if (statusLower === "draft" || statusLower === "belum disetujui prodi") return "✗";
        if (statusLower === "belum disetujui wadir 1") return "✗";
        if (statusLower === "ditolak") return "✗";
        if (statusLower.includes("disetujui") || statusLower.includes("finance") || statusLower.includes("upload sk")) return "✓";
        return "✗";
    }, []);

    const formatTableRow = useCallback((item, index, startIndex) => {
        const currentStatus = item.status || item.mdu_status || "";
        const actions = determineItemActions(item);

        const tableData = {
            No: startIndex + index + 1,
            id: item.id || item.mdu_id || item.idDisplay,
            "No Pengajuan": item.noPengajuan || item.id || item.idDisplay || item.mdu_id || "-",
            "Tanggal Pengajuan": item.tanggalPengajuan || item.tanggal || item.mdu_created_date || "-",
            "No SK": item.nomorSK || item.srt_no || item.suratNo || item.mdu_srt_no || "-",
            "Disetujui Wadir 1": getWadir1Icon(currentStatus),
            Status: currentStatus || "-",
        };

        if (roleId === "ROL74") {
            let skColumn = "-";
            if (currentStatus === "Menunggu Upload SK") {
                // Return HTML button for Print since TableRow.js won't handle this column
                skColumn = `<button type="button" class="btn px-1 py-0 text-primary" title="Cetak SK" onclick="window.handlePrintMeninggalDunia('${item.id || item.mdu_id || item.idDisplay}')">
                              <i class="bi bi-printer"></i>
                            </button>`;
            }
            tableData["SK Meninggal Dunia"] = skColumn;
            tableData.Aksi = actions;
            tableData.Alignment = new Array(9).fill("center");
        } else {
            tableData.Aksi = actions;
            tableData.Alignment = new Array(8).fill("center");
        }

        return tableData;
    }, [determineItemActions, getWadir1Icon, roleId]);

    const loadPengajuan = useCallback(
        async (page = 1) => {
            try {
                setLoadingPengajuan(true);

                const params = new URLSearchParams();
                params.append('mhsId', '%');
                
                if (roleId === "ROL999") {
                    params.append('status', "Belum Disetujui Wadir 1");
                } else if (roleId === "ROL01") {
                    params.append('status', "Belum Disetujui Finance");
                } else if (roleId === "ROL74") {
                    params.append('status', "Menunggu Upload SK");
                }
                
                if (roleId === "ROL71") {
                    const userId = userData?.nama || userData?.username || "";
                    if (userId) params.append('userId', userId);
                }

                const backendRole = userData?.roleId || "";
                if (backendRole) params.append('role', backendRole);

                const url = `${API_LINK}MeninggalDunia/GetAllMeninggalDunia?${params}`;
                const response = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    throw new Error(`Invalid JSON response from server: ${parseError.message}`);
                }

                let actualData = extractArrayFromResponse(data);
                if (!Array.isArray(actualData)) {
                    setDataPengajuan([]);
                    setPengajuanTotalData(0);
                    return;
                }

                const filteredData = filterDataByRole(actualData, prodiKonsentrasi);
                
                if (roleId === "ROL71") {
                    filteredData.sort((a, b) => {
                        const idA = Number.parseInt(a.id || 0);
                        const idB = Number.parseInt(b.id || 0);
                        if (!Number.isNaN(idA) && !Number.isNaN(idB)) return idB - idA;
                        if (!Number.isNaN(idA) && Number.isNaN(idB)) return -1;
                        if (Number.isNaN(idA) && !Number.isNaN(idB)) return 1;
                        return (b.id || "").localeCompare(a.id || "");
                    });
                }
                
                const totalFilteredItems = filteredData.length;
                const startIndex = (page - 1) * pengajuanPageSize;
                const endIndex = startIndex + pengajuanPageSize;
                const paginatedData = filteredData.slice(startIndex, endIndex);

                const formattedData = paginatedData.map((item, index) => 
                    formatTableRow(item, index, startIndex)
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
        [roleId, userData, prodiKonsentrasi, filterDataByRole, pengajuanPageSize, extractArrayFromResponse, formatTableRow]
    );

    const [dataRiwayat, setDataRiwayat] = useState([]);
    const [loadingRiwayat, setLoadingRiwayat] = useState(true);
    const [riwayatPage, setRiwayatPage] = useState(1);
    const [riwayatTotal, setRiwayatTotal] = useState(0);
    const riwayatPageSize = 10;
    const [riwayatSearch, setRiwayatSearch] = useState("");
    const [filterSort, setFilterSort] = useState("tanggal_desc");
    const [filterProdi, setFilterProdi] = useState("");

    const sortRef = useRef();
    const prodiRef = useRef();

    // Sort options (same as Cuti Akademik)
    const dataFilterSort = [
        { Value: "tanggal_desc", Text: "Tanggal Pengajuan [↓]" },
        { Value: "tanggal_asc", Text: "Tanggal Pengajuan [↑]" },
        { Value: "id_asc", Text: "No Pengajuan [↑]" },
        { Value: "id_desc", Text: "No Pengajuan [↓]" },
    ];

    const [dataFilterProdi, setDataFilterProdi] = useState([
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
    ]);

    // Load program studi list from endpoint
    useEffect(() => {
        const loadProgramStudiList = async () => {
            try {
                const response = await fetch(`${API_LINK}MeninggalDunia/GetProgramStudiListForMeninggalDunia`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Check if data is valid and has items
                    if (data && Array.isArray(data) && data.length > 0) {
                        const mappedData = data.map(item => {
                            // Use proNama from API response
                            const prodiName = item.proNama || "";
                            
                            return {
                                Value: prodiName,
                                Text: prodiName
                            };
                        }).filter(item => item.Value && item.Value.trim() !== "");
                        
                        const formattedData = [
                            { Value: "", Text: "— Semua Prodi —" },
                            ...mappedData
                        ];
                        
                        setDataFilterProdi(formattedData);
                    }
                }
            } catch (error) {
                // API failed, keep fallback data that was set in initial state
                console.error("Failed to load program studi list:", error);
            }
        };

        loadProgramStudiList();
    }, []);

    // Helper function to normalize text for search
    const normalizeTextForSearch = useCallback((text) => {
        return String(text)
            .toLowerCase()
            .replaceAll(/[^\w\s]/g, '')
            .replaceAll(/\s+/g, ' ')
            .trim();
    }, []);

    // Helper function to check if search term matches fields
    const checkSearchMatch = useCallback((normalizedFields, normalizedSearchTerm) => {
        // Check if any field contains the search term
        const fieldMatch = normalizedFields.some(field => 
            field.includes(normalizedSearchTerm)
        );
        
        if (fieldMatch) return true;
        
        // Check combined text for multi-word searches
        const combinedText = normalizedFields.join(' ');
        if (combinedText.includes(normalizedSearchTerm)) return true;
        
        // Check for partial matches in each word
        const searchWords = normalizedSearchTerm.split(' ').filter(w => w.length > 0);
        return searchWords.every(word => 
            normalizedFields.some(field => field.includes(word))
        );
    }, []);

    // Helper function for accurate search filtering
    const applyAccurateSearchFilter = useCallback((data, searchTerm) => {
        if (!searchTerm || searchTerm.trim() === "") return data;
        
        const normalizedSearchTerm = normalizeTextForSearch(searchTerm);
        
        return data.filter(item => {
            const searchableFields = [
                String(item["No Pengajuan"] || item.noPengajuan || item.id || ""),
                String(item["Tanggal Pengajuan"] || item.tanggalPengajuan || ""),
                String(item["Nomor SK"] || item.nomorSK || ""),
                String(item.NIM || item.nim || ""),
                String(item["Nama Mahasiswa"] || item.namaMahasiswa || ""),
                String(item.Prodi || item.prodi || ""),
                String(item.Status || item.status || "")
            ];
            
            const normalizedFields = searchableFields.map(field => normalizeTextForSearch(field));
            
            return checkSearchMatch(normalizedFields, normalizedSearchTerm);
        });
    }, [normalizeTextForSearch, checkSearchMatch]);

    // Helper function for prodi filtering (same as Cuti Akademik)
    const applyProdiFilter = useCallback((data, prodiFilter) => {
        if (!prodiFilter || prodiFilter.trim() === "") return data;
        
        return data.filter(item => {
            const itemProdi = String(item.Prodi || "").trim();
            const filterProdi = prodiFilter.trim();
            
            // Exact match
            if (itemProdi === filterProdi) return true;
            
            // Check if filter contains item (e.g., "D3 Manajemen Informatika (MI)" contains "Manajemen Informatika")
            if (filterProdi.includes(itemProdi)) return true;
            
            // Check if item contains filter
            if (itemProdi.includes(filterProdi)) return true;
            
            // Extract name without prefix and suffix for comparison
            // Remove D3/D4 prefix and (XX) suffix from filter
            const cleanFilter = filterProdi
                .replaceAll(/^D[34]\s+/gi, '') // Remove D3 or D4 prefix
                .replaceAll(/\s*\([^)]*\)\s*$/g, '') // Remove (XX) suffix
                .trim();
            
            // Remove prefix and suffix from item
            const cleanItem = itemProdi
                .replaceAll(/^D[34]\s+/gi, '')
                .replaceAll(/\s*\([^)]*\)\s*$/g, '')
                .trim();
            
            // Compare cleaned names
            return cleanItem === cleanFilter || 
                   cleanItem.includes(cleanFilter) || 
                   cleanFilter.includes(cleanItem);
        });
    }, []);

    // Helper function for sorting (same as Cuti Akademik)
    const applySorting = useCallback((data, sortBy) => {
        if (!sortBy || sortBy === "") return data;
        
        return [...data].sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case "tanggal_desc":
                    valueA = new Date(a["Tanggal Pengajuan"] || "1900-01-01");
                    valueB = new Date(b["Tanggal Pengajuan"] || "1900-01-01");
                    return valueB - valueA;
                    
                case "tanggal_asc":
                    valueA = new Date(a["Tanggal Pengajuan"] || "1900-01-01");
                    valueB = new Date(b["Tanggal Pengajuan"] || "1900-01-01");
                    return valueA - valueB;
                    
                case "id_asc":
                    valueA = String(a["No Pengajuan"] || "");
                    valueB = String(b["No Pengajuan"] || "");
                    return valueA.localeCompare(valueB);
                    
                case "id_desc":
                    valueA = String(a["No Pengajuan"] || "");
                    valueB = String(b["No Pengajuan"] || "");
                    return valueB.localeCompare(valueA);
                    
                default:
                    return 0;
            }
        });
    }, []);

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
                
                // For Prodi users, add prodi filter based on their konsentrasi
                if (roleId === "ROL71" && prodiKonsentrasi) {
                    params.append('Prodi', prodiKonsentrasi);
                }
                
                params.append('PageNumber', page);
                params.append('PageSize', riwayatPageSize);

                const url = `${API_LINK}MeninggalDunia/GetRiwayatMeninggalDunia?${params}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    // JSON parsing failed for riwayat data
                    throw new Error(`Invalid JSON response from server: ${parseError.message}`);
                }

                let actualData = extractArrayFromResponse(data);
                if (!Array.isArray(actualData)) {
                    setDataRiwayat([]);
                    setRiwayatTotal(0);
                    return;
                }

                // Client-side filtering for prodi users
                if (roleId === "ROL71" && prodiKonsentrasi) {
                    actualData = actualData.filter(item => {
                        const itemProdi = item.Prodi || item.prodi || "";
                        
                        const userProgram = prodiKonsentrasi.toLowerCase().trim();
                        const itemProgram = itemProdi.toLowerCase().trim();
                        
                        // Handle both full name and abbreviated name matching
                        const programMatches = 
                            itemProgram === userProgram ||
                            itemProgram.includes(userProgram) ||
                            userProgram.includes(itemProgram) ||
                            // Extract abbreviation from parentheses if exists
                            (userProgram.includes('(') && userProgram.includes(')') && 
                             itemProgram.includes(userProgram.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '')) ||
                            // Match without parentheses content
                            itemProgram.replaceAll(/\s*\([^)]*\)\s*$/g, '').trim() === 
                            userProgram.replaceAll(/\s*\([^)]*\)\s*$/g, '').trim();
                        
                        return programMatches;
                    });
                }

                // Format all data first (like Cuti Akademik)
                let allFormattedData = actualData.map((item, index) => {
                    let actions = ["Detail"];
                    if (item.status === "Disetujui") {
                        actions = ["Detail", "DownloadSK"];
                    }

                    return {
                        No: index + 1, // Will be recalculated after pagination
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

                // Apply filters and sorting (like Cuti Akademik)
                allFormattedData = applyAccurateSearchFilter(allFormattedData, keyword);
                allFormattedData = applyProdiFilter(allFormattedData, prodi);
                allFormattedData = applySorting(allFormattedData, sort);

                // Client-side pagination
                const totalItems = allFormattedData.length;
                const startIndex = (page - 1) * riwayatPageSize;
                const endIndex = startIndex + riwayatPageSize;
                const paginatedData = allFormattedData.slice(startIndex, endIndex);

                // Recalculate row numbers for current page
                const finalData = paginatedData.map((item, index) => ({
                    ...item,
                    No: startIndex + index + 1
                }));

                setDataRiwayat(finalData);
                
                // Use total items before pagination for proper pagination controls
                setRiwayatTotal(totalItems);
                setRiwayatPage(page);

            } catch (err) {
                Toast.error(`Gagal memuat data riwayat: ${err.message}`);
                setDataRiwayat([]);
                setRiwayatTotal(0);
            } finally {
                setLoadingRiwayat(false);
            }
        },
        [userData, riwayatSearch, filterSort, filterProdi, riwayatPageSize, extractArrayFromResponse, roleId, prodiKonsentrasi, applyAccurateSearchFilter, applyProdiFilter, applySorting]
    );


    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedMeninggalId, setSelectedMeninggalId] = useState(null);
    const [selectedSKFile, setSelectedSKFile] = useState(null);
    const [selectedSPKBFile, setSelectedSPKBFile] = useState(null);
    const [skFilePreview, setSKFilePreview] = useState(null);
    const [spkbFilePreview, setSPKBFilePreview] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);

    const handleUpload = (id) => {
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

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
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

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            Toast.error("Format file tidak didukung. Gunakan PDF, JPG, JPEG, atau PNG.");
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
            formData.append('ModifiedBy', userData?.nama || userData?.username || 'nda_admin');

            const response = await fetch(`${API_LINK}MeninggalDunia/UploadSKMeninggalDunia`, {
                method: 'PUT',
                headers: getAuthHeadersForFormData(),
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    // Use default error message if JSON parsing fails
                    if (parseError) { /* parseError handled by using default message */ }
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();

            Toast.success(result.message || "Upload SK berhasil!");
            setShowUploadModal(false);
            setSelectedSKFile(null);
            setSelectedSPKBFile(null);
            setSKFilePreview(null);
            setSPKBFilePreview(null);
            setSelectedMeninggalId(null);
            
            await loadPengajuan(pengajuanPage);
            if (roleId === "ROL71" || roleId === "ROL999" || roleId === "ROL01" || roleId === "ROL74") {
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

    const handlePrint = async (id) => {
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

            const printUrl = `${API_LINK}MeninggalDunia/PrintSKMeninggalDunia/${encodeURIComponent(id)}?${params.toString()}`;

            const response = await fetch(printUrl, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                if (response.status === 401) {
                    Toast.error("Sesi habis. Silakan login kembali.");
                } else if (response.status === 403) {
                    Toast.error("Anda tidak memiliki akses untuk mencetak SK ini.");
                } else if (response.status === 404) {
                    Toast.error("SK tidak ditemukan atau belum tersedia.");
                } else {
                    Toast.error(`Gagal mencetak SK: HTTP ${response.status}`);
                }
                return;
            }

            const blob = await response.blob();
            const url = globalThis.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SK_Meninggal_Dunia_${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            globalThis.URL.revokeObjectURL(url);
            
            Toast.success("SK berhasil dicetak!");

        } catch (error) {
            Toast.error(`Gagal mencetak SK: ${error.message}`);
        }
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

            const downloadUrl = `${API_LINK}MeninggalDunia/DownloadFileMeninggalDunia/${encodeURIComponent(id)}?${params.toString()}`;

            const checkParams = new URLSearchParams({
                username: username,
                format: "json"
            });
            
            const checkUrl = `${API_LINK}MeninggalDunia/GetDetailMeninggalDunia/${encodeURIComponent(id)}?${checkParams.toString()}`;
            
            const checkResponse = await fetch(checkUrl, {
                method: 'GET',
                headers: getAuthHeaders()
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

            globalThis.open(downloadUrl, "_blank");
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
            const url = `${API_LINK}MeninggalDunia/FinalizeDraftMeninggalDunia/${encodedId}`;

            const res = await fetch(url, {
                method: "POST",
                headers: getAuthHeaders()
            });

            if (!res.ok) {
                const errorText = await res.text();
                
                try {
                    const errorData = JSON.parse(errorText);
                    const errorMsg = errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
                    Toast.error(`Gagal mengajukan: ${errorMsg}`);
                } catch (parseError) {
                    // Failed to parse error response JSON, use fallback error message
                    if (parseError) { /* parseError handled by showing generic error */ }
                    Toast.error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return;
            }

            const raw = await res.text();
            let result;
            try {
                result = JSON.parse(raw);
            } catch (parseError) {
                // Failed to parse ajukan response JSON
                Toast.error(`Response server tidak valid: ${parseError.message}`);
                return;
            }

            if (result?.message?.includes("Berhasil")) {
                Toast.success(result.message);
                
                if (roleId === "ROL71") {
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
            const url = `${API_LINK}MeninggalDunia/DeleteMeninggalDunia/${encodedId}`;
            const res = await fetch(url, { 
                method: "DELETE",
                headers: getAuthHeaders()
            });
            
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
            let role = "";
            if (roleId === "ROL71") role = "prodi";
            else if (roleId === "ROL999") role = "wadir1";
            else if (roleId === "ROL01") role = "finance";

            const payload = { 
                username: userData?.nama || userData?.username || userData?.userid || "",
                role 
            };
            const encodedItemId = encodeURIComponent(itemId);
            const url = `${API_LINK}MeninggalDunia/ApproveMeninggalDunia/${encodedItemId}`;

            const res = await fetch(url, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                
                try {
                    const errorData = JSON.parse(errorText);
                    const errorMsg = errorData.message || errorData.error || `HTTP ${res.status}`;
                    Toast.error(`Gagal menyetujui: ${errorMsg}`);
                } catch (parseError) {
                    // Failed to parse error response JSON, use fallback error message
                    if (parseError) { /* parseError handled by showing generic error */ }
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
            // Use the exact payload structure from your working curl
            const payload = {
                role: userData?.roleId || "",
                username: userData?.nama || userData?.username || ""
            };

            const encodedItemId = encodeURIComponent(itemId);
            const url = `${API_LINK}MeninggalDunia/RejectMeninggalDunia/${encodedItemId}`;

            const res = await fetch(url, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorText = await res.text();
                
                try {
                    const errorData = JSON.parse(errorText);
                    const errorMsg = errorData.message || errorData.error || errorData.details || `HTTP ${res.status}: ${res.statusText}`;
                    Toast.error(`Gagal menolak pengajuan: ${errorMsg}`);
                } catch (parseError) {
                    Toast.error(`Gagal menolak pengajuan: HTTP ${res.status}\n\n${errorText} - Parse error: ${parseError.message}`);
                }
                return;
            }

            const raw = await res.text();
            let result;
            try {
                result = JSON.parse(raw);
            } catch (parseError) {
                Toast.error(`Response server tidak valid: ${parseError.message}\n\n${raw}`);
                return;
            }

            if (result?.message?.includes("Berhasil")) {
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

    const buildExportParams = useCallback(() => {
        const params = new URLSearchParams();
        if (riwayatSearch && riwayatSearch.trim() !== "") {
            params.append('SearchKeyword', riwayatSearch.trim());
        }
        if (filterSort && filterSort !== "") {
            params.append('Sort', filterSort);
        }
        
        // For Prodi users, add prodi filter based on their konsentrasi
        if (roleId === "ROL71" && prodiKonsentrasi) {
            params.append('Prodi', prodiKonsentrasi);
        }
        
        return params;
    }, [riwayatSearch, filterSort, roleId, prodiKonsentrasi]);

    const downloadFile = useCallback((blob, response) => {
        // Create download link
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Set filename from response headers or use default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'Riwayat_Meninggal_Dunia.xlsx';
        if (contentDisposition) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const filenameMatch = filenameRegex.exec(contentDisposition);
            if (filenameMatch?.[1]) {
                filename = filenameMatch[1].replaceAll(/['"]/g, '');
            }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        link.remove();
        globalThis.URL.revokeObjectURL(url);
    }, []);

    const handleExportExcel = async () => {
        if (!isClient || !userData?.permission?.includes("meninggal_dunia.export")) {
            Toast.error("Anda tidak memiliki izin untuk mengekspor data.");
            return;
        }

        try {
            const params = buildExportParams();
            const queryString = params.toString();
            const exportUrl = `${API_LINK}MeninggalDunia/ExportRiwayatMeninggalDuniaToExcel${queryString ? '?' + queryString : ''}`;
            
            const response = await fetch(exportUrl, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                if (response.status === 401) {
                    Toast.error("Sesi habis. Silakan login kembali.");
                    return;
                } else if (response.status === 403) {
                    Toast.error("Anda tidak memiliki akses untuk mengekspor data.");
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            downloadFile(blob, response);
            Toast.success("File Excel berhasil diunduh!");

        } catch (error) {
            Toast.error(`Gagal mengekspor data: ${error.message}`);
        }
    };

    const filterContentRiwayat = (
        <>
            <DropDown
                ref={sortRef}
                arrData={dataFilterSort}
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


    // Setup global function for print button (run once)
    useEffect(() => {
        globalThis.handlePrintMeninggalDunia = (id) => {
            handlePrint(id);
        };

        // Cleanup on unmount
        return () => {
            delete globalThis.handlePrintMeninggalDunia;
        };
    }, []); // Empty dependency array - run only once

    useEffect(() => {
        if (!isClient) return;

        if (!ssoData) {
            Toast.error("Sesi habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }

        if (!userData) return;

        if (roleId === "ROL71") {
            if (loadingProdiKonsentrasi || !prodiKonsentrasi) {
                return;
            }
        }

        loadPengajuan(1);
        
        if (roleId === "ROL71" || roleId === "ROL999" || roleId === "ROL01" || roleId === "ROL74") {
            loadRiwayat(1);
        }
    }, [isClient, ssoData, userData, loadPengajuan, loadRiwayat, roleId, router, prodiKonsentrasi, loadingProdiKonsentrasi]);

    // Early return for server-side rendering to prevent hydration mismatch
    if (!isClient) {
        return null;
    }

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
            {roleId !== "ROL01" && (
                <div className="mb-4">
                    <h5>Daftar Pengajuan Meninggal Dunia</h5>
                    
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        {isClient && roleId === "ROL71" && userData?.permission?.includes("meninggal_dunia.create") && (
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
                            return null; // Loading handled by MainContent
                        } else if (dataPengajuan.length > 0) {
                            return (
                                <>
                                    <Table
                                        data={dataPengajuan}
                                        onDetail={handleDetail}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onSent={handleAjukan}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        onUpload={handleUpload}
                                        onDownloadSK={handleDownloadSK}
                                        config={{
                                            statusBadgeMap: {
                                                // Belum Disetujui statuses - use Diproses styling (warning)
                                                "Belum Disetujui Wadir 1": "bg-warning-subtle text-warning",
                                                "Belum Disetujui Finance": "bg-warning-subtle text-warning", 
                                                "Belum Disetujui Prodi": "bg-warning-subtle text-warning",
                                                // Ditolak statuses - use Ditolak styling (danger)
                                                "Ditolak wadir1": "bg-danger-subtle text-danger",
                                                "Ditolak prodi": "bg-danger-subtle text-danger",
                                                "Ditolak finance": "bg-danger-subtle text-danger",
                                                "Menunggu Upload SK": "bg-warning-subtle text-warning",
                                            }
                                        }}
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
                                            if (roleId === "ROL71") {
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
            {(roleId === "ROL71" || roleId === "ROL999" || roleId === "ROL01" || roleId === "ROL74") && (
                <div className="mt-5">
                    <h5>Daftar Riwayat Meninggal Dunia</h5>
                    
                    <Formsearch
                        onSearch={handleSearchRiwayat}
                        onFilter={handleRiwayatFilter}
                        onExport={handleExportExcel}
                        searchPlaceholder=""
                        showAddButton={false}
                        showFilterButton={true}
                        showExportButton={isClient && userData?.permission?.includes("meninggal_dunia.export")}
                        exportButtonText="Unduh Excel"
                        filterContent={filterContentRiwayat}
                    />

                    {(() => {
                        if (loadingRiwayat) {
                            return null; // Loading handled by MainContent
                        } else if (dataRiwayat.length > 0) {
                            return (
                                <>
                                    <Table
                                        data={dataRiwayat}
                                        onDetail={handleDetail}
                                        onDownloadSK={handleDownloadSK}
                                        config={{
                                            statusBadgeMap: {
                                                // Belum Disetujui statuses - use Diproses styling (warning)
                                                "Belum Disetujui Wadir 1": "bg-warning-subtle text-warning",
                                                "Belum Disetujui Finance": "bg-warning-subtle text-warning", 
                                                "Belum Disetujui Prodi": "bg-warning-subtle text-warning",
                                                // Ditolak statuses - use Ditolak styling (danger)
                                                "Ditolak wadir1": "bg-danger-subtle text-danger",
                                                "Ditolak prodi": "bg-danger-subtle text-danger",
                                                "Ditolak finance": "bg-danger-subtle text-danger",
                                                // Additional status variations
                                                "Menunggu Upload SK": "bg-warning-subtle text-warning",
                                            }
                                        }}
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
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleSKFileSelect}
                                        disabled={uploadLoading}
                                    />
                                    <small className="text-muted">
                                        Format yang didukung: PDF, JPG, JPEG, PNG (Maksimal 10MB)
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
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleSPKBFileSelect}
                                        disabled={uploadLoading}
                                    />
                                    <small className="text-muted">
                                        Format yang didukung: PDF, JPG, JPEG, PNG (Maksimal 10MB)
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
                                            <span className="spinner-border spinner-border-sm me-2" aria-label="Uploading"></span>
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
}//ss
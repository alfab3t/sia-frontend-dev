"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Paging from "@/components/common/Paging";
import Table from "@/components/common/Table";
import Toast from "@/components/common/Toast";
import Button from "@/components/common/Button";
import DropDown from "@/components/common/Dropdown";
import Label from "@/components/common/Label";
import MainContent from "@/components/layout/MainContent";
import Formsearch from "@/components/common/Formsearch";
import { useRouter } from "next/navigation";
import { API_LINK } from "@/lib/constant";
import { encryptIdUrl } from "@/lib/encryptor";
import SweetAlert from "@/components/common/SweetAlert";
import { getSSOData, getUserData } from "@/context/user";

export default function Page_Administrasi_Pengajuan_Cuti_Akademik() {
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  
  const router = useRouter();
  const [dataCutiAkademik, setDataCutiAkademik] = useState([]);
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRiwayat, setShowRiwayat] = useState(false);

  const sortRef = useRef();
  const prodiRef = useRef();


  const roleId = userData?.roleId || "";
  
  const isMahasiswa = roleId === "ROL23";
  const isProdi = roleId === "ROL71";
  const isWadir1 = roleId === "ROL999";
  const isFinance = roleId === "ROL01";
  const isAdmin = roleId === "ROL21";

  const dataFilterSort = [
    { Value: "tanggal_desc", Text: "Tanggal Pengajuan [↓]" },
    { Value: "tanggal_asc", Text: "Tanggal Pengajuan [↑]" },
    { Value: "id_asc", Text: "No Pengajuan [↑]" },
    { Value: "id_desc", Text: "No Pengajuan [↓]" },
  ];

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

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageRiwayat, setCurrentPageRiwayat] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [totalDataRiwayat, setTotalDataRiwayat] = useState(0);
  const [pageSize] = useState(10);
  const [search] = useState("");
  const [searchRiwayat, setSearchRiwayat] = useState("");
  const [sortBy, setSortBy] = useState(dataFilterSort[0].Value);
  const [filterProdi, setFilterProdi] = useState(dataFilterProdi[0].Value);
  
  const [bebasTanggunganStatus, setBebasTanggunganStatus] = useState(null);
  
  const [prodiKonsentrasi, setProdiKonsentrasi] = useState(null);
  const [loadingProdiKonsentrasi, setLoadingProdiKonsentrasi] = useState(false);

  useEffect(() => {
    if (!isMahasiswa || !userData) return;
    
    const checkBebasTanggungan = async () => {
      try {
        const userId = userData?.nama || userData?.mhsId || userData?.userid || userData?.username || "";
        
        if (!userId) {
          return;
        }

        const response = await fetch(`${API_LINK}Mahasiswa/CheckBebasTanggungan?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBebasTanggunganStatus(data.status);
        }
      } catch {
        setBebasTanggunganStatus(null);
      }
    };

    checkBebasTanggungan();
  }, [isMahasiswa, userData]);
  
  useEffect(() => {
    if (!isProdi || !userData) return;
    
    const loadProdiKonsentrasi = async () => {
      try {
        setLoadingProdiKonsentrasi(true);
        const username = userData?.nama || userData?.username || "";
        
        if (!username) {
          return;
        }

        const response = await fetch(`${API_LINK}Mahasiswa/GetKonsentrasiList?username=${username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
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
        setProdiKonsentrasi(null);
      } finally {
        setLoadingProdiKonsentrasi(false);
      }
    };

    loadProdiKonsentrasi();
  }, [isProdi, userData]);
  
  const getRoleBasedParams = useCallback(() => {
    let mhsId = "%";
    let statusFilter = "";
    let userId = "";
    
    if (isMahasiswa) {
      mhsId = userData?.mhsId || userData?.nama || userData?.username || userData?.userid || "";
      if (!mhsId) {
        return null;
      }

    } else if (isProdi) {
      userId = userData?.username || "";
      
    } else if (isWadir1) {
      statusFilter = "Belum Disetujui Wadir 1";
      
    } else if (isFinance) {
      statusFilter = "Belum Disetujui Finance";
      
    } else if (isAdmin) {
      statusFilter = "Menunggu Upload SK";
      
    } 

    return { mhsId, statusFilter, userId };
  }, [isMahasiswa, isProdi, isWadir1, isFinance, isAdmin, userData]);


  const filterDataByRole = useCallback((actualData) => {
    return actualData.filter(item => {
      const currentStatus = item.status || item.cak_status || "";
      
      if (isMahasiswa) {
        return true;
      }
      
      if (isProdi) {
        return filterProdiData(item, currentStatus);
      }
      
      if (isAdmin) {
        return filterAdminData(currentStatus);
      }
      return currentStatus !== "Disetujui";
    });
  }, [isMahasiswa, isProdi, isAdmin, prodiKonsentrasi]);

  const filterProdiData = useCallback((item, currentStatus) => {
    const itemProdi = item.prodi || item.kon_nama || item.konsentrasi || "";
    const normalizeProdiName = (name) => {
      if (!name) return "";
      return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    };
    
    const normalizedItemProdi = normalizeProdiName(itemProdi);
    const normalizedProdiKonsentrasi = normalizeProdiName(prodiKonsentrasi);
    
    if (prodiKonsentrasi && normalizedItemProdi !== normalizedProdiKonsentrasi) {
      return false;
    }
    
    if (currentStatus === "Draft") {
      const approveProdiValue = item.approveProdi || item.cak_approve_prodi || "";
      return approveProdiValue !== "" && approveProdiValue;
    }
    
    return currentStatus === "Belum Disetujui Prodi" || currentStatus === "Belum Disetujui Wadir 1";
  }, [prodiKonsentrasi]);

  const filterAdminData = useCallback((currentStatus) => {
    return currentStatus === "Belum Disetujui Prodi" ||
           currentStatus === "Belum Disetujui Wadir 1" ||
           currentStatus === "Menunggu Upload SK";
  }, []);

  const determineActions = useCallback((item, currentStatus, isDraft) => {
    if (isMahasiswa) {
      return determineMahasiswaActions(item, currentStatus, isDraft);
    }
    
    if (isProdi) {
      return determineProdiActions(currentStatus);
    }
    
    if (isWadir1) {
      return determineWadir1Actions(currentStatus);
    }
    
    if (isFinance) {
      return determineFinanceActions(currentStatus);
    }
    
    if (isAdmin) {
      return determineAdminActions(currentStatus);
    }
    
    return ["Detail"];
  }, [isMahasiswa, isProdi, isWadir1, isFinance, isAdmin]);

  const determineMahasiswaActions = useCallback((item, currentStatus, isDraft) => {
    const approveProdiValue = item.approveProdi || item.cak_approve_prodi || "";
    
    if (approveProdiValue && approveProdiValue !== "" && currentStatus !== "Disetujui") {
      return ["Detail"];
    }
    
    if (isDraft) {
      return ["Detail", "Edit", "Delete", "Ajukan"];
    }
    
    if (currentStatus === "Disetujui") {
      return ["Detail", "DownloadSK"];
    }
    
    return ["Detail"];
  }, []);

  const determineProdiActions = useCallback((currentStatus) => {
    if (currentStatus === "Draft") {
      return ["Detail", "Edit", "Delete", "Ajukan"];
    }
    
    if (currentStatus === "Belum Disetujui Prodi") {
      return ["Detail", "Approve", "Reject"];
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

  const determineAdminActions = useCallback((currentStatus) => {
    const isAllApprovalsComplete = currentStatus && 
      !currentStatus.includes("Belum Disetujui Prodi") && 
      !currentStatus.includes("Belum Disetujui Wadir 1") && 
      !currentStatus.includes("Belum Disetujui Finance") &&
      !currentStatus.includes("Draft") &&
      !currentStatus.includes("Ditolak");
      
    const isReadyForSK = currentStatus === "Menunggu Upload SK" || 
                       currentStatus === "Disetujui" ||
                       isAllApprovalsComplete;
    
    return isReadyForSK ? ["Detail", "UploadSK"] : ["Detail"];
  }, []);

  const formatTableRow = useCallback((item, index, startIndex, currentStatus, actions) => {
    const isDraft = item.status === "Draft" || item.id === "DRAFT" || !item.id?.includes("PMA");
    const noSK = item.SuratNo || item.suratNo || item.srt_no || item.cak_srt_no || "";
    
    let namaMahasiswa = item.NamaMahasiswa || item.namaMahasiswa || item.mhs_nama || item.nama_mahasiswa || "";
    let prodi = item.Prodi || item.prodi || item.kon_nama || item.kon_singkatan || "";
    
    if (!namaMahasiswa || namaMahasiswa === "") namaMahasiswa = "-";
    if (!prodi || prodi === "") prodi = "-";

    const approveProdiValue = item.approveProdi || item.cak_approve_prodi || "";
    const isCreatedByProdi = approveProdiValue && approveProdiValue !== "";
    
    let noPengajuan;
    if (isDraft && isCreatedByProdi) {
      noPengajuan = "Draft";
    } else if (isMahasiswa && isDraft) {
      noPengajuan = "Draft";
    } else {
      noPengajuan = item.id || item.idDisplay || item.cak_id || "-";
    }

    const rowData = {
      No: startIndex + index + 1, 
      id: item.cak_id || item.id || item.idDisplay, 
      "No Pengajuan": noPengajuan, 
      "Tanggal Pengajuan": item.tanggal || item.cak_created_date || "-",
      "No SK": noSK || "-", 
      "Nama Mahasiswa": namaMahasiswa,
      Prodi: prodi,
      "Disetujui Prodi": getProdiIcon(currentStatus, item),
      "Disetujui Wadir 1": getWadir1Icon(currentStatus),
      Status: currentStatus || "-",
    };

    if (isAdmin) {
      rowData["SK Cuti Akademik"] = formatSKCutiAkademikColumn(currentStatus);
      rowData.Aksi = actions;
      rowData.Alignment = new Array(11).fill("center");
    } else {
      rowData.Aksi = actions;
      rowData.Alignment = new Array(10).fill("center");
    }

    return rowData;
  }, [isAdmin, isMahasiswa]);

  const formatSKCutiAkademikColumn = useCallback((currentStatus) => {
    if (isAdmin) {
      return currentStatus === "Menunggu Upload SK" ? "DownloadSK" : "-";
    }
    return "-";
  }, [isAdmin]);

  const getProdiIcon = useCallback((status, item) => {
    if (!status) return "⏳";
    
    const statusLower = status.toLowerCase();
    
    if (statusLower === "draft") {
      return "✗";
    } else if (statusLower === "belum disetujui prodi") {
      return "✗";
    } else if (statusLower.includes("ditolak") && statusLower.includes("prodi")) {
      return "✗";
    } else if (statusLower === "menunggu upload sk" || 
               statusLower.includes("disetujui") || 
               statusLower.includes("wadir") || 
               statusLower.includes("finance")) {
      return "✓";
    } else {
      return "⏳";
    }
  }, []);

  const getWadir1Icon = useCallback((status) => {
    if (!status) return "⏳";
    
    const statusLower = status.toLowerCase();
    if (statusLower === "draft" || statusLower === "belum disetujui prodi") {
      return "✗";
    } else if (statusLower === "belum disetujui wadir 1") {
      return "✗";
    } else if (statusLower.includes("ditolak")) {
      return "✗";
    } else if (statusLower === "menunggu upload sk" || 
               statusLower.includes("disetujui") || 
               statusLower.includes("finance") || 
               statusLower.includes("upload sk")) {
      return "✓";
    } else {
      return "⏳";
    }
  }, []);

  const buildMainDataParams = useCallback((roleParams, backendRole) => {
    const { mhsId, statusFilter, userId } = roleParams;
    const params = new URLSearchParams();
    
    if (isMahasiswa) {
      params.append('mhsId', mhsId);
    } else {
      params.append('mhsId', mhsId || '%');
    }
    
    if (statusFilter) params.append('status', statusFilter);
    if (userId) params.append('userId', userId);
    if (backendRole) params.append('role', backendRole);
    if (search) params.append('search', search);

    return params;
  }, [isMahasiswa, search]);

  const fetchMainData = useCallback(async (params) => {
    const url = `${API_LINK}CutiAkademik?${params}`;

    const [response] = await Promise.all([
      fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }),
      new Promise(resolve => setTimeout(resolve, 250))
    ]);
    
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

    return data;
  }, []);

  const processMainData = useCallback((actualData, page) => {
    const pendingData = filterDataByRole(actualData);
    const totalPendingItems = pendingData.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPendingData = pendingData.slice(startIndex, endIndex);

    const formattedData = paginatedPendingData.map((item, index) => {
      const isDraft = item.status === "Draft" || item.id === "DRAFT" || !item.id?.includes("PMA");
      const currentStatus = item.status || item.cak_status || "";
      const actions = determineActions(item, currentStatus, isDraft);

      return formatTableRow(item, index, startIndex, currentStatus, actions);
    });

    return { formattedData, totalPendingItems };
  }, [filterDataByRole, determineActions, formatTableRow, pageSize]);

  const extractArrayData = useCallback((data) => {
    let actualData = data;
    if (data && typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
        actualData = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        actualData = data.items;
      } else if (data.result && Array.isArray(data.result)) {
        actualData = data.result;
      } else if (!Array.isArray(data)) {
        const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayProps.length > 0) {
          actualData = data[arrayProps[0]];
        }
      }
    }

    if (!Array.isArray(actualData)) {
      return [];
    }

    return actualData;
  }, []);

  const loadData = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        const roleParams = getRoleBasedParams();
        if (!roleParams) {
          setDataCutiAkademik([]);
          setTotalData(0);
          return;
        }

        let backendRole = roleId;
        if (roleId === "ROL21") {
          backendRole = "ROL21";
        }

        const params = buildMainDataParams(roleParams, backendRole);
        const data = await fetchMainData(params);
        const actualData = extractArrayData(data);

        if (!Array.isArray(actualData)) {
          setDataCutiAkademik([]);
          setTotalData(0);
          return;
        }

        const { formattedData, totalPendingItems } = processMainData(actualData, page);

        setDataCutiAkademik(formattedData);
        setTotalData(totalPendingItems); 
        setCurrentPage(page);
      } catch (err) {
        Toast.error(`Gagal memuat data pengajuan: ${err.message}`);
        setDataCutiAkademik([]);
        setTotalData(0);
      } finally {
        setLoading(false);
      }
    },
    [roleId, isMahasiswa, isProdi, isWadir1, isFinance, isAdmin, userData, search, prodiKonsentrasi, getRoleBasedParams, buildMainDataParams, fetchMainData, extractArrayData, processMainData]
  );

  const buildRiwayatParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (!isAdmin && userData?.username) {
      const userIdentifier = isMahasiswa ? 
        (userData?.mhsId || userData?.nama || userData?.username) : 
        userData?.username;
      params.append('userId', userIdentifier);
    }
    
    return params;
  }, [isAdmin, isMahasiswa, userData]);

  const fetchRiwayatData = useCallback(async (params) => {
    const url = `${API_LINK}CutiAkademik/riwayat?${params}`;

    const [response] = await Promise.all([
      fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }),
      new Promise(resolve => setTimeout(resolve, 250))
    ]);
    
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

    return data;
  }, []);

  const parseDateFromString = useCallback((tanggalStr) => {
    if (!tanggalStr) return null;
    
    const dateMatch = tanggalStr.match(/(\d{2})\s+(\w+)\s+(\d{4})/);
    if (!dateMatch) return null;
    
    const [, , monthName, year] = dateMatch;
    const monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    const month = monthMap[monthName];
    return month ? { month, year } : null;
  }, []);

  const convertToRomanMonth = useCallback((month) => {
    const romanMonths = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return romanMonths[month] || '';
  }, []);

  const extractSequenceFromId = useCallback((idStr) => {
    if (!idStr) return "001";
    const sequenceMatch = idStr.match(/^(\d{3})/);
    return sequenceMatch ? sequenceMatch[1] : "001";
  }, []);

  const generateSKNumber = useCallback((item) => {
    let nomorSK = item.SuratNo || item.suratNo || item.srt_no || item.cak_srt_no || "";
    
    if (!nomorSK && item.status === "Disetujui") {
      try {
        const tanggalStr = item.tanggal || item.cak_created_date || "";
        const dateInfo = parseDateFromString(tanggalStr);
        
        if (dateInfo) {
          const romanMonth = convertToRomanMonth(dateInfo.month);
          const idStr = item.id || item.cak_id || "";
          const sequence = extractSequenceFromId(idStr);
          
          nomorSK = `${sequence}/PA-WADIR-I/SKC/${romanMonth}/${dateInfo.year}`;
        }
      } catch {
      }
    }
    
    return nomorSK;
  }, [parseDateFromString, convertToRomanMonth, extractSequenceFromId]);

  const fetchMissingData = useCallback(async (item, namaMahasiswa, prodi) => {
    if (!namaMahasiswa || !prodi || namaMahasiswa === "" || prodi === "") {
      try {
        const detailUrl = `${API_LINK}CutiAkademik/detail?id=${item.id || item.cak_id}`;
        
        const detailResponse = await fetch(detailUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          
          if (!namaMahasiswa || namaMahasiswa === "") {
            namaMahasiswa = detailData.mahasiswa ||           
                           detailData.mhs_nama || 
                           detailData.namaMahasiswa || 
                           detailData.nama_mahasiswa || 
                           detailData.mahasiswaNama ||
                           detailData.nama ||
                           detailData.name || "-";
          }
          
          if (!prodi || prodi === "") {
            prodi = detailData.konsentrasi ||                 
                   detailData.prodiNama ||                    
                   detailData.konsentrasiSingkatan ||         
                   detailData.kon_singkatan || 
                   detailData.prodi || 
                   detailData.programStudi || 
                   detailData.program_studi || 
                   detailData.jurusan || "-";
          }
        }
      } catch {
      }
    }
    
    return {
      namaMahasiswa: namaMahasiswa || "-",
      prodi: prodi || "-"
    };
  }, []);

  const formatRiwayatItem = useCallback(async (item, index) => {
    let namaMahasiswa = item.NamaMahasiswa || item.namaMahasiswa || item.mhs_nama || 
                       item.nama_mahasiswa || item.mahasiswaNama || item.mahasiswa || 
                       item.nama || item.name || "";

    let prodi = item.Prodi || item.prodi || item.kon_nama || item.kon_singkatan || 
               item.konsentrasi || item.konsentrasiSingkatan || item.programStudi || 
               item.program_studi || item.prodiNama || "";

    const missingData = await fetchMissingData(item, namaMahasiswa, prodi);
    namaMahasiswa = missingData.namaMahasiswa;
    prodi = missingData.prodi;

    const nomorSK = generateSKNumber(item);

    return {
      No: index + 1,
      id: item.cak_id || item.id,
      "No Cuti Akademik": item.id || item.cak_id || "-",
      "Tanggal Pengajuan": item.tanggal || item.cak_created_date || "-",
      "Nomor SK": nomorSK || "-",
      NIM: item.mhsId || item.mhs_id || item.cak_mhs_id || "-",
      "Nama Mahasiswa": namaMahasiswa,
      Prodi: prodi,
      Aksi: ["Detail"],
      Alignment: new Array(8).fill("center"),
    };
  }, [fetchMissingData, generateSKNumber]);

  const applySearchFilter = useCallback((data, searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") return data;
    
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
    return data.filter(item => {
      const searchableFields = [
        String(item["No Cuti Akademik"] || ""),
        String(item["Tanggal Pengajuan"] || ""),
        String(item["Nomor SK"] || ""),
        String(item.NIM || ""),
        String(item["Nama Mahasiswa"] || ""),
        String(item.Prodi || "")
      ];
      
      const searchableText = searchableFields
        .join(" ")
        .toLowerCase()
        .replaceAll(/\s+/g, " ")
        .trim();
      
      const isMatch = searchableText.includes(normalizedSearchTerm);
      const exactFieldMatch = searchableFields.some(field => 
        String(field).toLowerCase().includes(normalizedSearchTerm)
      );
      
      return isMatch || exactFieldMatch;
    });
  }, []);

  const applyProdiFilter = useCallback((data, prodiFilter) => {
    if (!prodiFilter || prodiFilter.trim() === "") return data;
    
    return data.filter(item => {
      const itemProdi = String(item.Prodi || "").trim();
      return itemProdi === prodiFilter;
    });
  }, []);

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
          valueA = String(a["No Cuti Akademik"] || "");
          valueB = String(b["No Cuti Akademik"] || "");
          return valueA.localeCompare(valueB);
          
        case "id_desc":
          valueA = String(a["No Cuti Akademik"] || "");
          valueB = String(b["No Cuti Akademik"] || "");
          return valueB.localeCompare(valueA);
          
        default:
          return 0;
      }
    });
  }, []);

  const loadDataRiwayat = useCallback(
    async (page = 1) => {
      try {
        setLoadingRiwayat(true);

        const params = buildRiwayatParams();
        const data = await fetchRiwayatData(params);
        const actualData = extractArrayData(data);

        if (actualData.length === 0) {
          setDataRiwayat([]);
          setTotalDataRiwayat(0);
          return;
        }

        const completedData = actualData.filter(item => {
          const currentStatus = item.status || item.cak_status || "";
          return currentStatus === "Disetujui";
        });

        const formattedDataPromises = completedData.map((item, index) => 
          formatRiwayatItem(item, index)
        );
        
        let allFormattedData = await Promise.all(formattedDataPromises);

        allFormattedData = applySearchFilter(allFormattedData, searchRiwayat);
        allFormattedData = applyProdiFilter(allFormattedData, filterProdi);
        allFormattedData = applySorting(allFormattedData, sortBy);

        const totalFilteredItems = allFormattedData.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = allFormattedData.slice(startIndex, endIndex);

        const finalData = paginatedData.map((item, index) => ({
          ...item,
          No: startIndex + index + 1
        }));

        setDataRiwayat(finalData);
        setTotalDataRiwayat(totalFilteredItems); 
        setCurrentPageRiwayat(page);
      } catch (err) {
        Toast.error(`Gagal memuat data riwayat: ${err.message}`);
        setDataRiwayat([]);
        setTotalDataRiwayat(0);
      } finally {
        setLoadingRiwayat(false);
      }
    },
    [userData, searchRiwayat, sortBy, filterProdi, isProdi, isWadir1, isFinance, isAdmin, isMahasiswa, pageSize, buildRiwayatParams, fetchRiwayatData, extractArrayData, formatRiwayatItem, applySearchFilter, applyProdiFilter, applySorting]
  );
  
  const validateUserForSubmission = useCallback(() => {
    const modifiedBy = userData?.nama || userData?.mhsId || userData?.userid || userData?.username || "";
    
    if (!modifiedBy) {
      Toast.error("Data user tidak lengkap. Silakan login ulang.");
      return null;
    }
    
    return modifiedBy;
  }, [userData]);

  const buildSubmissionPayload = useCallback((id, modifiedBy) => {
    const basePayload = {
      DraftId: id,
      ModifiedBy: modifiedBy,
      Timestamp: Date.now()
    };

    if (isProdi) {
      return {
        payload: basePayload,
        url: `${API_LINK}CutiAkademik/prodi/generate-id`
      };
    } else {
      return {
        payload: basePayload,
        url: `${API_LINK}CutiAkademik/generate-id`
      };
    }
  }, [isProdi]);

  const handleSubmissionError = useCallback((res, raw) => {
    
    try {
      const errorData = JSON.parse(raw);
      let errorMsg = errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
      
      if (raw.includes("PRIMARY KEY constraint") || raw.includes("duplicate key")) {
        errorMsg = "ID pengajuan sudah ada. Sistem akan mencoba generate ID baru. Silakan coba lagi.";
        setTimeout(() => {
          Toast.success("Mencoba generate ID baru...");
        }, 1000);
      } else if (raw.includes("SqlException")) {
        errorMsg = "Terjadi kesalahan database. Silakan coba lagi atau hubungi admin.";
      }
      
      Toast.error(`Gagal mengajukan: ${errorMsg}`);
    } catch {
      if (raw.includes("PRIMARY KEY constraint")) {
        Toast.error("ID pengajuan sudah ada. Silakan coba lagi dalam beberapa detik.");
      } else if (raw.includes("SqlException")) {
        Toast.error("Terjadi kesalahan database. Silakan coba lagi atau hubungi admin.");
      } else {
        Toast.error(`HTTP ${res.status}: ${res.statusText}`);
      }
    }
  }, []);

  const handleSubmissionSuccess = useCallback((result, id) => {
    if (result?.finalId) {
      Toast.success(`Pengajuan berhasil diajukan dengan ID: ${result.finalId}`);
      
      if (isProdi) {
        const prodiCreatedApps = JSON.parse(sessionStorage.getItem('prodiCreatedApps') || '[]');
        const updatedApps = prodiCreatedApps.filter(appId => appId !== id);
        sessionStorage.setItem('prodiCreatedApps', JSON.stringify(updatedApps));
      }
      
      loadData(1);
    } else {
      const errorMsg = result?.message || result?.error || "Gagal mengajukan pengajuan.";
      Toast.error(errorMsg);
    }
  }, [isProdi, loadData]);

  const handleAjukan = async (id) => {
    const confirm = await SweetAlert({
      title: "Ajukan Pengajuan",
      text: "Setelah diajukan, data tidak dapat diedit kembali. Ajukan sekarang?",
      icon: "warning",
      confirmText: "Ya, Ajukan!",
    });

    if (!confirm) return;

    setLoading(true);

    try {
      const modifiedBy = validateUserForSubmission();
      if (!modifiedBy) return;

      const { payload, url } = buildSubmissionPayload(id, modifiedBy);

      const res = await fetch(url, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      
      if (!res.ok) {
        handleSubmissionError(res, raw);
        return;
      }

      let result;
      try {
        result = JSON.parse(raw);
      } catch {
        Toast.error("Response server tidak valid. Periksa console untuk detail.");
        return;
      }

      handleSubmissionSuccess(result, id);
    } catch (err) {
      Toast.error(`Gagal mengajukan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchRiwayat = useCallback(
    (query) => {
      setSearchRiwayat(query);
      setCurrentPageRiwayat(1); 
      loadDataRiwayat(1);
    },
    [loadDataRiwayat]
  );

  const handleFilterApplyRiwayat = useCallback(() => {
    setSortBy(sortRef.current.value);
    setFilterProdi(prodiRef.current.value);
    loadDataRiwayat(1);
  }, [loadDataRiwayat]);

  const handleNavigation = useCallback(
    (page) => loadData(page),
    [loadData]
  );

  const handleNavigationRiwayat = useCallback(
    (page) => loadDataRiwayat(page),
    [loadDataRiwayat]
  );

  const handleAdd = () => {
    router.push("/pages/administrasi-akademik/cuti-akademik/add");
  };

  const handleDetail = (id) =>
    router.push(
      `/pages/administrasi-akademik/cuti-akademik/detail/${encryptIdUrl(
        id
      )}`
    );

  const handleEdit = (id) => {
    router.push(
      `/pages/administrasi-akademik/cuti-akademik/edit/${encryptIdUrl(id)}`
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

    setLoading(true);

    try {
      
      const url = `${API_LINK}CutiAkademik/${id}`;

      const res = await fetch(url, { method: "DELETE" });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      
      if (data.message?.includes("berhasil")) {
        Toast.success(data.message);
        loadData(1);
      } else {
        throw new Error(data.message || "Gagal menghapus pengajuan");
      }
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleApprove = async (itemId) => {
    const confirm = await SweetAlert({
      title: "Setujui Pengajuan Cuti Akademik",
      text: "Yakin ingin menyetujui pengajuan cuti akademik ini?",
      icon: "warning",
      confirmText: "Ya, Setujui!",
    });

    if (!confirm) return;

    setLoading(true);

    try {
      const approvedBy = userData?.nama || userData?.username || userData?.userid || "";
      
      if (!approvedBy) {
        Toast.error("Data user tidak lengkap. Silakan login ulang.");
        setLoading(false);
        return;
      }

      let url, payload;

      if (isProdi) {
        const menimbang = "Pengajuan cuti akademik telah memenuhi persyaratan dan disetujui oleh program studi.";
        
        url = `${API_LINK}CutiAkademik/approve/prodi`;
        payload = {
          Id: itemId,
          Menimbang: menimbang,
          ApprovedBy: approvedBy
        };
        
      } else if (isFinance || isWadir1) {
        url = `${API_LINK}CutiAkademik/approve`;
        payload = {
          Id: itemId,
          ApprovedBy: approvedBy,
          Role: "" 
        };
        
      } else {
        Toast.error("Role tidak dikenali untuk approval.");
        setLoading(false);
        return;
      }

      const res = await fetch(url, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const raw = await res.text();

      if (!res.ok) {
        
        try {
          const errorData = JSON.parse(raw);
          const errorMsg = errorData.message || errorData.error || `HTTP ${res.status}`;
          Toast.error(`Gagal menyetujui: ${errorMsg}`);
        } catch {
          Toast.error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return;
      }

      
      try {
        JSON.parse(raw);
      } catch {
        
      }

      
      Toast.success("Pengajuan cuti akademik berhasil disetujui!");
      loadData(1); 
      
    } catch (err) {
      Toast.error(`Gagal menyetujui: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateUserForRejection = useCallback(() => {
    const username = userData?.nama || userData?.username || userData?.userid || "";
    
    if (!username) {
      Toast.error("Data user tidak lengkap. Silakan login ulang.");
      return null;
    }
    
    return username;
  }, [userData]);

  const handleRejectionError = useCallback((res, errorText, payload) => {
    
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.details) {
        errorMessage = errorData.details;
      }
      
      if (errorData.errors) {
        const validationErrors = Object.values(errorData.errors).flat();
        errorMessage = validationErrors.join(', ');
      }
      
    } catch {
      errorMessage = `${errorMessage}\n\nRaw response: ${errorText}`;
    }
    
    Toast.error(`Gagal menolak pengajuan: ${errorMessage}`);
  }, []);

  const handleRejectionSuccess = useCallback((result) => {
    if (result && (result.rejected === true || result.success === true || 
        result.message?.toLowerCase().includes("berhasil"))) {
      
      const successMessage = result.message || 
        `Pengajuan berhasil ditolak oleh ${result.role || 'sistem'}`;
      
      Toast.success(successMessage);
      loadData(1);
      if (showRiwayat) loadDataRiwayat(1);
      
      return true;
    } else {
      const errorMessage = result?.message || result?.error || "Gagal menolak pengajuan";
      Toast.error(errorMessage);
      return false;
    }
  }, [loadData, loadDataRiwayat, showRiwayat]);

  const handleReject = async (itemId) => {
    const confirm = await SweetAlert({
      title: "Tolak Pengajuan Cuti Akademik",
      text: "Yakin ingin menolak pengajuan cuti akademik ini?",
      icon: "warning",
      confirmText: "Ya, Tolak!",
    });

    if (!confirm) return;

    setLoading(true);

    try {
      const username = validateUserForRejection();
      if (!username) {
        setLoading(false);
        return;
      }

      const payload = {
        Id: itemId,
        Username: username,
        Role: "auto-detect",
        Keterangan: null
      };

      const url = `${API_LINK}CutiAkademik/reject`;
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
        handleRejectionError(res, errorText, payload);
        setLoading(false);
        return;
      }

      const responseText = await res.text();

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        
        if (res.status === 200) {
          Toast.success("Pengajuan berhasil ditolak!");
          loadData(1);
          if (showRiwayat) loadDataRiwayat(1);
          setLoading(false);
          return;
        }
        
        Toast.error("Response server tidak valid. Periksa console untuk detail.");
        setLoading(false);
        return;
      }

      handleRejectionSuccess(result);
    } catch (err) {
      Toast.error(`Gagal menolak pengajuan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (id) => {
    router.push(
      `/pages/administrasi-akademik/cuti-akademik/upload/${encryptIdUrl(
        id
      )}`
    );
  };


  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCutiId, setSelectedCutiId] = useState(null);
  const [selectedSKFile, setSelectedSKFile] = useState(null);
  const [skFilePreview, setSKFilePreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  
  const handleUploadSK = (id) => {
    setSelectedCutiId(id);
    setShowUploadModal(true);
    setSelectedSKFile(null);
    setSKFilePreview(null);
  };

  const handleSKFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
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

  const handleUploadCancel = () => {
    setShowUploadModal(false);
    setSelectedSKFile(null);
    setSKFilePreview(null);
    setSelectedCutiId(null);
  };

  const handleUploadConfirm = async () => {
    if (!selectedSKFile || !selectedCutiId) {
      Toast.error("Pilih file SK terlebih dahulu.");
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append('Id', selectedCutiId);
      formData.append('FileSK', selectedSKFile);
      formData.append('UploadBy', userData?.nama || userData?.username || 'user_admin');

      const response = await fetch(`${API_LINK}CutiAkademik/upload-sk`, {
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
      setSKFilePreview(null);
      setSelectedCutiId(null);
      
      await loadData(currentPage);
      if (showRiwayat) {
        await loadDataRiwayat(currentPageRiwayat);
      }

    } catch (error) {
      Toast.error(`Gagal upload SK: ${error.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handlePrint = (id) => {
    
    globalThis.open(`${API_LINK}CutiAkademik/file/${id}`, "_blank");
  };

  const determineDownloadRole = useCallback(() => {
    if (isAdmin) return "ROL21";
    if (isMahasiswa) return "ROL23";
    return null;
  }, [isAdmin, isMahasiswa]);

  const validateDownloadPrerequisites = useCallback((username, role) => {
    if (!role) {
      Toast.error("Role tidak dikenali untuk download SK.");
      return false;
    }
    if (!username) {
      Toast.error("Data user tidak lengkap. Silakan login ulang.");
      return false;
    }
    return true;
  }, []);

  const handleDownloadError = useCallback(async (response) => {
    let errorMessage = "Gagal download SK.";
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
    }
    
    if (response.status === 403) {
      Toast.warning(errorMessage);
    } else if (response.status === 404) {
      Toast.error("Data tidak ditemukan.");
    } else {
      Toast.error(errorMessage);
    }
  }, []);

  const handlePdfDownload = useCallback(async (response, id) => {
    const blob = await response.blob();
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SK_Cuti_Akademik_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    Toast.success("SK berhasil didownload!");
  }, []);

  const handleJsonResponse = useCallback(async (response) => {
    const result = await response.json();
    if (result.message) {
      Toast.info(result.message);
    } else {
      Toast.success("Operasi berhasil.");
    }
  }, []);

  const processSuccessfulResponse = useCallback(async (response, id) => {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/pdf')) {
      await handlePdfDownload(response, id);
    } else if (contentType && contentType.includes('application/json')) {
      await handleJsonResponse(response);
    } else {
      Toast.error("Format response tidak dikenali.");
    }
  }, [handlePdfDownload, handleJsonResponse]);

  const handleDownloadSK = async (id) => {
    try {
      const username = userData?.nama || userData?.username || "";
      const role = determineDownloadRole();

      if (!validateDownloadPrerequisites(username, role)) {
        return;
      }

      const params = new URLSearchParams({
        username: username,
        role: role
      });

      const downloadUrl = `${API_LINK}CutiAkademik/DownloadPdf/${encodeURIComponent(id)}?${params.toString()}`;
      
      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf, application/json'
        }
      });

      if (!response.ok) {
        await handleDownloadError(response);
        return;
      }

      await processSuccessfulResponse(response, id);

    } catch (error) {
      console.error("Error downloading SK:", error);
      Toast.error(`Gagal download SK: ${error.message}`);
    }
  };

  
  useEffect(() => {
    if (!ssoData) {
      Toast.error("Sesi habis. Silakan login kembali.");
      router.push("/auth/login");
      return;
    }

    if (!userData) return;

    if (isProdi) {
      if (prodiKonsentrasi !== null && !loadingProdiKonsentrasi) {
        loadData(1);       
        setShowRiwayat(true);
        setTimeout(() => loadDataRiwayat(1), 50);
      } else {
        // Waiting for prodiKonsentrasi to load before loading main data
      }
    } else {
      loadData(1);
      
      if (isWadir1 || isFinance || isAdmin) {
        setShowRiwayat(true);
        setTimeout(() => loadDataRiwayat(1), 50);
      }
    }
  }, [ssoData, userData, loadData, loadDataRiwayat, isProdi, isWadir1, isFinance, isAdmin, router, prodiKonsentrasi, loadingProdiKonsentrasi]);

  const getEmptyStateMessage = useCallback(() => {
    if (isMahasiswa) {
      return "Anda belum memiliki pengajuan cuti akademik. Klik tombol 'Ajukan Cuti Akademik' untuk membuat pengajuan baru.";
    }
    if (isProdi) {
      return "Tidak ada pengajuan cuti akademik. Anda dapat membuat pengajuan untuk mahasiswa dengan klik tombol 'Ajukan Cuti untuk Mahasiswa'.";
    }
    return "Tidak ada pengajuan cuti akademik yang perlu ditinjau saat ini.";
  }, [isMahasiswa, isProdi]);

  const shouldShowMahasiswaAddButton = useCallback(() => {
    return bebasTanggunganStatus === "OK";
  }, [bebasTanggunganStatus]);

  const getUploadButtonText = useCallback((uploadLoading) => {
    if (uploadLoading) {
      return (
        <>
          <span className="spinner-border spinner-border-sm me-2"></span>
          {" "}Mengupload...
        </>
      );
    }
    return 'Upload SK';
  }, []);

  const filterContentRiwayat = (
    <>
      <DropDown
        ref={sortRef}
        arrData={dataFilterSort}
        type="pilih"
        label="Urutkan"
        forInput="sortBy"
        defaultValue={sortBy}
      />
      <DropDown
        ref={prodiRef}
        arrData={dataFilterProdi}
        type="pilih"
        label="Prodi"
        forInput="filterProdi"
        defaultValue={filterProdi}
      />
    </>
  );

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Daftar Pengajuan Cuti Akademik"
      breadcrumb={[
        { label: "Sistem Informasi Akademik" },
        { label: "Administrasi Akademik" },
        { label: "Cuti Akademik" },
      ]}
    >




      
      <div className="mb-4">
        <h5>Daftar Pengajuan Cuti Akademik</h5>
        
        {/* Notifikasi Bebas Tanggungan untuk Mahasiswa */}
        {isMahasiswa && bebasTanggunganStatus === "NOK" && (
          <div className="mb-3">
            <div className="alert alert-warning mb-2" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Anda belum menyelesaikan administrasi bebas tanggungan</strong>
            </div>
            <button 
              type="button"
              className="btn btn-link p-0 text-primary text-decoration-underline" 
              style={{ cursor: 'pointer' }}
              onClick={() => router.push('/pages/administrasi-akademik/bebas-tanggungan')}
            >
              <i className="fas fa-eye me-1"></i>
              {" "}Lihat Administrasi Bebas Tanggungan
            </button>
          </div>
        )}
        
        <div className="d-flex justify-content-between align-items-center mb-3">
          {(isMahasiswa || isProdi) && (
            <>
              {isMahasiswa ? (
                shouldShowMahasiswaAddButton() && (
                  <Button
                    classType="primary"
                    label="+ Tambah"
                    onClick={handleAdd}
                  />
                )
              ) : (
                <Button
                  classType="primary"
                  label="+ Tambah"
                  onClick={handleAdd}
                />
              )}
            </>
          )}
          <div></div>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" aria-live="polite" aria-label="Loading">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Memuat data pengajuan...</p>
          </div>
        ) : (() => {
          const hasData = dataCutiAkademik.length > 0;
          
          if (hasData) {
            return (
              <>
                <Table
                  data={dataCutiAkademik}
                  onDetail={handleDetail}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAjukan={handleAjukan}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onUpload={handleUpload}
                  onUploadSK={handleUploadSK}
                  onPrint={handlePrint}
                  onDownloadSK={handleDownloadSK}
                />

                {totalData > 0 && (
                  <Paging
                    pageSize={pageSize}
                    pageCurrent={currentPage}
                    totalData={totalData}
                    navigation={handleNavigation}
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
                  {getEmptyStateMessage()}
                </p>
              </div>
            );
          }
        })()}
      </div>

      
      {showRiwayat && (
        <div className="mt-5">
          <h5>Daftar Riwayat Cuti Akademik</h5>
          
          <Formsearch
            onSearch={handleSearchRiwayat}
            onFilter={handleFilterApplyRiwayat}
            onExport={() => {
              const params = new URLSearchParams();
              if (searchRiwayat && searchRiwayat.trim() !== "") {
                params.append('search', searchRiwayat.trim());
              }
              if (!isAdmin && userData?.username) {
                const userIdentifier = isMahasiswa ? 
                  (userData?.mhsId || userData?.nama || userData?.username) : 
                  userData?.username;
                params.append('userId', userIdentifier);
              }
              
              const queryString = params.toString();
              const exportUrl = `${API_LINK}CutiAkademik/riwayat/excel${queryString ? '?' + queryString : ''}`;
              globalThis.open(exportUrl, "_blank");
            }}
            searchPlaceholder="Cari No. Pengajuan, NIM, Nama, atau Prodi"
            showAddButton={false}
            showFilterButton={true}
            showExportButton={true}
            exportButtonText="Unduh Excel"
            filterContent={filterContentRiwayat}
          />

          {loadingRiwayat ? (
            <div className="text-center py-4">
              <div className="spinner-border" aria-live="polite" aria-label="Loading">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Memuat data riwayat...</p>
            </div>
          ) : (() => {
            const hasRiwayatData = dataRiwayat.length > 0;
            
            if (hasRiwayatData) {
              return (
                <>
                  <Table
                    data={dataRiwayat}
                    onDetail={handleDetail}
                    onPrint={handlePrint}
                  />

                  {totalDataRiwayat > 0 && (
                    <Paging
                      pageSize={pageSize}
                      pageCurrent={currentPageRiwayat}
                      totalData={totalDataRiwayat}
                      navigation={handleNavigationRiwayat}
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
                  <p className="text-muted">Belum ada riwayat cuti akademik yang tersedia.</p>
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
                <h5 className="modal-title">Upload SK Cuti Akademik</h5>
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
                    text="File Surat Keterangan"
                    htmlFor="skFile"
                    required={true}
                  />
                  <input
                    type="file"
                    id="skFile"
                    className="form-control rounded-4 blue-element"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleSKFileSelect}
                    disabled={uploadLoading}
                  />
                  <small className="text-muted">
                    Format yang didukung: PDF, DOC, DOCX, JPG, JPEG, PNG (Maksimal 10MB)
                  </small>
                </div>

                {skFilePreview && (
                  <div className="mb-3">
                    <Label
                      text="Preview SK:"
                      htmlFor="skPreview"
                    />
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
                  {getUploadButtonText(uploadLoading)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainContent>
  );
}

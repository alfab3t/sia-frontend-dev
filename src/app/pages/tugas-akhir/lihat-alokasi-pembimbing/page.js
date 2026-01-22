"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import Table from "@/components/common/Table";
import Paging from "@/components/common/Paging";
import Formsearch from "@/components/common/Formsearch";
import DropDown from "@/components/common/Dropdown";
import Toast from "@/components/common/Toast";
import Loading from "@/components/common/Loading";
import { API_LINK } from "@/lib/constant";
import { getSSOData, getUserData, getPermissionData } from "@/context/user";
import fetchData from "@/lib/fetch";
import Input from "@/components/common/Input";

export default function LihatAlokasiPembimbingPage() {
   const router = useRouter();
   const ssoData = useMemo(() => getSSOData(), []);
   const userData = useMemo(() => getUserData(), []);
   const permissionData = useMemo(() => getPermissionData(), []);
   const userRole = userData?.roleId;
   const username = ssoData?.username;

   const [pageLoading, setPageLoading] = useState(true);
   const [loading, setLoading] = useState(false);
   const [dataAlokasiPembimbing, setDataAlokasiPembimbing] = useState([]);
   const [totalData, setTotalData] = useState(0);

   const [pageCurrent, setPageCurrent] = useState(1);
   const [pageSize] = useState(10);
   const [keyword, setKeyword] = useState("");
   const [filterTahun, setFilterTahun] = useState("");

   const sortRef = useRef();
   const prodiRef = useRef();
   const statusRef = useRef();
   const exportProdiRef = useRef();
   const [showExportModal, setShowExportModal] = useState(false);
   const [isClient, setIsClient] = useState(false);

   const dataFilterSort = [
      { Value: "industri asc", Text: "Nama Industri [↑]" },
      { Value: "industri desc", Text: "Nama Industri [↓]" },
      { Value: "kelompok asc", Text: "Nama Kelompok [↑]" },
      { Value: "kelompok desc", Text: "Nama Kelompok [↓]" },
   ];

   const [prodiList, setProdiList] = useState([
      { Value: "", Text: "- Semua -" },
   ]);

   const dataFilterStatus = useMemo(
      () => [
         { Value: "", Text: "- Semua -" },
         {
            Value: "AND dosenPembimbing is NOT NULL",
            Text: "Sudah Memiliki Pembimbing",
         },
         {
            Value: "AND dosenPembimbing is NULL",
            Text: "Belum Memiliki Pembimbing",
         },
      ],
      [],
   );

   const tableConfig = useMemo(
      () => ({
         widths: { Industri: "10%", "Nama Kelompok": "5%" },
         isWrap: {
            Industri: true,
            "Anggota Kelompok": true,
            "Judul Tugas Akhir (Proposal)": true,
         },
      }),
      [],
   );

   const stripHtmlTags = (htmlString) => {
      if (!htmlString || typeof htmlString !== "string") return htmlString;
      return htmlString.replaceAll(/<[^>]*>?/gm, "");
   };

   const mapRowToTable = useCallback(
      (item, idx, page) => {
         const checkValue = (v) => {
            const plainText = v ? stripHtmlTags(v) : "";

            if (
               !v ||
               v.toString().trim() === "" ||
               plainText.trim() === "" ||
               plainText.trim() === "-"
            ) {
               return <span>BELUM ADA</span>;
            }

            return v;
         };

         return {
            "No.": (page - 1) * pageSize + idx + 1,
            id: item.id,
            Prodi: checkValue(item.konsentrasi),
            Industri: checkValue(item.industri),
            "Nama Kelompok": checkValue(item.namaKelompok),
            "Anggota Kelompok": checkValue(item.anggotaKelompok),
            "Judul Tugas Akhir (Proposal)": checkValue(
               stripHtmlTags(item.judulProposalAktual || item.judulProposal),
            ),
            "Dosen Pembimbing": checkValue(item.namaDosenPembimbing),
            Alignment: [
               "center",
               "center",
               "left",
               "left",
               "left",
               "left",
               "left",
            ],
         };
      },
      [pageSize],
   );

   const loadData = useCallback(
      async (page, sort, cari, prodi, status, tahunAwal) => {
         if (!tahunAwal) return;

         try {
            setLoading(true);

            const tahunAkademikFormat = `${tahunAwal}/${
               Number.parseInt(tahunAwal) + 1
            }`;

            const [sortField, sortDir] = sort
               ? sort.split(" ")
               : ["tanggal", "DESC"];
            const urutValue = sortDir ? `${sortField} ${sortDir}` : sortField;

            const params = new URLSearchParams({
               PageNumber: page,
               PageSize: pageSize,
               SearchKeyword: cari || "",
               Urut: urutValue,
               TahunAkademik: tahunAkademikFormat,
               Konsentrasi: prodi || "",
               Status: status || "",
               Username: username || "",
               Role: userRole || "",
               SekretarisProdi: "",
            }).toString();

            const response = await fetchData(
               `${API_LINK}LihatAlokasiPembimbing/GetAllLihatAlokasiPembimbing?${params}`,
               {},
               "GET",
            );

            if (response.error) throw new Error(response.message);

            const { data = [], totalData = 0 } = response;
            setDataAlokasiPembimbing(
               data.map((it, i) => mapRowToTable(it, i, page)),
            );
            setTotalData(totalData);
            setPageCurrent(page);
         } catch  {
            Toast.error( "Gagal mengambil data");
         } finally {
            setLoading(false);
         }
      },
      [pageSize, mapRowToTable],
   );

   useEffect(() => {
      setIsClient(true);

      if (!ssoData) {
         Toast.error("Sesi anda habis. Silakan login kembali.");
         router.push("./auth/login");
         return;
      }

      const initialize = async () => {
         try {
            let prodiApiEndpoint = "";

            if (userRole === "ROL22") {
               const params = new URLSearchParams({
                  Username: username,
                  Role: userRole,
               }).toString();
               prodiApiEndpoint = `${API_LINK}LihatAlokasiPembimbing/GetListKonsentrasiByNPK?${params}`;
            } else if (userRole === "ROL25") {
               const params = new URLSearchParams({
                  Username: username,
               }).toString();
               prodiApiEndpoint = `${API_LINK}LihatAlokasiPembimbing/GetListKonsentrasiByDosen?${params}`;
            } else {
               prodiApiEndpoint = `${API_LINK}LihatAlokasiPembimbing/GetListKonsentrasi`;
            }

            const [resProdi, resTA] = await Promise.all([
               fetchData(prodiApiEndpoint, {}, "GET"),
               fetchData(
                  `${API_LINK}LihatAlokasiPembimbing/GetTahunAkademikAktif`,
                  {},
                  "GET",
               ),
            ]);

            const rawProdiList = resProdi.data || resProdi.Data || resProdi;

            let defaultProdi = "";

            if (Array.isArray(rawProdiList)) {
               if (rawProdiList.length === 1) {
                  defaultProdi = (
                     rawProdiList[0].konsentrasiId ||
                     rawProdiList[0].KonsentrasiId
                  ).toString();

                  setProdiList(
                     rawProdiList.map((item) => ({
                        Value: (
                           item.konsentrasiId || item.KonsentrasiId
                        ).toString(),
                        Text: item.namaKonsentrasi || item.NamaKonsentrasi,
                     })),
                  );
               } else {
                  setProdiList([
                     { Value: "", Text: "- Semua -" },
                     ...rawProdiList.map((item) => ({
                        Value: (
                           item.konsentrasiId || item.KonsentrasiId
                        ).toString(),
                        Text: item.namaKonsentrasi || item.NamaKonsentrasi,
                     })),
                  ]);
               }
            }

            if (resTA?.tahunAjaran) {
               const tahunAwal = resTA.tahunAjaran.split("/")[0];
               setFilterTahun(tahunAwal);
               loadData(
                  1,
                  dataFilterSort[0].Value,
                  "",
                  defaultProdi,
                  "",
                  tahunAwal,
               );
            }
         } catch{
            Toast.error("Gagal memuat data awal.");
         } finally {
            setPageLoading(false);
         }
      };

      initialize();
   }, [ssoData, router, loadData, userRole]);

   const handleSearch = (q) => {
      setKeyword(q);
      loadData(
         1,
         sortRef.current.value,
         q,
         prodiRef.current.value,
         statusRef.current.value,
         filterTahun,
      );
   };

   const handleFilterApply = () => {
      loadData(
         1,
         sortRef.current.value,
         keyword,
         prodiRef.current.value,
         statusRef.current.value,
         filterTahun,
      );
   };

   const handleNavigation = (page) => {
      loadData(
         page,
         sortRef.current.value,
         keyword,
         prodiRef.current.value,
         statusRef.current.value,
         filterTahun,
      );
   };

   const handleExport = async () => {
      const prodiId = exportProdiRef.current?.value;
      if (!prodiId) {
         Toast.error("Pilih Program Studi.");
         return;
      }
      const url = `${API_LINK}LihatAlokasiPembimbing/ExportTA?TahunAkademik=${filterTahun}/${
         Number.parseInt(filterTahun) + 1
      }&KonsentrasiId=${prodiId}`;
      window.open(url, "_blank");
      setShowExportModal(false);
   };

   const filterContent = useMemo(
      () => (
         <>
            <DropDown
               ref={sortRef}
               arrData={dataFilterSort}
               type="pilih"
               label="Urutkan Berdasarkan"
               forInput="sortBy"
            />
            <div className="mb-3">
               <label
                  htmlFor="inputTahunAkademik"
                  className="form-label fw-bold small text-primary mb-1"
               >
                  Tahun Akademik
               </label>
               <div className="d-flex align-items-center">
                  <div style={{ flex: 1 }}>
                     <Input
                        id="inputTahunAkademik"
                        type="number"
                        value={filterTahun}
                        min="0"
                        max="9999"
                        onChange={(e) => {
                           const val = e.target.value;
                           if (
                              val === "" ||
                              (Number(val) >= 0 && val.length <= 4)
                           ) {
                              setFilterTahun(val);
                           }
                        }}
                     />
                  </div>
                  <span className="ms-2 fw-medium text-muted">
                     /{Number.parseInt(filterTahun || 0) + 1}
                  </span>
               </div>
            </div>
            <DropDown
               ref={prodiRef}
               arrData={prodiList}
               type="pilih"
               label="Program Studi"
               forInput="prodi"
            />
            <DropDown
               ref={statusRef}
               arrData={dataFilterStatus}
               type="pilih"
               label="Status"
               forInput="status"
               onChange={(e) => setSelectedStatus(e.target.value)}
            />
         </>
      ),
      [filterTahun, prodiList, dataFilterStatus, dataFilterSort],
   );

   return (
      <MainContent
         layout="Admin"
         loading={pageLoading}
         title="Lihat Alokasi Pembimbing"
         breadcrumb={[
            { label: "Tugas Akhir", href: "/sample" },
            { label: "Lihat Alokasi Pembimbing" },
         ]}
      >
         <Loading loading={loading} message="Memuat data..." />
         <Formsearch
            onSearch={handleSearch}
            onFilter={handleFilterApply}
            onExport={() => {
               if (
                  permissionData?.includes("lihat_alokasi_pembimbing.export")
               ) {
                  setShowExportModal(true);
               }
            }}
            
            showAddButton={false}
            showExportButton={
               isClient &&
               permissionData?.includes("lihat_alokasi_pembimbing.export")
            }
            filterContent={filterContent}
         />

         {showExportModal && (
            <div
               className="modal show d-block"
               style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
               <div className="modal-dialog modal-sm">
                  <div className="modal-content">
                     <div className="modal-header">
                        <h5 className="modal-title">Export ke Excel</h5>
                        <button
                           type="button"
                           className="btn-close"
                           onClick={() => setShowExportModal(false)}
                        ></button>
                     </div>
                     <div className="modal-body">
                        <DropDown
                           ref={exportProdiRef}
                           arrData={prodiList.filter((p) => p.Value !== "")}
                           type="pilih"
                           label="Program Studi"
                           forInput="exportProdi"
                           isRequired={true}
                        />
                     </div>
                     <div className="modal-footer">
                        <button
                           className="btn btn-secondary"
                           onClick={() => setShowExportModal(false)}
                        >
                           Batal
                        </button>
                        <button
                           className="btn btn-primary"
                           onClick={handleExport}
                        >
                           Export
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         <div className="row mt-3">
            <div className="col-12">
               <Table data={dataAlokasiPembimbing} config={tableConfig} />
               {totalData > 0 && (
                  <Paging
                     pageSize={pageSize}
                     pageCurrent={pageCurrent}
                     totalData={totalData}
                     navigation={handleNavigation}
                  />
               )}
            </div>
         </div>
      </MainContent>
   );
}

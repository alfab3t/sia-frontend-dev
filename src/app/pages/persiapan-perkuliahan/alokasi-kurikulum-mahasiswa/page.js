"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import fetchData from "@/lib/fetch";
import MainContent from "@/components/layout/MainContent";
import Table from "@/components/common/Table";
import Paging from "@/components/common/Paging";
import Formsearch from "@/components/common/Formsearch";
import DropDown from "@/components/common/Dropdown";
import Button from "@/components/common/Button";
import Toast from "@/components/common/Toast";
import SweetAlert from "@/components/common/SweetAlert";
import { API_LINK } from "@/lib/constant";
import toast from "react-hot-toast";

export default function AlokasiKurikulumPage() {
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const sortRef = useRef();
  const prodiRef = useRef();
  const angkatanRef = useRef();

  const [optProdi, setOptProdi] = useState([]);
  const [optAngkatan, setOptAngkatan] = useState([]);
  const [optKurikulum, setOptKurikulum] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    sort: "[NIM] asc",
    prodi: "",
    angkatan: "",
  });

  const [listData, setListData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetKurikulum, setTargetKurikulum] = useState("");

  useEffect(() => {
    const initMasterData = async () => {
      try {
        const [resProdi, resAngkatan] = await Promise.all([
          fetchData(API_LINK + "AlokasiKurikulum/GetProdiList", {}, "GET"),
          fetchData(API_LINK + "AlokasiKurikulum/GetAngkatanList", {}, "GET"),
        ]);

        setOptProdi(
          resProdi.map((d) => ({
            Value: d.idProgramStudi,
            Text: d.programStudi,
          })),
        );
        setOptAngkatan(
          resAngkatan.map((d) => ({ Value: d.angkatan, Text: d.angkatan })),
        );

        loadTableData();
      } catch {
        Toast.error("Gagal memuat data master");
      } finally {
        setLoading(false);
      }
    };

    initMasterData();
  }, []);

  useEffect(() => {
    const loadKurikulum = async () => {
      setTargetKurikulum("");
      try {
        const params = { konid: filters.prodi || "" };

        const response = await fetchData(
          API_LINK + "AlokasiKurikulum/GetKurikulumList",
          params,
          "GET",
        );
        setOptKurikulum(
          response.map((d) => ({ Value: d.idKurikulum, Text: d.kurikulum })),
        );
      } catch {
        Toast.error("Gagal memuat data kurikulum");
      }
    };
    loadKurikulum();
  }, [filters.prodi]);

  const loadTableData = async (customPage = 1, overrideFilters = null) => {
    setTableLoading(true);
    try {
      const activeFilters = overrideFilters || filters;

      const params = {
        PageNumber: customPage,
        PageSize: pagination.size,
      };

      if (activeFilters.search) params.SearchKeyword = activeFilters.search;
      if (activeFilters.sort) params.Urut = activeFilters.sort;
      if (activeFilters.prodi) params.ProgramStudiId = activeFilters.prodi;
      if (activeFilters.angkatan) params.Angkatan = activeFilters.angkatan;

      const response = await fetchData(
        API_LINK + "AlokasiKurikulum/GetListAlokasiKurikulumMahasiswa",
        params,
        "GET",
      );
      if (response && !response.error) {
        const dataList = response.Data || response.data || [];
        const totalData = response.TotalData || response.totalData || 0;
        setListData(dataList);
        setPagination((prev) => ({
          ...prev,
          page: customPage,
          total: totalData,
        }));
        setSelectedIds([]);
      } else {
        Toast.error(response.message || "Gagal mengambil data mahasiswa.");
      }
    } catch {
      Toast.error("Gagal mengambil data mahasiswa.");
    } finally {
      setTableLoading(false);
    }
  };

  const handleSearch = useCallback(
    (query) => {
      const cleanQuery = query.trim();
      const newFilters = { ...filters, search: cleanQuery };
      setFilters(newFilters);
      loadTableData(1, newFilters);
    },
    [filters],
  );

  const handleFilterApply = useCallback(() => {
    const newSort = sortRef.current.value;
    const newProdi = prodiRef.current.value;
    const newAngkatan = angkatanRef.current.value;

    const newFilters = {
      ...filters,
      sort: newSort,
      prodi: newProdi,
      angkatan: newAngkatan,
    };

    setFilters(newFilters);
    loadTableData(1, newFilters);
  }, [filters]);

  const filterContent = useMemo(
    () => (
      <>
        <DropDown
          ref={sortRef}
          label="Urut Berdasarkan"
          forInput="ddUrut"
          type="pilih"
          defaultValue={filters.sort}
          arrData={[
            { Value: "[NIM] asc", Text: "NIM [↑]" },
            { Value: "[NIM] desc", Text: "NIM [↓]" },
            { Value: "[Nama Mahasiswa] asc", Text: "Nama [↑]" },
            { Value: "[Nama Mahasiswa] desc", Text: "Nama [↓]" },
          ]}
        />

        <DropDown
          ref={prodiRef}
          label="Program Studi"
          forInput="ddKonsentrasi"
          type="semua"
          defaultValue={filters.prodi}
          arrData={[...optProdi]}
        />

        <DropDown
          ref={angkatanRef}
          label="Angkatan"
          forInput="ddAngkatan"
          type="semua"
          defaultValue={filters.angkatan}
          arrData={[...optAngkatan]}
        />
      </>
    ),
    [filters.sort, filters.prodi, filters.angkatan, optProdi, optAngkatan],
  );

  const handleSelectionChange = useCallback((ids) => {
    setSelectedIds(ids);
  }, []);

  const handleConfirmUpdate = () => {
    if (!targetKurikulum) {
      toast.error("Pilih kurikulum terlebih dahulu");
      return;
    }

    if (selectedIds.length === 0) {
      Toast.error("Pilih mahasiswa terlebih dahulu");
      return;
    }

    SweetAlert({
      title: "Konfirmasi Perubahan",
      text: `Apakah Anda yakin ingin mengubah alokasi kurikulum untuk ${selectedIds.length} mahasiswa terpilih?`,
      icon: "warning",
      showCancelButton: true,
      confirmText: "Konfirmasi",
      cancelText: "Batal",
    }).then(async (result) => {
      if (result) {
        setLoading(true);
        try {
          const payload = {
            listMahasiswaId: selectedIds,
            kurikulumId: targetKurikulum,
          };
          const response = await fetchData(
            API_LINK + "AlokasiKurikulum/UpdateAlokasiKurikulum",
            payload,
            "POST",
          );
          if (response === false || response?.error) {
            throw new Error(response?.message || "Gagal update data");
          }
          Toast.success("Perubahan kurikulum berhasil disimpan");
          setTargetKurikulum("");
          loadTableData(pagination.page);
        } catch {
          Toast.error("Terjadi kesalahan saat menyimpan data");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const tableContent = useMemo(() => {
    return listData.map((item, index) => ({
      id: item.id,
      Key: item.id,
      No: (pagination.page - 1) * pagination.size + index + 1,
      NIM: item.id,
      Nama: item.nama,
      Prodi: item.programStudi,
      Angkatan: item.angkatan,
      Kurikulum: item.kurikulum || "-",
      Status: item.status,
      Alignment: [
        "center",
        "center",
        "center",
        "left",
        "center",
        "center",
        "center",
        "center",
      ],
    }));
  }, [listData, pagination.page, pagination.size]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Persiapan Perkuliahan - Alokasi Kurikulum Mahasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengajaran" },
        { label: "Alokasi Kurikulum" },
      ]}
    >
      <div className="col-12">
        <Formsearch
          showAddButton={false}
          showExportButton={false}
          onSearch={handleSearch}
          onFilter={handleFilterApply}
          filterContent={filterContent}
        />
      </div>

      <div className="row mb-2">
        <div className="col-12">
          <div className="d-flex align-items-end flex-wrap gap-3">
            <div style={{ flexGrow: 1, minWidth: "300px" }}>
              <DropDown
                label="Kurikulum"
                forInput="ddKurikulumTarget"
                value={targetKurikulum}
                onChange={(e) => {
                  const val = e?.target ? e.target.value : e;
                  setTargetKurikulum(val);
                }}
                arrData={[...optKurikulum]}
              />
            </div>
            <div className="mb-3">
              <Button
                label="Simpan"
                iconName="save"
                classType="primary"
                onClick={handleConfirmUpdate}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="row mb-2">
        <div className="col-12">
          <div className="d-flex justify-content-end mb-2 px-2">
            <span className="text-muted small">
              Total Terpilih: <b>{selectedIds.length}</b>
            </span>
          </div>

          {tableLoading ? (
            <div className="text-center p-5">Memuat data...</div>
          ) : (
            <Table
              data={tableContent}
              enableCheckbox={true}
              onSelectionChange={handleSelectionChange}
            />
          )}

          {pagination.total > 0 && (
            <Paging
              pageSize={pagination.size}
              pageCurrent={pagination.page}
              totalData={pagination.total}
              navigation={(page) => loadTableData(page)}
            />
          )}
        </div>
      </div>
    </MainContent>
  );
}

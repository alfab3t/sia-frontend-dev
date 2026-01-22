"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Calendar from "@/components/common/Calendar";
import Dropdown from "@/components/common/Dropdown";
import Table from "@/components/common/Table";
import Toast from "@/components/common/Toast";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { getSSOData } from "@/context/user";

const maxLengthRules = {
  keterangan: 255,
};

const MemoizedTable = memo(Table);

export default function AddBuatTagihan() {
  const router = useRouter();
  const ssoData = useMemo(() => getSSOData(), []);

  const [loading, setLoading] = useState(true);
  const [dataProdi, setDataProdi] = useState([]);
  const [dataAngkatan, setDataAngkatan] = useState([]);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [showNominal, setShowNominal] = useState(false);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState([]);
  const [broadcastType, setBroadcastType] = useState("all");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [nominalRaw, setNominalRaw] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const [filterMahasiswa, setFilterMahasiswa] = useState({
    angkatan: "",
    prodi: "",
    status: "Aktif",
  });

  const [formData, setFormData] = useState({
    jenisTagihan: "",
    jatuhTempo: "",
    angkatan: "",
    prodi: "",
    status: "Aktif",
  });

  const canLoadMahasiswa = useMemo(() => {
    return filterMahasiswa.angkatan !== "" || filterMahasiswa.prodi !== "";
  }, [filterMahasiswa.angkatan, filterMahasiswa.prodi]);

  const [errors, setErrors] = useState({});

  const fetchProdi = useCallback(async () => {
    try {
      const response = await fetchData(
        API_LINK + "BuatTagihan/GetTagihanListProdi",
        {},
        "GET",
      );

      if (response.error) throw new Error(response.message);

      const prodiOptions = response.data.map((item) => ({
        Value: item.value,
        Text: item.text,
      }));

      setDataProdi(prodiOptions);
    } catch (err) {
      Toast.error(err.message);
    }
  }, []);

  const fetchAngkatan = useCallback(async () => {
    try {
      const response = await fetchData(
        API_LINK + "BuatTagihan/GetListAngkatan",
        {},
        "GET",
      );

      if (response.error) throw new Error(response.message);

      const angkatanOptions = response.data.map((item) => ({
        Value: item,
        Text: item,
      }));

      setDataAngkatan(angkatanOptions);
    } catch (err) {
      Toast.error(err.message);
    }
  }, []);

  const dataJenisTagihan = useMemo(
    () => [
      { Value: "SPP", Text: "Biaya SPP" },
      { Value: "Cuti", Text: "Biaya Cuti" },
      { Value: "ID Card", Text: "Biaya ID Card" },
      { Value: "Lainnya", Text: "Biaya Lain-Lain" },
      { Value: "Titipan", Text: "Pengembalian Dana Titipan" },
    ],
    [],
  );

  const statusMahasiswa = useMemo(
    () => [
      { Value: "Aktif", Text: "Aktif" },
      { Value: "Cuti", Text: "Cuti" },
    ],
    [],
  );

  const formatRupiah = useCallback((number) => {
    if (number === null || number === undefined) return "0";

    const num = Number(number);
    const isNegative = num < 0;

    const formatted = new Intl.numberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(Math.abs(num));

    return isNegative ? `(${formatted})` : formatted;
  }, []);

  const displayNominal = useMemo(() => {
    if (!nominalRaw) return "";
    return new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(Number(nominalRaw));
  }, [nominalRaw]);

  const getNominalValue = useCallback(() => {
    if (
      formData.jenisTagihan === "Lainnya" ||
      formData.jenisTagihan === "Titipan"
    ) {
      const value = Number(nominalRaw);
      return value || 0;
    }
    return 0;
  }, [formData.jenisTagihan, nominalRaw]);

  const loadMahasiswa = useCallback(async () => {
    try {
      const queryParams = {
        ProgramStudi: filterMahasiswa.prodi || "Semua",
        Angkatan: filterMahasiswa.angkatan || "",
        Status: filterMahasiswa.status || "",
      };

      const params = new URLSearchParams(queryParams);
      const response = await fetchData(
        API_LINK + "BuatTagihan/GetDetailTagihan",
        params,
        "GET",
      );

      if (response.error) throw new Error(response.message);

      const dataFromBackend = response.data || [];

      const data = dataFromBackend.map((item, index) => ({
        id: item.nim,
        Key: item.nim,
        Count: dataFromBackend.length,
        No: index + 1,
        NIM: item.nim || "-",
        Nama: item.nama || "-",
        Prodi: item.prodi || "-",
        Angkatan: item.angkatan || "-",
        "Sisa Tagihan (Rp)": formatRupiah(item.jumlah) || "-",
      }));

      setMahasiswaList(data);
      setSelectedMahasiswa([]);
    } catch (err) {
      Toast.error("Gagal memuat data mahasiswa: " + err.message);
      setMahasiswaList([]);
    }
  }, [
    filterMahasiswa.angkatan,
    filterMahasiswa.prodi,
    filterMahasiswa.status,
    formatRupiah,
  ]);

  useEffect(() => {
    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("./auth/login");
      return;
    }

    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchProdi(), fetchAngkatan()]);

        if (canLoadMahasiswa) {
          await loadMahasiswa();
        } else {
          setMahasiswaList([]);
          setSelectedMahasiswa([]);
        }
      } catch (err) {
        Toast.error("Gagal mengambil data : " + err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [
    ssoData,
    router,
    canLoadMahasiswa,
    fetchProdi,
    fetchAngkatan,
    loadMahasiswa,
  ]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      if (name === "keterangan") {
        setKeterangan(value);
        if (errors[name]) {
          setErrors((prev) => ({ ...prev, [name]: "" }));
        }
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }

      if (name === "jenisTagihan") {
        setShowNominal(value === "Lainnya" || value === "Titipan");
        if (value !== "Lainnya" && value !== "Titipan") {
          setNominalRaw("");
        }

        const notAllowedBroadcastAll = [
          "Cuti",
          "ID Card",
          "Lainnya",
          "Titipan",
        ];
        if (notAllowedBroadcastAll.includes(value)) {
          setBroadcastType("selected");
        }
      }
    },
    [errors],
  );

  const handleNominalChange = useCallback(
    (e) => {
      const raw = e.target.value.replaceAll(/\D/g, "");
      setNominalRaw(raw);

      if (errors.nominal) {
        setErrors((prev) => ({ ...prev, nominal: "" }));
      }
    },
    [errors.nominal],
  );

  const handleSelectionChange = useCallback((selectedIds) => {
    setSelectedMahasiswa(selectedIds);
  }, []);

  const alignment = useMemo(() => {
    return broadcastType === "selected"
      ? ["center", "center", "center", "left", "center", "center", "right"]
      : ["center", "center", "left", "center", "center", "right"];
  }, [broadcastType]);

  const mahasiswaListWithAlignment = useMemo(() => {
    if (mahasiswaList.length === 0) return [];

    const firstItem = mahasiswaList[0];
    if (
      firstItem?.Alignment &&
      JSON.stringify(firstItem.Alignment) === JSON.stringify(alignment)
    ) {
      return mahasiswaList;
    }

    return mahasiswaList.map((item) => ({
      ...item,
      Alignment: alignment,
    }));
  }, [mahasiswaList, alignment]);

  const validateBasicFields = useCallback(
    (newErrors) => {
      if (!formData.jenisTagihan)
        newErrors.jenisTagihan = "Jenis tagihan wajib dipilih";

      if (!formData.jatuhTempo)
        newErrors.jatuhTempo = "Jatuh tempo wajib diisi";

      if (!keterangan.trim()) {
        newErrors.keterangan = "Keterangan wajib diisi";
      }

      if (!formData.angkatan) newErrors.angkatan = "Angkatan wajib dipilih";

      if (!keterangan.trim()) {
        newErrors.keterangan = "Keterangan wajib diisi";
      }
    },
    [formData, keterangan],
  );

  const validateNominalField = useCallback(
    (errors) => {
      if (
        formData.jenisTagihan === "Lainnya" ||
        formData.jenisTagihan === "Titipan"
      ) {
        const nominalValue = getNominalValue();

        if (
          !nominalRaw ||
          nominalRaw.trim() === "" ||
          nominalValue <= 0 ||
          Number.isNaN(nominalValue)
        ) {
          errors.nominal =
            formData.jenisTagihan === "Lainnya"
              ? "Nominal wajib diisi untuk biaya lainnya"
              : "Nominal wajib diisi untuk pengembalian dana titipan";
        }
      }
    },
    [formData.jenisTagihan, getNominalValue, nominalRaw],
  );

  const validateKeterangan = useCallback(
    (errors) => {
      if (formData.jenisTagihan === "Lainnya" && !keterangan.trim()) {
        errors.keterangan = "Keterangan wajib diisi untuk biaya lainnya";
      }
    },
    [formData.jenisTagihan, keterangan],
  );

  const validateMahasiswaSelection = useCallback(() => {
    if (mahasiswaList.length === 0) {
      Toast.error("Tidak ada mahasiswa untuk dibuatkan tagihan.");
      return false;
    }

    if (broadcastType === "selected" && selectedMahasiswa.length === 0) {
      Toast.error("Pilih minimal 1 mahasiswa untuk broadcast terpilih.");
      return false;
    }

    const notAllowedBroadcastAll = ["Cuti", "ID Card", "Lainnya", "Titipan"];
    if (
      broadcastType === "all" &&
      notAllowedBroadcastAll.includes(formData.jenisTagihan)
    ) {
      Toast.error(
        `${formData.jenisTagihan} tidak boleh untuk semua mahasiswa.`,
      );
      return false;
    }

    return true;
  }, [
    mahasiswaList.length,
    broadcastType,
    selectedMahasiswa.length,
    formData.jenisTagihan,
  ]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    validateBasicFields(newErrors);
    validateNominalField(newErrors);
    validateKeterangan(newErrors);

    setErrors(newErrors);

    if (!validateMahasiswaSelection()) {
      return false;
    }

    return Object.keys(newErrors).length === 0;
  }, [
    validateBasicFields,
    validateNominalField,
    validateKeterangan,
    validateMahasiswaSelection,
  ]);

  const reset = useCallback(() => {
    setFormData({
      jenisTagihan: "",
      jatuhTempo: "",
      angkatan: "",
      prodi: "",
      status: "Aktif",
    });
    setKeterangan("");
    setNominalRaw("");
    setMahasiswaList([]);
    setShowNominal(false);
    setSelectedMahasiswa([]);
    setBroadcastType("all");
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (!validateForm()) {
        Toast.error("Mohon lengkapi semua field yang wajib diisi.");
        return;
      }

      setShowConfirmModal(true);
    },
    [validateForm],
  );

  const handleConfirmSubmit = useCallback(async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const selectedNIM =
        broadcastType === "selected" && selectedMahasiswa.length > 0
          ? selectedMahasiswa
          : mahasiswaList.map((m) => m.NIM).filter((nim) => nim && nim !== "-");

      if (selectedNIM.length === 0) {
        throw new Error("Tidak ada mahasiswa yang dipilih");
      }

      let nominalValue = 0;

      if (
        formData.jenisTagihan === "Lainnya" ||
        formData.jenisTagihan === "Titipan"
      ) {
        nominalValue = getNominalValue();

        if (Number.isNaN(nominalValue) || nominalValue <= 0) {
          throw new Error(`Nominal tidak valid: ${nominalRaw}`);
        }
      }

      const payload = {
        jenisTagihan: formData.jenisTagihan,
        jatuhTempo: formData.jatuhTempo || null,
        keterangan: keterangan || "",
        angkatan: formData.angkatan || "",
        programStudi: formData.prodi || "",
        statusMahasiswa: formData.status || "Aktif",
        Nominal: nominalValue,
        nimList: selectedNIM,
        broadcastType: broadcastType,
        totalMahasiswa: selectedNIM.length,
        totalNominal: nominalValue * selectedNIM.length,
      };

      const data = await fetchData(
        API_LINK + "BuatTagihan/CreateTagihan",
        payload,
        "POST",
      );

      if (data && !data.error) {
        Toast.success(
          `Tagihan berhasil dibuat untuk ${selectedNIM.length} mahasiswa.`,
        );
        reset();
        router.push("/pages/keuangan-akademik/buat_tagihan");
      } else {
        throw new Error(data?.message || "Terjadi kesalahan dari server");
      }
    } catch (err) {
      Toast.error("Data gagal disimpan! " + err.message);
    } finally {
      setLoading(false);
    }
  }, [
    broadcastType,
    selectedMahasiswa,
    mahasiswaList,
    formData.jenisTagihan,
    formData.jatuhTempo,
    keterangan,
    formData.angkatan,
    formData.prodi,
    formData.status,
    getNominalValue,
    nominalRaw,
    reset,
    router,
  ]);

  const handleCancel = useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Tambah Tagihan Baru"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Keuangan Akademik" },
        {
          label: "Buat Tagihan",
          href: "/pages/keuangan-akademik/buat_tagihan",
        },
        { label: "Tambah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <h5 className="text-primary mb-3 pb-2 border-bottom">
            Informasi Tagihan
          </h5>

          <div className="row g-3">
            <div className="col-lg-4">
              <Dropdown
                arrData={dataJenisTagihan}
                type="pilih"
                label="Jenis Tagihan"
                isRequired={true}
                forInput="jenisTagihan"
                value={formData.jenisTagihan}
                onChange={(e) =>
                  handleChange({
                    target: { name: "jenisTagihan", value: e.target.value },
                  })
                }
                errorMessage={errors.jenisTagihan}
              />
            </div>

            <div className="col-lg-4">
              <Calendar
                label={
                  <>
                    Jatuh Tempo <span className="text-danger">*</span>
                  </>
                }
                type="single"
                minDate={new Date()}
                value={
                  formData.jatuhTempo
                    ? new Date(formData.jatuhTempo + "T00:00:00")
                    : null
                }
                onChange={(date) => {
                  if (!date) {
                    handleChange({
                      target: { name: "jatuhTempo", value: "" },
                    });
                    return;
                  }

                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");

                  handleChange({
                    target: {
                      name: "jatuhTempo",
                      value: `${year}-${month}-${day}`,
                    },
                  });
                }}
                error={errors.jatuhTempo}
              />
            </div>

            <div className="col-lg-4">
              <Input
                label={
                  <>
                    Keterangan <span className="text-danger">*</span>
                  </>
                }
                name="keterangan"
                id="keterangan"
                isRequired={true}
                value={keterangan}
                onChange={handleChange}
                error={errors.keterangan}
                maxLength={maxLengthRules.keterangan}
              />
            </div>
          </div>

          <h5 className="text-primary mt-4 mb-3 pb-2 border-bottom">
            Filter Mahasiswa
          </h5>

          <div className="row g-3">
            <div className="col-lg-4">
              <Dropdown
                arrData={dataAngkatan}
                type="pilih"
                label="Angkatan"
                isRequired={true}
                forInput="angkatan"
                value={formData.angkatan}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange({ target: { name: "angkatan", value } });
                  setFilterMahasiswa((prev) => ({
                    ...prev,
                    angkatan: value,
                  }));
                }}
                errorMessage={errors.angkatan}
              />
            </div>

            <div className="col-lg-4">
              <Dropdown
                arrData={dataProdi}
                type="semua"
                label="Program Studi"
                forInput="prodi"
                value={formData.prodi}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange({ target: { name: "prodi", value } });
                  setFilterMahasiswa((prev) => ({ ...prev, prodi: value }));
                }}
                errorMessage={errors.prodi}
              />
            </div>

            {showNominal && (
              <div className="col-lg-4">
                <Input
                  label={
                    <>
                      Nominal Tagihan (Rp){" "}
                      <span className="text-danger">*</span>
                    </>
                  }
                  type="text"
                  name="nominal"
                  id="nominal"
                  isRequired={true}
                  value={displayNominal}
                  onChange={handleNominalChange}
                  error={errors.nominal}
                  placeholder="Masukkan nominal"
                />
              </div>
            )}
          </div>

          <h5 className="text-primary mt-4 mb-3 pb-2 border-bottom">
            Daftar Mahasiswa
          </h5>

          <div className="row">
            <div className="col-lg-8 mt-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="broadcastType"
                  value="all"
                  id="broadcastAll"
                  checked={broadcastType === "all"}
                  disabled={["Cuti", "ID Card", "Lainnya", "Titipan"].includes(
                    formData.jenisTagihan,
                  )}
                  onChange={(e) => {
                    setBroadcastType(e.target.value);
                    setSelectedMahasiswa([]);
                  }}
                />
                <label className="form-check-label" htmlFor="broadcastAll">
                  Semua mahasiswa berdasarkan angkatan, status, dan program
                  studi
                </label>
              </div>

              <div className="form-check mt-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="broadcastType"
                  value="selected"
                  id="broadcastSelected"
                  checked={broadcastType === "selected"}
                  onChange={(e) => setBroadcastType(e.target.value)}
                />
                <label className="form-check-label" htmlFor="broadcastSelected">
                  Mahasiswa terpilih pada tabel berikut
                </label>
              </div>
            </div>

            <div className="col-lg-4">
              <Dropdown
                arrData={statusMahasiswa}
                type="pilih"
                label="Status Mahasiswa"
                forInput="statusMahasiswa"
                value={formData.status}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange({ target: { name: "status", value } });
                  setFilterMahasiswa((prev) => ({ ...prev, status: value }));
                }}
              />
            </div>
          </div>

          {!canLoadMahasiswa && (
            <div className="alert alert-info mt-3">
              Silakan pilih <b>Angkatan</b> untuk menampilkan daftar mahasiswa.
            </div>
          )}

          <MemoizedTable
            data={mahasiswaListWithAlignment}
            enableCheckbox={broadcastType === "selected"}
            onSelectionChange={handleSelectionChange}
          />

          {mahasiswaList.length > 0 && (
            <small className="text-muted d-block mt-2">
              {mahasiswaList.length} mahasiswa ditemukan{" "}
              {broadcastType === "selected" && selectedMahasiswa.length > 0 && (
                <span className="text-primary fw-bold">
                  • {selectedMahasiswa.length} mahasiswa dipilih
                </span>
              )}
            </small>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button classType="secondary" label="Batal" onClick={handleCancel} />
        <Button
          classType="primary"
          iconName={loading ? "" : "save"}
          label={loading ? "Menyimpan..." : "Simpan"}
          onClick={handleSubmit}
        />
      </div>

      {showConfirmModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Kirim Tagihan ke Mahasiswa</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-danger fw-bold">PERHATIAN!</p>
                <p className="fw-bold">
                  Data tagihan akan di broadcast kepada mahasiswa terpilih dan
                  tidak dapat diubah atau dibatalkan setelah menekan tombol
                  Konfirmasi.
                </p>
                <p className="text-danger fw-bold">
                  Khusus biaya SPP, pengumuman juga akan di broadcast melalui
                  email (proses ini membutuhkan waktu untuk mengirimkan email
                  kepada setiap mahasiswa terpilih).
                </p>
                <p>
                  Apakah Anda yakin ingin mengirimkan tagihan kepada mahasiswa
                  terpilih?
                </p>
                <p>
                  * Besarnya tagihan dapat diatur dalam halaman Master Tagihan
                  Pembayaran.
                </p>
              </div>
              <div className="modal-footer">
                <Button
                  classType="secondary"
                  label="Batal"
                  onClick={() => setShowConfirmModal(false)}
                  type="button"
                />
                <Button
                  classType="primary"
                  label="Konfirmasi"
                  onClick={handleConfirmSubmit}
                  type="button"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </MainContent>
  );
}

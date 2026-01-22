"use client";

// React & Next
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

// Layout & Wrapper
import MainContent from "@/components/layout/MainContent";
import Card from "@/components/common/Card";

// Komponen Data Display
import Table from "@/components/common/Table";
import Paging from "@/components/common/Paging";
import Formsearch from "@/components/common/Formsearch";
import Badge from "@/components/common/Badge";
import { Avatar } from "@/components/common/Img";

// Komponen Form
import Input from "@/components/common/Input";
import DropDown from "@/components/common/Dropdown";
import Button from "@/components/common/Button";

const Editor = dynamic(() => import("@/components/common/Editor"), {
  ssr: false,
  loading: () => (
    <div className="p-3 border rounded text-muted">Loading Editor...</div>
  ),
});

const Calendar = dynamic(() => import("@/components/common/Calendar"), {
  ssr: false,
  loading: () => (
    <div className="p-1 border rounded text-muted">Loading Datepicker...</div>
  ),
});

// Komponen Feedback
import Toast from "@/components/common/Toast";
import SweetAlert from "@/components/common/SweetAlert";
import Loading from "@/components/common/Loading";

// Komponen Atomik
import Icon from "@/components/common/Icon";

export default function DashboardPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [manualLoading, setManualLoading] = useState(false);

  // --- State untuk Form Inputs ---
  const [textInput, setTextInput] = useState("Nilai Teks");
  const [passInput, setPassInput] = useState("123456");
  const [errorInput, setErrorInput] = useState("Teks yang salah");
  const [dropdownValue, setDropdownValue] = useState("2");

  // --- State untuk Editor ---
  const formData = useRef({
    content: "<p>Ini adalah <strong>konten</strong> default.</p>",
  });
  const [errors, setErrors] = useState({});

  // --- State untuk Kalender ---
  const [singleDate, setSingleDate] = useState(new Date());
  const [rangeDate, setRangeDate] = useState([new Date(), null]);

  // --- State dan Fungsi untuk Capture Selected Row pada Table ---
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectionChange = useCallback((ids) => {
    setSelectedIds(ids);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedIds.length === 0) {
      Toast.error("Silakan pilih data terlebih dahulu.");
      return;
    }

    Toast.success(`Berhasil mendapatkan ID: ${selectedIds.join(", ")}`);
  }, [selectedIds]);

  const handleClickCustomInput = useCallback(async (message) => {
    Toast.success(`Klik toggle ${message}`);
  }, []);

  // --- Data & State untuk Tabel ---
  const [pageSize] = useState(10);
  const [pageCurrent, setPageCurrent] = useState(1);

  // -- Konfigurasi Width dan Wrap pada Tabel ---
  const tableConfig = useMemo(
    () => ({
      widths: {
        Jabatan: "10%",
        Status: "10%",
      },
      isWrap: {
        Keterangan: true,
      },
    }),
    []
  );

  // -- Konfigurasi Warna Baris pada Tabel ---
  const rowColorConfig = useCallback((row) => {
    if (row.Status === "Tidak Aktif") {
      return "table-danger";
    }
    if (row.Jabatan === "Programmer") {
      return "table-success";
    }

    return "";
  }, []);

  // --- Untuk Menambahkan Kondisi Kapan Checkbox di Table Muncul atau Tidak ---
  const checkIsSelectable = (row) => {
    return row.No % 2 === 0;
  };

  // --- Data sampel ---
  const sampleData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      Key: i + 1,
      No: i + 1,
      Nama: `User ${i + 1}`,
      Jabatan: i % 2 === 0 ? "Programmer" : "Designer",
      Telepon: `0812-3456-789${i}`,
      Keterangan:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rhoncus erat nec hendrerit euismod. In vulputate nec nisi eget consequat. Ut finibus pretium purus, ac feugiat dui sollicitudin id. Duis non dolor vel dolor finibus cursus at et felis.",
      ["Suka Makan Ikan?"]:
        i % 3 === 0 ? (
          <Icon
            name="toggle-on"
            type="Bold"
            cssClass="btn px-1 py-0 text-primary"
            title="Nonaktifkan"
            onClick={() => handleClickCustomInput("SUKA makan ikan")}
          />
        ) : (
          <Icon
            name="toggle-off"
            type="Bold"
            cssClass="btn px-1 py-0 text-primary"
            title="Nonaktifkan"
            onClick={() => handleClickCustomInput("TIDAK SUKA makan ikan")}
          />
        ),
      Status: i % 3 === 0 ? "Aktif" : "Tidak Aktif",
      Aksi: ["Detail", "Edit", "Delete"],
      Alignment: [
        "center",
        "center",
        "left",
        "center",
        "center",
        "left",
        "center",
        "center",
        "center",
      ],
      Count: 20,
      id: i + 1,
    }));
  }, []);

  const totalData = sampleData.length;

  const pagedData = useMemo(() => {
    return sampleData.slice(
      (pageCurrent - 1) * pageSize,
      pageCurrent * pageSize
    );
  }, [sampleData, pageCurrent, pageSize]);

  const handleNavigation = (page) => {
    setPageCurrent(page);
  };

  // --- Data untuk Filter & Dropdown ---
  const dataFilterSort = [
    { Value: "1", Text: "Nama [↑]" },
    { Value: "2", Text: "Nama [↓]" },
  ];
  const dataFilterStatus = [
    { Value: "Aktif", Text: "Aktif" },
    { Value: "Tidak Aktif", Text: "Tidak Aktif" },
  ];
  const searchFilterSort = useRef();
  const searchFilterStatus = useRef();

  // --- Handlers ---
  const handleDetail = (id) => Toast.success(`Lihat detail data ID: ${id}`);
  const handleEdit = (id) => Toast.success(`Ubah data ID: ${id}`);
  const handleDelete = (id) => {
    SweetAlert({
      title: "Konfirmasi Hapus",
      text: `Apakah Anda yakin ingin menghapus data ID: ${id}?`,
      icon: "warning",
      confirmText: "Ya, saya yakin!",
    }).then((result) => {
      if (result) {
        Toast.success(`Data ID: ${id} dihapus`);
      }
    });
  };

  const handleEditorChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      formData.current[name] = value;
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors]
  );

  const handleEditorSubmit = useCallback((e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.current.content) newErrors.content = "Konten wajib diisi";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      Toast.success("Konten berhasil disubmit!");
    }
  }, []);

  const handleShowLoading = () => {
    setManualLoading(true);
    setTimeout(() => setManualLoading(false), 2000);
  };

  const handleShowAlertError = () => {
    SweetAlert({
      title: "Contoh Error",
      text: "Ini adalah pesan error dari SweetAlert!",
      icon: "error",
    });
  };

  const handleShowInputAlert = () => {
    SweetAlert({
      title: "Input Sesuatu",
      text: "Apa warna favorit Anda?",
      icon: "info",
      confirmText: "Simpan",
      inputType: "input",
      placeholder: "Contoh: Biru",
    }).then((value) => {
      if (value) {
        Toast.success(`Warna favorit Anda: ${value}`);
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MainContent
      layout="Admin"
      loading={pageLoading}
      title="Demo Komponen"
      breadcrumb={[{ label: "Beranda", href: "/" }, { label: "Demo Komponen" }]}
    >
      {/* Komponen Loading manual */}
      <Loading loading={manualLoading} message="Memuat data..." />

      {/* 1. FORM SEARCH */}
      <div className="row">
        <div className="col-12">
          <Card title="Formsearch (Pencarian, Filter, Aksi)">
            <Formsearch
              onAdd={() => Toast.success("Tombol Tambah diklik")}
              onSearch={(query) => Toast.success(`Mencari: ${query}`)}
              onFilter={() => Toast.success("Filter diterapkan")}
              onExport={() => Toast.success("Export data diklik")}
              filterContent={
                <>
                  <DropDown
                    ref={searchFilterSort}
                    forInput="ddUrut"
                    label="Urut Berdasarkan"
                    type="none"
                    arrData={dataFilterSort}
                  />
                  <DropDown
                    ref={searchFilterStatus}
                    forInput="ddStatus"
                    label="Status"
                    type="none"
                    arrData={dataFilterStatus}
                  />
                </>
              }
            />
          </Card>
        </div>
      </div>

      {/* 2. DATA DISPLAY (TABEL) */}
      <div className="row g-3 mt-1">
        <div className="col-12">
          <Card title="Table, Paging, Badge, dan Aksi SweetAlert">
            <Table
              data={pagedData}
              onDetail={handleDetail}
              onEdit={handleEdit}
              onDelete={handleDelete}
              enableCheckbox={true} // Opsional jika memang ada konfigurasinya
              isRowSelectable={checkIsSelectable} // Wajib ada jika enableCheckBox = true
              onSelectionChange={handleSelectionChange} // Wajib ada jika enableCheckBox = true
              config={tableConfig} // Opsional jika memang ada konfigurasinya
              rowClassName={rowColorConfig} // Opsional jika memang ada konfigurasinya
            />
            {totalData > 0 && (
              <Paging
                pageSize={pageSize}
                pageCurrent={pageCurrent}
                totalData={totalData}
                navigation={handleNavigation}
              />
            )}
            <div className="col-12 mt-3">
              <div className="d-flex mb-3">
                <button
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={selectedIds.length === 0}
                >
                  <i className="bi bi-send me-2"></i>Kirim Data Terpilih
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-lg-8">
          {/* 3. FORM INPUTS */}
          <Card title="Form Inputs (Input, Dropdown)">
            <div className="row g-3">
              <div className="col-md-6">
                <Input
                  label="Teks Input"
                  name="text_input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Masukkan nama Anda"
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Password Input"
                  type="password"
                  name="pass_input"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Error State"
                  name="error_input"
                  value={errorInput}
                  onChange={(e) => setErrorInput(e.target.value)}
                  error="Field ini wajib diisi."
                  helperText="Teks bantuan akan disembunyikan jika ada error."
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Disabled Input"
                  name="disabled_input"
                  value="Tidak bisa diubah"
                  disabled={true}
                />
              </div>
              <div className="col-md-12">
                <DropDown
                  label="Dropdown / Select"
                  forInput="ddContoh"
                  type="pilih"
                  value={dropdownValue}
                  onChange={(e) => setDropdownValue(e.target.value)}
                  arrData={dataFilterSort}
                />
              </div>
            </div>
          </Card>

          {/* 4. EDITOR */}
          <Card title="Editor" className="mt-3">
            <form onSubmit={handleEditorSubmit}>
              <Editor
                label="Konten Berita"
                name="content"
                value={formData.current.content}
                onChange={handleEditorChange}
                error={errors.content}
              />
              <Button
                type="submit"
                iconName="floppy"
                label="Simpan Editor"
                classType="primary mt-3"
              />
            </form>
          </Card>

          {/* 5. CALENDAR */}
          <Card title="Calendar / Date Picker" className="mt-3">
            <div className="row g-3">
              <div className="col-md-6">
                <Calendar
                  type="single"
                  label="Tanggal Tunggal"
                  value={singleDate}
                  onChange={(date) => setSingleDate(date)}
                />
              </div>
              <div className="col-md-6">
                <Calendar
                  type="range"
                  label="Rentang Tanggal"
                  value={rangeDate}
                  onChange={(date) => setRangeDate(date)}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="col-lg-4">
          {/* 6. BUTTONS */}
          <Card title="Buttons">
            <div className="d-flex flex-wrap gap-2">
              <Button classType="primary" label="Primary" />
              <Button classType="secondary" label="Secondary" />
              <Button classType="success" label="Success" iconName="check" />
              <Button classType="danger" label="Danger" iconName="trash" />
              <Button classType="warning" label="Warning" />
              <Button classType="info" label="Info" />
              <Button
                classType="primary"
                label="Disabled"
                iconName="ban"
                isDisabled={true}
              />
              <Button
                classType="link text-primary"
                label="Link Button"
                iconOnly={true}
                iconName="box-arrow-up-right"
              />
            </div>
          </Card>

          {/* 7. IMAGES & AVATARS */}
          <Card title="Images & Avatars" className="mt-3">
            <div className="d-flex align-items-center gap-3">
              <Avatar name="Pusat Sistem Informasi" size={60} />
            </div>
          </Card>

          {/* 8. BADGES */}
          <Card title="Badges" className="mt-3">
            <div className="d-flex flex-wrap gap-2">
              <Badge status="Aktif" />
              <Badge status="Tidak Aktif" />
              <Badge status="Diproses" />
              <Badge status="Disetujui" />
              <Badge status="Ditolak" />
              <Badge status="Draft" />
              <Badge status="Selesai" />
              <Badge status="Batal" />
              <Badge status="Menunggu" />
            </div>
          </Card>

          {/* 9. FEEDBACK */}
          <Card title="Feedback (Toast, SweetAlert, Loading)" className="mt-3">
            <p className="fw-bold small text-primary mb-1">Toast</p>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button
                onClick={() => Toast.success("Data berhasil disimpan!")}
                classType="success"
                label="Success"
                size="sm"
              />
              <Button
                onClick={() => Toast.error("Terjadi kesalahan!")}
                classType="danger"
                label="Error"
                size="sm"
              />
            </div>

            <p className="fw-bold small text-primary mb-1">SweetAlert</p>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button
                onClick={() => handleDelete(99)}
                classType="warning"
                label="Konfirmasi"
                size="sm"
              />
              <Button
                onClick={handleShowAlertError}
                classType="danger"
                label="Pesan Error"
                size="sm"
              />
              <Button
                onClick={handleShowInputAlert}
                classType="info"
                label="Input Alert"
                size="sm"
              />
            </div>

            <p className="fw-bold small text-primary mb-1">Loading Overlay</p>
            <Button
              onClick={handleShowLoading}
              classType="primary"
              label="Tampilkan Loading (2 dtk)"
              size="sm"
            />
          </Card>

          {/* 10. ICONS */}
          <Card title="Icon" className="mt-3">
            <div className="d-flex flex-wrap gap-3">
              <Icon name="calendar" cssClass="fs-4 text-primary" />
              <Icon name="check-circle" cssClass="fs-4 text-success" />
              <Icon name="x-circle" cssClass="fs-4 text-danger" />
              <Icon name="person" cssClass="fs-4 text-info" />
              <Icon name="bell" cssClass="fs-4 text-warning" />
              <Icon name="star" cssClass="fs-4 text-secondary" />
              <Icon name="gear" cssClass="fs-4 text-dark" />
              <Icon name="search" cssClass="fs-4 text-primary" />
            </div>
          </Card>
        </div>
      </div>
    </MainContent>
  );
}

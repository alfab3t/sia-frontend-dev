"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import PropTypes from "prop-types";
import Cookies from "js-cookie";

import MainContent from "@/components/layout/MainContent";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Toast from "@/components/common/Toast";
import Swal from "@/components/common/SweetAlert";
import Label from "@/components/common/Label";

const API = "http://localhost:5234";

const getAuthHeader = () => {
  const token = Cookies.get("jwtToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};


function SearchableDropdown({
  id,
  label,
  items,
  value,
  onChange,
  disabled = false,
  isRequired = false,
  errorMessage,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const selected = items.find((x) => String(x.id) === String(value));

  const filtered = items.filter(
    (x) =>
      x.nama.toLowerCase().includes(search.toLowerCase()) ||
      String(x.id).includes(search)
  );

  return (
    <div className="mb-3" ref={ref}>
      <Label required={isRequired} text={label} htmlFor={id} />

      <button
        id={id}
        type="button"
        className="form-select rounded-4 blue-element d-flex justify-content-between align-items-center"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected ? "" : "text-muted"}>
          {selected ? selected.nama : `-- Pilih ${label} --`}
        </span>
        <span>▾</span>
      </button>

      {open && !disabled && (
        <div className="border rounded-4 mt-1 bg-white shadow-sm">
          <div className="p-2 border-bottom">
            <input
              className="form-control"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-muted">Data tidak ditemukan</div>
            )}

            {filtered.map((x) => (
              <button
                key={x.id}
                type="button"
                className="dropdown-item px-3 py-2 text-start w-100"
                onClick={() => {
                  onChange(x.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {x.nama}
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <small className="text-danger">{errorMessage}</small>
      )}
    </div>
  );
}

SearchableDropdown.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isRequired: PropTypes.bool,
  errorMessage: PropTypes.string,
};


export default function AddPerwalianPage() {
  const router = useRouter();

  const [prodi, setProdi] = useState("");
  const [angkatan, setAngkatan] = useState("");

  const [listProdi, setListProdi] = useState([]);
  const [listMhs, setListMhs] = useState([]);
  const [listDosen, setListDosen] = useState([]);
  const [listAngkatan, setListAngkatan] = useState([]);

  const [form, setForm] = useState({
    IdMahasiswa: "",
    IdDosen: "",
    Subjek: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/Perwalian/Dropdown/Prodi`, {
      headers: getAuthHeader(),
    })
      .then((r) => r.json())
      .then(setListProdi)
      .catch(() => Toast.error("Gagal memuat prodi"));
  }, []);

  useEffect(() => {
    fetch(`${API}/api/Perwalian/Dropdown/Dosen`, {
      headers: getAuthHeader(),
    })
      .then((r) => r.json())
      .then(setListDosen)
      .catch(() => Toast.error("Gagal memuat dosen"));
  }, []);

  useEffect(() => {
    if (!prodi) return;

    setAngkatan("");
    setListMhs([]);
    setListAngkatan([]);
    setForm((p) => ({ ...p, IdMahasiswa: "" }));

    fetch(
      `${API}/api/Perwalian/Dropdown/MahasiswaByProdi?idkonsentrasi=${prodi}`,
      { headers: getAuthHeader() }
    )
      .then((r) => r.json())
      .then((data) => {
        setListMhs(data);

        const uniqAngkatan = [
          ...new Set(data.map((x) => x.angkatan).filter(Boolean)),
        ].sort((a, b) => b - a);

        setListAngkatan(uniqAngkatan.map((a) => ({ id: a, nama: a })));
      })
      .catch(() => Toast.error("Gagal memuat mahasiswa"));
  }, [prodi]);

  const filteredMhs = angkatan
    ? listMhs.filter((m) => String(m.angkatan) === String(angkatan))
    : [];

  const validateForm = useCallback(() => {
    const e = {};
    if (!prodi) e.prodi = "Prodi wajib dipilih";
    if (!angkatan) e.angkatan = "Angkatan wajib dipilih";
    if (!form.IdMahasiswa) e.IdMahasiswa = "Mahasiswa wajib dipilih";
    if (!form.IdDosen) e.IdDosen = "Dosen wajib dipilih";
    if (!form.Subjek.trim()) e.Subjek = "Subjek wajib diisi";

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, prodi, angkatan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/Perwalian/Create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");

      await Swal({
        title: "Berhasil!",
        text: "Data perwalian berhasil ditambahkan.",
        icon: "success",
      });

      router.push("/pages/Pelaksanaan-Perwalian");
    } catch (err) {
      Toast.error(err.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainContent
      layout="Admin"
      title="Tambah Pelaksanaan Perwalian"
      loading={loading}
      breadcrumb={[
        { label: "Beranda", href: "/sample" },
        { label: "Perwalian" },
        {
          label: "Pelaksanaan Perwalian",
          href: "/pages/Pelaksanaan-Perwalian",
        },
        { label: "Tambah" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <SearchableDropdown
              id="prodi"
              label="Prodi"
              items={listProdi}
              value={prodi}
              onChange={setProdi}
              isRequired
              errorMessage={errors.prodi}
            />

            <SearchableDropdown
              id="angkatan"
              label="Angkatan"
              items={listAngkatan}
              value={angkatan}
              onChange={setAngkatan}
              disabled={!prodi}
              isRequired
              errorMessage={errors.angkatan}
            />

            <SearchableDropdown
              id="mahasiswa"
              label="Mahasiswa"
              items={filteredMhs}
              value={form.IdMahasiswa}
              onChange={(v) =>
                setForm((p) => ({ ...p, IdMahasiswa: v }))
              }
              disabled={!angkatan}
              isRequired
              errorMessage={errors.IdMahasiswa}
            />

            <SearchableDropdown
              id="dosen"
              label="Dosen Wali"
              items={listDosen}
              value={form.IdDosen}
              onChange={(v) =>
                setForm((p) => ({ ...p, IdDosen: v }))
              }
              isRequired
              errorMessage={errors.IdDosen}
            />

            <Input
              label="Subjek"
              value={form.Subjek}
              onChange={(e) =>
                setForm((p) => ({ ...p, Subjek: e.target.value }))
              }
              error={errors.Subjek}
            />

            <div className="d-flex justify-content-end gap-3 mt-4">
              <Button
                classType="secondary"
                label="Batal"
                type="button"
                onClick={() => router.back()}
                />
                <Button
                 classType="primary"
                 iconName="save"
                 label="Simpan"
                 type="submit"
                 isDisabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
    </MainContent>
  );
}

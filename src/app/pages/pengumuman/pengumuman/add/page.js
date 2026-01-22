"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";

import MainContent from "@/components/layout/MainContent";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Toast from "@/components/common/Toast";
import DropDown from "@/components/common/Dropdown";
import Label from "@/components/common/Label";

const Editor = dynamic(() => import("@/components/common/Editor"), { ssr: false });
const Calendar = dynamic(() => import("@/components/common/Calendar"), { ssr: false });

export default function CreatePengumumanPage() {
    const router = useRouter();

    const [appId, setAppId] = useState("");
    const [penSubjek, setPenSubjek] = useState("");
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [penIsi, setPenIsi] = useState("");
    const [penWajib, setPenWajib] = useState(false);
    const [penTanggalMulai, setPenTanggalMulai] = useState(new Date());
    const [penTanggalSelesai, setPenTanggalSelesai] = useState(new Date());
    const [listAplikasi, setListAplikasi] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listRole, setListRole] = useState([]);
    const [errors, setErrors] = useState({});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    useEffect(() => {
        const fetchAplikasi = async () => {
            setLoading(true);
            try {
                const res = await fetchData(
                    `${API_LINK}Pengumuman/GetListAplikasi`,
                    {},
                    "GET"
                );
                if (res?.error) throw new Error(res.message);

                if (res?.data) {
                    const options = res.data.map(item => ({
                        Value: item.idAplikasi,
                        Text: item.namaAplikasi
                    }));
                    setListAplikasi(options);
                }
            } catch {
                Toast.error("Gagal memuat daftar aplikasi.");
                setListAplikasi([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAplikasi();
    }, []);

    useEffect(() => {
        if (!appId) {
            setListRole([]);
            setSelectedRoles([]);
            return;
        }

        const fetchRole = async () => {
            setLoading(true);
            try {
                const res = await fetchData(
                    `${API_LINK}Pengumuman/GetListRoleByAplikasi?IdAplikasi=${appId}`,
                    {},
                    "POST"
                );
                if (res?.error) throw new Error(res.message);

                if (res?.data) {
                    const options = res.data.map(item => {
                        const cleanText = item.namaAplikasi
                            ? item.namaAplikasi.replaceAll("&nbsp;", "").trim()
                            : "";
                        return {
                            Value: item.idRole,
                            Text: cleanText
                        };
                    });
                    setListRole(options);
                }

            } catch {
                Toast.error("Gagal memuat daftar role.");
                setListRole([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
    }, [appId]);

    const handleRoleChange = (roleId) => {
        setSelectedRoles(prev => {
            if (prev.includes(roleId)) {
                return prev.filter(id => id !== roleId);
            } else {
                return [...prev, roleId];
            }
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!appId) newErrors.appId = "Aplikasi wajib dipilih.";

        if (appId) {
            if (!penSubjek) newErrors.penSubyek = "Subyek Pengumuman wajib diisi.";
            if (selectedRoles.length === 0) newErrors.selectedRoles = "Pilih minimal satu tujuan (Untuk).";

            if (!penIsi || penIsi === "<p><br></p>" || penIsi.trim() === "") {
                newErrors.penIsi = "Isi Pengumuman wajib diisi.";
            }
            if (penTanggalSelesai < penTanggalMulai) {
                Toast.error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
                newErrors.tanggal = "Tanggal tidak valid";
            }
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formErrors = validateForm();

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            if (!formErrors.tanggal) {
                Toast.error("Harap lengkapi data yang wajib diisi.");
            }
            return;
        }

        setLoading(true);
        setErrors({});

        const requestBody = {
            IdAplikasi: appId,
            KpdPengumuman: selectedRoles.join(","),
            SubyekPengumuman: penSubjek,
            IsiPengumuman: penIsi,
            StatusBaca: penWajib ? 1 : 0,
            TanggalMulaiPengumuman: penTanggalMulai.toISOString(),
            TanggalSelesaiPengumuman: penTanggalSelesai.toISOString(),
        };

        try {
            const res = await fetchData(
                `${API_LINK}Pengumuman/CreatePengumuman`,
                requestBody,
                "POST"
            );

            if (res) {
                Toast.success("Pengumuman berhasil dibuat!");
                setTimeout(() => {
                    router.push('/pages/pengumuman/pengumuman');
                }, 100);
            }
        } catch {
            Toast.error("Gagal membuat pengumuman.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Tambah Pengumuman"
            breadcrumb={[
                { label: "Beranda", href: "/pages/beranda" },
                { label: "Pengumuman" },
                { label: "Pengumuman", href: "/pages/pengumuman/pengumuman" },
                { label: "Tambah Pengumuman" }
            ]}
        >
            <div className="bg-white p-3 rounded border">
                <form onSubmit={handleSubmit}>
                    <div className="row g-3 align-items-start">

                        <div className="col-md-6">
                            <DropDown
                                label="Aplikasi"
                                forInput="appId"
                                arrData={listAplikasi}
                                value={appId}
                                onChange={(e) => setAppId(e.target.value)}
                                type="pilih"
                                isRequired={false}
                                errorMessage={errors.appId}
                            />
                        </div>

                        {appId && (
                            <div className="col-md-6">
                                <Input
                                    label="Subyek Pengumuman"
                                    name="penSubjek"
                                    value={penSubjek}
                                    onChange={(e) => setPenSubjek(e.target.value)}
                                    required={false}
                                    error={errors.penSubyek}
                                />
                            </div>
                        )}

                        {appId && (
                            <>
                                <div className="col-12">
                                    <Label text="Untuk (Pilih)" required={false} />
                                    <div className={`p-3 border rounded-4 bg-light ${errors.selectedRoles ? 'border-danger' : ''}`} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {listRole.length > 0 ? (
                                            <div className="d-flex flex-column gap-2">
                                                {listRole.map((role) => (
                                                    <div key={role.Value} className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`role-${role.Value}`}
                                                            checked={selectedRoles.includes(role.Value)}
                                                            onChange={() => handleRoleChange(role.Value)}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                        <label className="form-check-label small text-dark" htmlFor={`role-${role.Value}`} style={{ cursor: 'pointer' }}>
                                                            {role.Text}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted small m-0">Tidak ada data role.</p>
                                        )}
                                    </div>
                                    {errors.selectedRoles && <div className="invalid-feedback d-block">{errors.selectedRoles}</div>}
                                </div>

                                <div className="col-12">
                                    <Label text="Tanggal Tampil" required={false} />
                                </div>
                                <div className="col-md-6">
                                    <Calendar
                                        label="Dari"
                                        type="single"
                                        value={penTanggalMulai}
                                        onChange={(date) => setPenTanggalMulai(date)}
                                        minDate={today}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Calendar
                                        label="Sampai"
                                        type="single"
                                        value={penTanggalSelesai}
                                        onChange={(date) => setPenTanggalSelesai(date)}
                                        minDate={penTanggalMulai}
                                    />
                                </div>

                                <div className="col-12">
                                    <div className="p-3 border rounded-4 bg-light d-flex align-items-center">
                                        <div className="form-check mb-0">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="penWajibCheck"
                                                checked={penWajib}
                                                onChange={(e) => setPenWajib(e.target.checked)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <label className="form-check-label ms-2 user-select-none text-dark" htmlFor="penWajibCheck" style={{ cursor: 'pointer' }}>
                                                Beri ceklis "Saya telah membaca pengumuman ini" (paksa baca)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 mt-4">
                                    <h6 className="fw-bold mb-2 text-primary">Isi Pengumuman</h6>
                                    <Editor
                                        label=""
                                        name="penIsi"
                                        value={penIsi}
                                        onChange={(e) => setPenIsi(e.target.value)}
                                        error={errors.penIsi}
                                    />
                                </div>

                                <div className="col-12 d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                                    <Button
                                        type="button"
                                        classType="secondary"
                                        label="Batal"
                                        onClick={() => router.back()}
                                    />
                                    <Button
                                        type="submit"
                                        classType="primary"
                                        label="Simpan"
                                        iconName="save"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </MainContent>
    );
}
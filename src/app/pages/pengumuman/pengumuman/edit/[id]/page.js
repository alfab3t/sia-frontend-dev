"use client";

import { useState, useEffect, use } from 'react';
import { decryptIdUrl } from "@/lib/encryptor";
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types'; 

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

export default function EditPengumumanPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [appId, setAppId] = useState("");
  const [penSubjek, setPenSubjek] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [penIsi, setPenIsi] = useState("");
  const [penWajib, setPenWajib] = useState(false);
  const [penTanggalMulai, setPenTanggalMulai] = useState(new Date());
  const [penTanggalSelesai, setPenTanggalSelesai] = useState(new Date());
  const [originalIsActive, setOriginalIsActive] = useState(true);

  const [listAplikasi, setListAplikasi] = useState([]);
  const [listRole, setListRole] = useState([]);
  const [errors, setErrors] = useState({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatLocalISO = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  };

  useEffect(() => {
    const fetchAplikasi = async () => {
      try {
        const response = await fetchData(
          `${API_LINK}Pengumuman/GetListAplikasi`,
          {},
          "GET"
        );

        if (response?.data) {
          const options = response.data.map((item) => ({
            Value: item.IdAplikasi ?? item.idAplikasi,
            Text: item.NamaAplikasi ?? item.namaAplikasi,
          }));
          setListAplikasi(options);
        }
      } catch {
        setListAplikasi([]);
      }
    };

    fetchAplikasi();
  }, []);

  useEffect(() => {
    const fetchDetailAndRole = async () => {
      setLoading(true);
      try {
        const resDetail = await fetchData(
          `${API_LINK}Pengumuman/DetailPengumuman/${decryptIdUrl(id)}`,
          {},
          "GET"
        );

        if (resDetail === null || resDetail === undefined) {
             throw new Error("Gagal mengambil data detail.");
        }

        const result = resDetail;
        
        const currentAppId = result.IdAplikasi ?? result.idAplikasi ?? "";
        const subject = result.SubyekPengumuman ?? result.subyekPengumuman ?? "";
        const content = result.IsiPengumuman ?? result.isiPengumuman ?? "";
        
        const statusVal = result.StatusBaca ?? result.statusBaca;
        const isWajib = statusVal === 1 || statusVal === true;

        const tglMulaiStr = result.TanggalMulaiPengumuman ?? result.tanggalMulaiPengumuman;
        const tglSelesaiStr = result.TanggalSelesaiPengumuman ?? result.tanggalSelesaiPengumuman;

        const existingRolesStr = result.KpdPengumuman ?? result.kpdPengumuman ?? "";
        
        const currentStatus = result.StatusPengumuman ?? result.statusPengumuman ?? "Aktif";
        const isActiveNow = currentStatus === "Aktif" || currentStatus === "Tampil";
        setOriginalIsActive(isActiveNow);

        setAppId(currentAppId);
        setPenSubjek(subject);
        setPenIsi(content);
        setPenWajib(isWajib);

        if (tglMulaiStr) setPenTanggalMulai(new Date(tglMulaiStr));
        if (tglSelesaiStr) setPenTanggalSelesai(new Date(tglSelesaiStr));

        if (existingRolesStr) {
          const rolesArray = existingRolesStr.split(",").map(r => r.trim()).filter(r => r !== "");
          setSelectedRoles(rolesArray);
        }

        if (currentAppId) {
          const resRole = await fetchData(
            `${API_LINK}Pengumuman/GetListRoleByAplikasi?IdAplikasi=${currentAppId}`,
            {},
            "POST"
          );

          if (resRole?.data) {
            const options = resRole.data.map((item) => ({
              Value: item.IdRole ?? item.RoleId ?? item.idRole ?? item.roleId,
              Text: (item.NamaAplikasi ?? item.namaAplikasi ?? "").replaceAll("&nbsp;", "").trim(),
            }));
            setListRole(options);
          }
        }

      } catch {
        Toast.error("Gagal memuat data detail.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetailAndRole();
  }, [id]);

  const handleRoleChange = (roleId) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((item) => item !== roleId);
      }
      return [...prev, roleId];
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!appId) newErrors.appId = "Aplikasi wajib dipilih.";
    if (!penSubjek) newErrors.penSubyek = "Subyek wajib diisi.";
    if (selectedRoles.length === 0) newErrors.selectedRoles = "Pilih minimal satu tujuan (Untuk).";
    
    if (!penIsi || penIsi === "<p><br></p>" || penIsi.trim() === "") {
      newErrors.penIsi = "Isi pengumuman wajib diisi.";
    }

    if (penTanggalSelesai < penTanggalMulai) {
      Toast.error("Tanggal Selesai tidak boleh lebih awal dari Tanggal Mulai.");
      newErrors.tanggal = "Tanggal tidak valid"; 
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      if (!formErrors.tanggal) {
          Toast.error("Harap lengkapi data.");
      }
      return;
    }

    setLoading(true);
    const decryptedId = decryptIdUrl(id);

    const requestBody = {
      IdPengumuman: decryptedId,
      IdAplikasi: appId,
      KpdPengumuman: selectedRoles.join(","),
      SubyekPengumuman: penSubjek,
      IsiPengumuman: penIsi,
      StatusBaca: penWajib ? 1 : 0,
      TanggalMulaiPengumuman: formatLocalISO(penTanggalMulai),
      TanggalSelesaiPengumuman: formatLocalISO(penTanggalSelesai),
    };

    try {
      await fetchData(
        `${API_LINK}Pengumuman/EditPengumuman`, 
        requestBody,
        "PUT"
      );

      if (!originalIsActive) {
         await fetchData(
             `${API_LINK}Pengumuman/HidePengumuman/${decryptedId}`,
             {},
             "POST"
         );
      }

      Toast.success("Data berhasil diperbarui!");
      setTimeout(() => {
        router.push("/pages/pengumuman/pengumuman");
      }, 1500);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal update data.";
      Toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Edit Pengumuman"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Pengumuman" },
        { label: "Pengumuman", href: "/pages/pengumuman/pengumuman" },
        { label: "Edit Pengumuman" },
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
                onChange={async (e) => {
                  const newAppId = e.target.value;
                  setAppId(newAppId);
                  setSelectedRoles([]); 
                  
                  if(newAppId) {
                      try {
                        const resRole = await fetchData(
                            `${API_LINK}Pengumuman/GetListRoleByAplikasi?IdAplikasi=${newAppId}`,
                            {},
                            "POST"
                        );
                        if(resRole?.data) {
                            setListRole(resRole.data.map(item => ({
                                Value: item.IdRole ?? item.idRole ?? item.RoleId ?? item.roleId,
                                Text: (item.NamaAplikasi ?? item.namaAplikasi ?? "").replaceAll("&nbsp;", "").trim()
                            })));
                        }
                      } catch {
                          setListRole([]);
                      }
                  } else {
                      setListRole([]);
                  }
                }}
                type="pilih"
                isRequired={false}
                errorMessage={errors.appId}
              />
            </div>

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

            <div className="col-12">
              <Label text="Untuk (Pilih)" required={false} />
              <div
                className={`p-3 border rounded-4 bg-light ${
                  errors.selectedRoles ? "border-danger" : ""
                }`}
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {listRole.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {listRole.map((role) => (
                      <div key={role.Value} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`role-${role.Value}`}
                          checked={selectedRoles.includes(String(role.Value))}
                          onChange={() => handleRoleChange(String(role.Value))}
                          style={{ cursor: "pointer" }}
                        />
                        <label
                          className="form-check-label small text-dark"
                          htmlFor={`role-${role.Value}`}
                          style={{ cursor: "pointer" }}
                        >
                          {role.Text}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small m-0">
                     {appId ? "Tidak ada role tersedia." : "Pilih Aplikasi terlebih dahulu."}
                  </p>
                )}
              </div>
              {errors.selectedRoles && (
                <div className="invalid-feedback d-block">
                  {errors.selectedRoles}
                </div>
              )}
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
                    style={{ cursor: "pointer" }}
                  />
                  <label
                    className="form-check-label ms-2 user-select-none text-dark"
                    htmlFor="penWajibCheck"
                    style={{ cursor: "pointer" }}
                  >
                    Wajib Dibaca (Paksa Baca)
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
                label="Simpan Perubahan"
                iconName="save"
              />
            </div>
          </div>
        </form>
      </div>
    </MainContent>
  );
}

EditPengumumanPage.propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string, 
  }).isRequired,
};
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { decryptIdUrl } from "@/lib/encryptor";
import PropTypes from "prop-types";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { getSSOData, getUserData } from "@/context/user";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";

const DetailItem = ({ label, value, isHtml = false }) => (
  <div className={isHtml ? "col-12 mb-3" : "col-lg-6 mb-3"}>
    <div className="detail-item">
      <small className="text-muted d-block mb-1">
        <strong>{label}</strong>
      </small>
      {isHtml ? (
        <div
          className="p-3 bg-light border rounded text-secondary mt-1 announcement-content"
          style={{ minHeight: "100px", overflowX: "auto" }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <span className="fw-medium text-dark">
          {value !== null && value !== undefined && value !== "" ? value : "-"}
        </span>
      )}
    </div>
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  isHtml: PropTypes.bool,
};

export default function DetailPengumumanPage() {
  const params = useParams();
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    let id;
    try {
      id = decryptIdUrl(params.id);
      if (!id) throw new Error("ID tidak valid");
    } catch {
      Toast.error("ID Pengumuman tidak valid.");
      setLoading(false);
      router.back();
      return;
    }

    try {
      const res = await fetchData(
        `${API_LINK}Pengumuman/DetailPengumuman/${id}`,
        {},
        "GET"
      );

      if (!res) throw new Error("Data tidak ditemukan");
      const appId = res.idAplikasi || res.IdAplikasi;
      const appName = res.namaAplikasi || res.NamaAplikasi;
      const subject = res.subyekPengumuman || res.SubyekPengumuman;
      const content = res.isiPengumuman || res.IsiPengumuman;
      const isMandatory = res.statusBaca === 1 || res.statusBaca === true || res.StatusBaca === 1; 
      
      const startDateIndo = res.tanggalMulaiPengumumanIndo || res.TanggalMulaiPengumumanIndo;
      const endDateIndo = res.tanggalSelesaiPengumumanIndo || res.TanggalSelesaiPengumumanIndo;

      let roleIds = res.kpdPengumuman || res.KpdPengumuman || "";

      if (appId) {
        try {
          const resRole = await fetchData(
            `${API_LINK}Pengumuman/GetListRoleByAplikasi?IdAplikasi=${appId}`,
            {},
            "POST"
          );

          if (resRole?.data && Array.isArray(resRole.data)) {
            const selectedIds = roleIds.split(",");
            const names = resRole.data
              .filter((r) => selectedIds.includes(String(r.idRole || r.IdRole || r.roleId)))
              .map((r) => {
                const roleName = r.namaAplikasi || r.NamaAplikasi || r.namaRole || "";
                return roleName.replaceAll("&nbsp;", " ").trim();
              })
              .filter((name) => name !== "")
              .join(", ");

            if (names) roleIds = names;
          }
        } catch {
          Toast.error("Gagal memuat informasi role.");
        }
      }

      // 3. Set Data ke State
      setData({
        appNameFormatted: appName,
        roleNamesFormatted: roleIds,
        isMandatory: isMandatory,
        startDateFormatted: startDateIndo,
        endDateFormatted: endDateIndo,
        subject: subject,
        content: content,
      });

    } catch {
      Toast.error("Gagal memuat data Kesalahan server");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("/auth/login");
      return;
    }

    if (userData && !userData.permission?.includes("pengumuman.view")) {
        Toast.error("Anda tidak memiliki akses.");
        router.push("/pages/pengumuman/pengumuman"); 
        return;
    }

    loadData();
  }, [ssoData, router, loadData, userData]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Detail Pengumuman"
      breadcrumb={[
        { label: "Beranda", href: "/pages/beranda" },
        { label: "Pengumuman" },
        { label: "Pengumuman", href: "/pages/pengumuman/pengumuman" },
        { label: "Detail" },
      ]}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .announcement-content img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
        }
        .announcement-content figure {
          max-width: 100% !important;
        }
      `,
        }}
      />

      <div className="bg-white p-4 rounded border shadow-sm">
        {data && (
          <>
            <div className="mb-4">
              <h5 className="text-primary mb-3 pb-2 border-bottom">
                Informasi Umum
              </h5>
              <div className="row">
                <DetailItem
                  label="Aplikasi"
                  value={data.appNameFormatted}
                />
                <DetailItem
                  label="Subyek Pengumuman"
                  value={data.subject}
                />
                <DetailItem
                  label="Status Baca"
                  value={
                    <div className="d-flex align-items-center gap-2">
                      <i
                        className={`bi ${
                          data.isMandatory
                            ? "bi-check-square-fill text-primary"
                            : "bi-square text-secondary"
                        }`}
                      />
                      <span>
                        {data.isMandatory ? "Wajib Dibaca" : "Tidak Wajib"}
                      </span>
                    </div>
                  }
                />
                <DetailItem
                  label="Ditujukan Kepada"
                  value={data.roleNamesFormatted}
                />
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-primary mb-3 pb-2 border-bottom">
                Periode Aktif
              </h5>
              <div className="row">
                <DetailItem
                  label="Tanggal Mulai"
                  value={data.startDateFormatted}
                />
                <DetailItem
                  label="Tanggal Selesai"
                  value={data.endDateFormatted}
                />
              </div>
            </div>

            <div className="mb-4">
              <h5 className="text-primary mb-3 pb-2 border-bottom">
                Konten
              </h5>
              <div className="row">
                <DetailItem
                  label="Isi Pengumuman"
                  value={data.content}
                  isHtml={true}
                />
              </div>
            </div>
          </>
        )}

        <div className="row mt-4">
          <div className="col-12">
            <div className="d-flex justify-content-end gap-2">
              <Button
                classType="secondary"
                label="Kembali"
                onClick={handleBack}
                type="button"
              />
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}
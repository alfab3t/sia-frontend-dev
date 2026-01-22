"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PropTypes from "prop-types";
import Button from "@/components/common/Button";
import MainContent from "@/components/layout/MainContent";
import Toast from "@/components/common/Toast";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";
import DateFormatter from "@/lib/dateFormater";
import { getSSOData, getUserData } from "@/context/user";
import Badge from "@/components/common/Badge";

const DetailItem = ({ label, value }) => (
  <div className="col-lg-4 mb-3">
    <div className="detail-item">
      <small className="text-muted d-block mb-1">
        <strong>{label}</strong>
      </small>
      {value !== null && value !== undefined && value !== "" ? value : "-"}
    </div>
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

export default function DetailInstitusiPage() {
  const path = useParams();
  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);
  const router = useRouter();
  const id = decryptIdUrl(path.id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) {
      Toast.error("ID institusi tidak valid.");
      setLoading(false);
      router.back();
      return;
    }

    try {
      setLoading(true);
      const response = await fetchData(
        `${API_LINK}Institusi/DetailInstitusi/${id}`,
        {},
        "GET"
      );
      setData(response);
    } catch (err) {
      Toast.error("Gagal memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [id, isClient, router]);

  useEffect(() => {
    setIsClient(true);

    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("./auth/login");
      return;
    }

    loadData();
  }, [ssoData, router, loadData]);

  const handleEdit = useCallback(() => {
    router.push(`/pages/pengaturan-dasar/institusi/edit/${encryptIdUrl(id)}`);
  }, [router, id]);

  const handleBack = useCallback(() => {
    router.push("/pages/pengaturan-dasar/institusi");
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Detail Institusi"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        {
          label: "Institusi",
          href: "/pages/pengaturan-dasar/institusi",
        },
        { label: "Detail" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          {data && (
            <>
              <div className="mb-4">
                <h5 className="text-primary mb-3 pb-2 border-bottom">
                  Informasi Umum
                </h5>
                <div className="row">
                  <DetailItem
                    label="Nama Institusi"
                    value={data.namaInstitusi}
                  />
                  <DetailItem label="Alamat" value={data.alamat} />
                  <DetailItem label="Kode Pos" value={data.kodePos} />
                  <DetailItem label="Telepon" value={data.telepon} />
                  <DetailItem label="Fax" value={data.fax} />
                  <DetailItem label="Email" value={data.email} />
                  <DetailItem label="Website" value={data.website} />
                  <DetailItem
                    label="Status"
                    value={<Badge status={data.status} />}
                  />
                </div>
              </div>
              <div className="mb-4">
                <h5 className="text-primary mb-3 pb-2 border-bottom">
                  Informasi Pimpinan
                </h5>
                <div className="row">
                  <DetailItem label="Direktur" value={data.namaDirektur} />
                  <DetailItem
                    label="Wakil Direktur 1"
                    value={data.namaWadir1}
                  />
                  <DetailItem
                    label="Wakil Direktur 2"
                    value={data.namaWadir2}
                  />
                  <DetailItem
                    label="Wakil Direktur 3"
                    value={data.namaWadir3}
                  />
                  <DetailItem
                    label="Wakil Direktur 4"
                    value={data.namaWadir4}
                  />
                </div>
              </div>
              <div className="mb-4">
                <h5 className="text-primary mb-3 pb-2 border-bottom">
                  Informasi Legal
                </h5>
                <div className="row">
                  <DetailItem
                    label="Tanggal Berdiri"
                    value={DateFormatter.formatDateLong(data.tanggalBerdiri)}
                  />
                  <DetailItem label="Nomor SK" value={data.nomorSK} />
                  <DetailItem
                    label="Tanggal SK"
                    value={DateFormatter.formatDateLong(data.tanggalSK)}
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
                {isClient &&
                  userData?.permission?.includes("institusi.edit") && (
                    <Button
                      classType="primary"
                      iconName="pencil"
                      label="Edit"
                      onClick={handleEdit}
                      type="button"
                    />
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}

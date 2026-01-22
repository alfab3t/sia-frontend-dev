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
import { getSSOData, getUserData } from "@/context/user";
import Badge from "@/components/common/Badge";

const DetailItem = ({ label, value }) => (
  <div className="col-lg-4 mb-3">
    <div className="detail-item">
      <small className="text-muted d-block mb-1">
        <strong>{label}</strong>
      </small>
      {value || "-"}
    </div>
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

export default function DetailInstitusiBeasiswaPage() {
  const path = useParams();
  const router = useRouter();

  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);

  const id = decryptIdUrl(path.id);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) {
      Toast.error("ID institusi beasiswa tidak valid.");
      router.back();
      return;
    }

    try {
      setLoading(true);

      const response = await fetchData(
        `${API_LINK}InstitusiBeasiswa/DetailInstitusiBeasiswa/${id}`,
        {},
        "GET",
      );

      setData(response);
    } catch {
      Toast.error("Gagal Memuat Data");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    setIsClient(true);

    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("./auth/login");
      return;
    }

    loadData();
  }, [loadData, ssoData, router]);

  const handleEdit = () => {
    router.push(
      `/pages/administrasi-akademik/institusi-beasiswa/edit/${encryptIdUrl(id)}`,
    );
  };

  const handleBack = () => {
    router.push("/pages/administrasi-akademik/institusi-beasiswa");
  };

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Detail Institusi Beasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        {
          label: "Institusi Beasiswa",
          href: "/pages/administrasi-akademik/institusi-beasiswa",
        },
        { label: "Detail" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          {data && (
            <div className="mb-4">
              <h5 className="text-primary mb-3 pb-2 border-bottom">
                Informasi Institusi Beasiswa
              </h5>
              <div className="row">
                <DetailItem
                  label="Nama Institusi"
                  value={data.namaInstitusiBeasiswa}
                />
                <DetailItem label="Alamat" value={data.alamat} />
                <DetailItem label="Telepon" value={data.telepon} />
                <DetailItem label="Email" value={data.email} />
                <DetailItem
                  label="Status"
                  value={<Badge status={data.status} />}
                />
              </div>
            </div>
          )}

          <div className="row mt-4">
            <div className="col-12">
              <div className="d-flex justify-content-end gap-2">
                <Button
                  classType="secondary"
                  label="Kembali"
                  onClick={handleBack}
                />

                {isClient &&
                  userData?.permission?.includes("institusi_beasiswa.edit") && (
                    <Button
                      classType="primary"
                      iconName="pencil"
                      label="Edit"
                      onClick={handleEdit}
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

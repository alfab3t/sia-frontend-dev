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
      {value ?? "-"}
    </div>
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

export default function DetailJenisBeasiswaPage() {
  const params = useParams();
  const router = useRouter();

  const ssoData = useMemo(() => getSSOData(), []);
  const userData = useMemo(() => getUserData(), []);

  const id = decryptIdUrl(params.id);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) {
      Toast.error("ID jenis beasiswa tidak valid.");
      router.back();
      return;
    }

    try {
      setLoading(true);

      const res = await fetchData(
        `${API_LINK}JenisBeasiswa/DetailJenisBeasiswa/${id}`,
        {},
        "GET",
      );

      if (res?.message) {
        Toast.error("Gagal Memuat Data");
        return;
      }

      setData(res);
    } catch {
      Toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    setIsClient(true);

    if (!ssoData) {
      Toast.error("Sesi anda habis. Silakan login kembali.");
      router.push("/auth/login");
      return;
    }

    loadData();
  }, [ssoData, router, loadData]);

  const handleEdit = useCallback(() => {
    router.push(
      `/pages/administrasi-akademik/jenis-beasiswa/edit/${encryptIdUrl(id)}`,
    );
  }, [router, id]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <MainContent
      layout="Admin"
      loading={loading}
      title="Detail Jenis Beasiswa"
      breadcrumb={[
        { label: "Beranda", href: "/" },
        { label: "Pengaturan Dasar" },
        {
          label: "Jenis Beasiswa",
          href: "/pages/administrasi-akademik/jenis-beasiswa",
        },
        { label: "Detail" },
      ]}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-4">
          {data && (
            <div className="mb-4">
              <h5 className="text-primary mb-3 pb-2 border-bottom">
                Informasi Jenis Beasiswa
              </h5>

              <div className="row">
                <DetailItem
                  label="Nama Jenis Beasiswa"
                  value={data.namaJenisBeasiswa}
                />
                <DetailItem
                  label="Nama Institusi Beasiswa"
                  value={data.namaInstitusi}
                />
                <DetailItem
                  label="Masa Semester"
                  value={`${data.masaSemester} Semester`}
                />
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
                  userData?.permission?.includes("jenis_beasiswa.edit") && (
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

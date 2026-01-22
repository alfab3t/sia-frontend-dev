"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { decryptIdUrl } from "@/lib/encryptor";
import PropTypes from "prop-types";
import { API_LINK } from "@/lib/constant";
import fetchData from "@/lib/fetch";
import { getSSOData } from "@/context/user";
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
    const router = useRouter();

    const id = params.id;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const loadData = useCallback(async () => {
        if (!id) {
            Toast.error("ID Pengumuman tidak valid.");
            setLoading(false);
            router.back();
            return;
        }

        setLoading(true);

        try {
            const res = await fetchData(
                `${API_LINK}Pengumuman/DetailPengumuman/${decryptIdUrl(id)}`,
                {},
                "GET"
            );

            if (!res) throw new Error("Data tidak ditemukan");

            setData({
                ...res,
                subject: res.subyekPengumuman,
                content: res.isiPengumuman
            });

        } catch (err) {
            console.error(err);
            Toast.error("Gagal memuat data: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }

        loadData();
    }, [ssoData, router, loadData]);

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
                { label: "Daftar Pengumuman", href: "/pages/daftar-pengumuman" },
                { label: "Detail" },
            ]}
        >
            <style dangerouslySetInnerHTML={{
                __html: `
            .announcement-content img {
            max-width: 100% !important;
            height: auto !important;
            display: block;
            }
            .announcement-content figure {
            max-width: 100% !important;
            }
        `}} />

            <div className="bg-white p-4 rounded border shadow-sm">
                {data && (
                    <div className="mb-4">
                        <h5 className="text-primary mb-3 pb-2 border-bottom">
                            Detail Pengumuman
                        </h5>
                        <div className="row">
                            <DetailItem
                                label="Subyek Pengumuman"
                                value={data.subject}
                            />
                            <DetailItem
                                label="Isi Pengumuman"
                                value={data.content}
                                isHtml={true}
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
                                type="button"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </MainContent>
    );
}
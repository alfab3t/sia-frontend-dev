"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import MainContent from "@/components/layout/MainContent";
import fetchData from "@/lib/fetch";
import { API_LINK } from "@/lib/constant";
import Toast from "@/components/common/Toast";
import { getSSOData, getUserData } from "@/context/user";
import Label from "@/components/common/Label";
import Button from "@/components/common/Button";
import { decryptIdUrl, encryptIdUrl } from "@/lib/encryptor";
import Badge from "@/components/common/Badge";
import PropTypes from "prop-types";

const DetailItem = ({ label, value }) => (
    <div className="col-lg-4 mb-3">
        <div className="detail-item">
            <Label text={label} className="mb-1" />
            <div className="fw-medium">
                {value !== null && value !== undefined && value !== ""
                    ? value
                    : "-"}
            </div>
        </div>
    </div>
);

DetailItem.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
};

export default function DetailIndustriPage() {
    const router = useRouter();
    const params = useParams();

    const userData = getUserData();
    const id = decryptIdUrl(params.id);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    const loadData = useCallback(async () => {
        if (!id) {
            Toast.error("ID industri tidak valid");
            setLoading(false);
            router.back();
            return;
        }

        try {
            setLoading(true);
            const response = await fetchData(
                `${API_LINK}MasterIndustri/DetailMasterIndustri/${id}`,
                {},
                "GET",
            );
            setData(response);
        } catch (err) {
            Toast.error("Gagal memuat data: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        setIsClient(true);
        const ssoData = getSSOData();

        if (!ssoData) {
            Toast.error("Sesi anda habis. Silakan login kembali.");
            router.push("/auth/login");
            return;
        }

        loadData();
    }, [loadData, router]);

    const handleBack = useCallback(() => {
        router.push("/pages/praktik-kerja-industri/master-industri");
    }, [router]);

    const handleEdit = useCallback(() => {
        router.push(
            `/pages/praktik-kerja-industri/master-industri/edit/${encryptIdUrl(
                id,
            )}`,
        );
    }, [router, id]);

    return (
        <MainContent
            layout="Admin"
            loading={loading}
            title="Detail Master Industri"
            breadcrumb={[
                { label: "Beranda", href: "/" },
                { label: "Praktik Kerja Industri" },
                {
                    label: "Master Industri",
                    href: "/pages/praktik-kerja-industri/master-industri",
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
                                        label="Nama Industri"
                                        value={data.namaIndustri}
                                    />
                                    <DetailItem
                                        label="Cabang"
                                        value={data.cabang}
                                    />
                                    <DetailItem
                                        label="Grup Industri"
                                        value={data.grup}
                                    />
                                    <DetailItem
                                        label="Alamat"
                                        value={data.alamat}
                                    />
                                    <DetailItem
                                        label="Telepon"
                                        value={data.telepon}
                                    />
                                    <DetailItem label="Fax" value={data.fax} />
                                    <DetailItem
                                        label="Status"
                                        value={<Badge status={data.status} />}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <h5 className="text-primary mb-3 pb-2 border-bottom">
                                    Informasi PIC
                                </h5>
                                <div className="row">
                                    <DetailItem
                                        label="Nama PIC"
                                        value={data.pic}
                                    />
                                    <DetailItem
                                        label="Telepon PIC"
                                        value={data.teleponPIC}
                                    />
                                    <DetailItem
                                        label="Email PIC"
                                        value={data.emailPIC}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <h5 className="text-primary mb-3 pb-2 border-bottom">
                                    Informasi Atasan
                                </h5>
                                <div className="row">
                                    <DetailItem
                                        label="Nama Atasan"
                                        value={data.namaPICAtasan}
                                    />
                                    <DetailItem
                                        label="Telepon Atasan"
                                        value={data.teleponPICAtasan}
                                    />
                                    <DetailItem
                                        label="Email Atasan"
                                        value={data.emailPICAtasan}
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
                                />
                                {isClient &&
                                    userData?.permission?.includes(
                                        "master_industri.edit",
                                    ) && (
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

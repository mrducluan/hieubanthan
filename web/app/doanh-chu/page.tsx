// Trang Studio Doanh Chủ (/doanh-chu) — Bản đồ 5 Hành & Ma trận phối hợp 2 chiều cho Chủ doanh nghiệp.
// Không lưu dữ liệu trên máy chủ, nhân sự tự xác nhận qua mã mã hóa AES-256-GCM → noindex như /gia-dinh.
import type { Metadata } from "next";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { StudioDoanhChu } from "@/components/doanh-chu/StudioDoanhChu";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";

export const metadata: Metadata = {
  title: CHU_DOANH_CHU.meta.tieu_de,
  description: CHU_DOANH_CHU.meta.mo_ta,
  alternates: { canonical: "/doanh-chu" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <TieuDeMuc
        cap={1}
        nho={CHU_DOANH_CHU.dau_trang.nho}
        lon={CHU_DOANH_CHU.dau_trang.lon}
        mo_ta={CHU_DOANH_CHU.dau_trang.mo_ta}
      />
      <div className="mt-6">
        <StudioDoanhChu />
      </div>
    </div>
  );
}

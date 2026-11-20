// Trang Bản đồ Đội ngũ (/ban-do-doi-ngu) — giúp chủ doanh nghiệp & quản lý nhìn rõ 5 hành đội ngũ và cách phối hợp 2 chiều.
// Không lưu ngày sinh trên máy chủ → noindex như /gia-dinh.
import type { Metadata } from "next";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { StudioDoanhChu } from "@/components/doanh-chu/StudioDoanhChu";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";

export const metadata: Metadata = {
  title: CHU_DOANH_CHU.meta.tieu_de,
  description: CHU_DOANH_CHU.meta.mo_ta,
  alternates: { canonical: "/ban-do-doi-ngu" },
  robots: { index: true, follow: true },
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

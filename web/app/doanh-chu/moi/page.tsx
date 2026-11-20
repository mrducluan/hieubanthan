// Trang nhân sự tự xác nhận đồng ý (/doanh-chu/moi?ma=...) theo Nghị định 13/2023/NĐ-CP.
// Xác thực chữ ký HMAC của mã mời phía server; ngày sinh nhân sự được mã hóa AES-256-GCM, không lưu DB.
import type { Metadata } from "next";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { XacNhanThanhVien } from "@/components/doanh-chu/XacNhanThanhVien";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";
import { docLoiMoiDoiNgu } from "@/lib/doanh-chu-ma";

export const metadata: Metadata = {
  title: CHU_DOANH_CHU.meta.moi_tieu_de,
  description: CHU_DOANH_CHU.meta.moi_mo_ta,
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ma) ? sp.ma[0] : sp.ma;
  const moi = raw ? docLoiMoiDoiNgu(raw) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <TieuDeMuc
        cap={1}
        nho={CHU_DOANH_CHU.trang_moi.nho}
        lon={CHU_DOANH_CHU.trang_moi.tieu_de}
      />
      <div className="mt-6">
        {moi && raw ? (
          <XacNhanThanhVien maMoi={raw} tenNhom={moi.ten_nhom} />
        ) : (
          <div className="rounded-2xl border border-[#ef8a6f]/45 bg-[#ef8a6f]/10 p-5 text-sm text-[#ef8a6f]">
            {CHU_DOANH_CHU.trang_moi.link_loi}
          </div>
        )}
      </div>
    </div>
  );
}

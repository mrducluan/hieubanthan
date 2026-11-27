// Trang "/co-van": Cố vấn liên mảng Tam Tài — ba cách xem đọc riêng (Nhân · Thiên · Địa), không gộp mức, miễn phí.
import type { Metadata } from "next";
import { DuongDan } from "@/components/khung/DuongDan";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhungTrangCoVan } from "@/components/co-van/KhungTrangCoVan";

export const metadata: Metadata = {
  title: "Cố vấn Tam Tài: hỏi một quyết định, xem ba cách nhìn",
  description: "Nêu điều bạn đang cân nhắc và ngày sinh: hệ thống đọc riêng sức của chính bạn (Bát tự, thần số), thời điểm (Tử vi, lịch 12 tháng) và không gian (phong thuỷ), không gộp thành một kết luận chung.",
  alternates: { canonical: "/co-van" },
  robots: { index: false, follow: true },
};

export default function CoVanPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <DuongDan ds={[{ ten: "Trang chủ", duong: "/" }, { ten: "Cố vấn Tam Tài", duong: "/co-van" }]} />
      <TieuDeMuc
        cap={1}
        nho="Cố vấn liên mảng · Nhân – Thiên – Địa"
        lon="Hỏi một quyết định, xem ba cách nhìn"
        mo_ta="Nêu điều bạn đang cân nhắc và ngày sinh (chưa biết giờ sinh vẫn xem được). Ba cách xem đọc riêng: sức của chính bạn, thời điểm và không gian — khi chúng nói khác nhau, trang nói rõ chứ không chọn thay bạn. Miễn phí, không lưu."
      />
      <div className="mt-6">
        <KhungTrangCoVan />
      </div>
    </div>
  );
}

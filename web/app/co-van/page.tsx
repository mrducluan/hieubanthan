// Chặng 2 — Trang "/co-van": Cổng Cố vấn Liên mảng Tam Tài (Nhân · Thiên · Địa, thích nghi 3 Bậc đầu vào, 0% ngõ cụt).
import type { Metadata } from "next";
import { DuongDan } from "@/components/khung/DuongDan";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { CongCoVanTamTai } from "@/components/co-van/CongCoVanTamTai";

export const metadata: Metadata = {
  title: "Cố vấn Tam Tài liên mảng: Hỏi quyết định công việc, tiền bạc, nhà cửa & tình cảm",
  description: "Đặt một câu hỏi thực tế, hệ thống đồng thời đối chiếu Nội lực (Bát tự & Thần số), Thời điểm (Tử vi & Nhịp 12 tháng) và Không gian (Phong thuỷ Vận 9 & Hoàng lịch) mà không tự mâu thuẫn.",
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
        lon="Cố vấn Tam Tài cho quyết định của bạn"
        mo_ta="Không cần biết mình phải tra Tử vi, Bát tự hay Phong thuỷ trước: chỉ cần nêu điều bạn đang cân nhắc và ngày sinh (chưa biết giờ sinh vẫn tính ngay bằng Tam Trụ chuẩn). Ba trụ độc lập soi rõ sức bền nội lực, cửa sổ thời điểm và đòn bẩy không gian."
      />
      <div className="mt-6">
        <CongCoVanTamTai macDinhCheDo="doi_song" />
      </div>
    </div>
  );
}

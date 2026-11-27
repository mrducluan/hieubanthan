// Trang "/chiem-tinh": Bản đồ sao Chiêm tinh phương Tây tất định (NASA JPL DE441) & Cầu nối Đông–Tây.
import type { Metadata } from "next";
import { DuongDan } from "@/components/khung/DuongDan";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhungChiemTinh } from "@/components/chiem-tinh/KhungChiemTinh";

export const metadata: Metadata = {
  title: "Bản đồ sao Chiêm tinh phương Tây & Cầu nối Đông – Tây",
  description: "Lập bản đồ sao Natal 12 Cung Hoàng đạo, 12 Nhà (Whole Sign / Placidus), vận hạn Saturn Return & Transit theo lịch thiên văn NASA JPL DE441, kèm đối chiếu độc lập với Bát tự và Tử vi.",
  alternates: { canonical: "/chiem-tinh" },
  robots: { index: false, follow: true },
};

export default function ChiemTinhPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <DuongDan ds={[{ ten: "Trang chủ", duong: "/" }, { ten: "Chiêm tinh phương Tây & Cầu nối Đông – Tây", duong: "/chiem-tinh" }]} />
      <TieuDeMuc
        cap={1}
        nho="Chiêm tinh phương Tây tất định · Cầu nối Đông – Tây"
        lon="Bản đồ sao Hoàng đạo & Vận hạn Hành tinh"
        mo_ta="Tính chính xác vị trí biểu kiến 10 hành tinh, La Hầu – Kế Đô, Chiron, Cung Mọc và 12 Nhà từ lịch thiên văn công cộng NASA JPL DE441 (sai số dưới 0,25 phút cung). Chưa biết giờ sinh vẫn xem được bản đồ Mặt Trời trung thực kèm biên độ Mặt Trăng."
      />
      <div className="mt-6">
        <KhungChiemTinh />
      </div>
    </div>
  );
}

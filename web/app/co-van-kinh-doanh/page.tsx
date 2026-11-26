// Chặng 2 — Trang "/co-van-kinh-doanh": Không gian riêng cho Chủ cơ sở & Co-founder (Cố vấn Tam Tài · Góp vốn · Bàn cờ E2EE).
// Đặt noindex để bảo vệ tính riêng tư của bàn cờ mã hoá trên máy và không trùng lặp từ khoá SEO với /quan-ly-nhan-su.
import type { Metadata } from "next";
import { DuongDan } from "@/components/khung/DuongDan";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhungCoVanKinhDoanh } from "@/components/co-van/KhungCoVanKinhDoanh";

export const metadata: Metadata = {
  title: "Cố vấn Kinh doanh & Bàn cờ Co-founder (Mã hoá đầu-cuối)",
  description: "Không gian riêng cho chủ doanh nghiệp và người đồng sáng lập: cân nhắc quyết định bung vốn, phân vai hội đồng góp vốn 2–4 người và lưu bàn cờ đối tác mã hoá AES-GCM 256-bit.",
  alternates: { canonical: "/co-van-kinh-doanh" },
  robots: { index: false, follow: true },
};

export default function CoVanKinhDoanhPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <DuongDan ds={[{ ten: "Trang chủ", duong: "/" }, { ten: "Cố vấn Tam Tài", duong: "/co-van" }, { ten: "Không gian Kinh doanh", duong: "/co-van-kinh-doanh" }]} />
      <TieuDeMuc
        cap={1}
        nho="Chủ cơ sở & Đồng sáng lập · Zero-Knowledge E2EE"
        lon="Không gian Cố vấn Kinh doanh & Phân vai Góp vốn"
        mo_ta="Hợp nhất 3 góc nhìn cho quyết định làm ăn lớn: đối chiếu Tam Tài trước khi xuống tiền, soi bù khuyết hội đồng sáng lập 2–4 người (Mở thị trường · Tài chính · Vận hành) và cất danh sách đối tác bằng mã hoá AES-GCM 256-bit ngay trên trình duyệt."
      />
      <div className="mt-6">
        <KhungCoVanKinhDoanh />
      </div>
    </div>
  );
}

// Chặng 2 — Trang "/co-van-kinh-doanh": Không gian riêng cho Chủ cơ sở & Co-founder (Cố vấn Tam Tài · Góp vốn · Sổ nháp trên máy).
// Đặt noindex và không trùng lặp từ khoá SEO với /quan-ly-nhan-su.
import type { Metadata } from "next";
import { DuongDan } from "@/components/khung/DuongDan";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhungCoVanKinhDoanh } from "@/components/co-van/KhungCoVanKinhDoanh";

export const metadata: Metadata = {
  title: "Cố vấn kinh doanh: góp vốn, mặt bằng & sổ nháp đối tác",
  description: "Không gian cho chủ cơ sở và người định góp vốn: hỏi một quyết định kinh doanh, xem vai trò thiên hướng của 2–4 người góp vốn và giữ sổ nháp đối tác, mặt bằng trên máy.",
  alternates: { canonical: "/co-van-kinh-doanh" },
  robots: { index: false, follow: true },
};

export default function CoVanKinhDoanhPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <DuongDan ds={[{ ten: "Trang chủ", duong: "/" }, { ten: "Hỏi một quyết định", duong: "/co-van" }, { ten: "Không gian Kinh doanh", duong: "/co-van-kinh-doanh" }]} />
      <TieuDeMuc
        cap={1}
        nho="Chủ cơ sở & người định góp vốn"
        lon="Cố vấn kinh doanh & khi góp vốn với người khác"
        mo_ta="Ba việc trước một quyết định làm ăn: hỏi quyết định qua ba cách xem riêng, xem mỗi người góp vốn nghiêng về khâu nào (mở thị trường · giữ tiền · vận hành) và ghi sổ nháp đối tác, mặt bằng trên trình duyệt này."
      />
      <div className="mt-6">
        <KhungCoVanKinhDoanh />
      </div>
    </div>
  );
}

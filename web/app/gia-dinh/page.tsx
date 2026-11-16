// GD-1 đợt 1 (2026-11-16) — "Nhà mình": hồ sơ gia đình trên máy + bảng năm của cả nhà. Trang cá nhân (nội dung theo dữ liệu
// trên máy) → noindex. Khâu QUAY LẠI (mỗi năm, mỗi dịp Tết) + nền cho MỜI ở đợt 2.
import type { Metadata } from "next";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { BangNhaMinh } from "@/components/gia-dinh/BangNhaMinh";

export const metadata: Metadata = {
  title: "Nhà mình: năm nay cả nhà cần để ý gì",
  description: "Thêm người nhà để xem năm nay của cả nhà theo tập quán: tuổi hợp nhau, Tam tai, năm tuổi, hướng chung trong nhà và việc nên làm.",
  alternates: { canonical: "/gia-dinh" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl">
      <TieuDeMuc cap={1} nho="Hồ sơ gia đình" lon="Nhà mình: năm nay cả nhà cần để ý gì?"
        mo_ta="Thêm người nhà chỉ với năm sinh. Bảng cho biết ai đang năm tuổi, Tam tai, những cặp tuổi dễ đồng lòng hay dễ trái nhịp, hướng chung trong nhà và việc nên làm cho từng người." />
      <div className="mt-6"><BangNhaMinh /></div>
    </div>
  );
}

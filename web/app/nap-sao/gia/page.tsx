// /nap-sao/gia?ma= — trang của CỔNG GIẢ (chỉ khi THANH_TOAN_GIA=1, không production): bấm để giả lập "đã trả".
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { choPhepCongGia } from "@/lib/thanh-toan/cong";
import { CongGia } from "./CongGia";

export const metadata: Metadata = { title: "Cổng thanh toán thử", robots: { index: false, follow: false } };

export default function Page() {
  if (!choPhepCongGia()) notFound();
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="font-serif text-3xl">Cổng thanh toán thử</h1>
      <p className="mt-2 text-sm text-fg-muted">Không thu tiền thật. Dùng để thử trọn luồng nạp Sao trên bản xem trước.</p>
      <Suspense><CongGia /></Suspense>
    </div>
  );
}

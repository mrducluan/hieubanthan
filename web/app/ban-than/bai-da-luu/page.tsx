import type { Metadata } from "next";
import { Suspense } from "react";
import { KhungTai } from "@/components/khung/TieuDe";
import { BaiDaLuu } from "./BaiDaLuu";

// LG-ĐS — bài luận người dùng tự lưu vào tài khoản. Trang riêng tư: không index, không vào sitemap.
export const metadata: Metadata = {
  title: "Bài đã lưu",
  description: "Các bài luận giải bạn đã lưu vào tài khoản.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/ban-than/bai-da-luu" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl sm:text-4xl">Bài đã lưu</h1>
      <p className="mt-2 text-sm text-fg-muted" data-testid="giai-thich-luu">Bài lưu 12 tháng, chỉ bạn xem được, xoá ngay khi bạn bấm.</p>
      <Suspense fallback={<KhungTai />}>
        <BaiDaLuu />
      </Suspense>
    </div>
  );
}

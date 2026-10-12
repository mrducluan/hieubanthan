// /nap-sao/ket-qua?ma= — người mua quay về từ cổng. Trang tự hỏi trạng thái đơn (máy chủ tra cổng nếu webhook chưa tới).
import type { Metadata } from "next";
import { Suspense } from "react";
import { KetQua } from "./KetQua";

export const metadata: Metadata = { title: "Kết quả nạp Sao", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <h1 className="font-serif text-3xl sm:text-4xl">Kết quả nạp Sao</h1>
      <Suspense><KetQua /></Suspense>
    </div>
  );
}

// SAO-CG (0029) — /tai-khoan/cau-hoi: câu hỏi chuyên gia của chính người dùng (RLS chủ sở hữu): trạng thái, hạn trả lời
// (trung tính), câu trả lời, đánh giá 1–5, huỷ khi còn chờ thanh toán. Trang cá nhân → noindex (robots cũng chặn /tai-khoan).
import type { Metadata } from "next";
import { Suspense } from "react";
import { CauHoiCuaToi } from "./CauHoiCuaToi";

export const metadata: Metadata = { title: "Câu hỏi của tôi", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Tài khoản</p>
      <h1 className="mt-2 text-4xl">Câu hỏi của tôi</h1>
      <p className="mt-3 text-fg-muted">Câu hỏi bạn đã gửi chuyên gia và câu trả lời. Chỉ bạn đọc được; xoá tài khoản là xoá hết.</p>
      <Suspense><CauHoiCuaToi /></Suspense>
    </div>
  );
}

// Lỗi khi ký mã link / thẻ chia sẻ (route /api/chia-se/*) — chỉ chạy ở MÁY CHỦ.
// Người dùng chỉ thấy câu thường; tên biến môi trường, chi tiết kiểm dữ liệu chỉ vào log máy chủ + Sentry (lib/giam-sat).
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";

/** Câu báo cho người dùng khi chưa ký được link (thiếu khoá ký, lỗi bất ngờ…). */
export const LOI_TAO_LINK = "Chưa tạo được link lúc này, bạn thử lại sau nhé.";

/** Ghi lỗi gốc vào log + Sentry (kèm tên tính năng), trả câu người dùng — giữ mã 502 như trước. */
export function traLoiChiaSe(loi: unknown, tinhNang: string, cau: string = LOI_TAO_LINK): NextResponse {
  console.error(`[chia-se/${tinhNang}]`, loi instanceof Error ? loi.message : loi);
  baoLoi(loi, { tinh_nang: `chia_se_${tinhNang}` });
  return NextResponse.json({ error: cau }, { status: 502 });
}

// GET /api/chuyen-gia/thong-tin — công tắc, giá, giảm lần đầu, hạn trả lời (SQL chuyen_gia_thong_tin, 0029) + cổng thanh toán
// đang bật. Gửi kèm access token (Authorization) thì có thêm "lần đầu" / số câu đang chờ / lượt hội viên của CHÍNH người đó.
import { NextResponse } from "next/server";
import { thongTinChuyenGia } from "@/lib/chuyen-gia-may-chu";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return NextResponse.json(await thongTinChuyenGia(req), { headers: { "cache-control": "private, no-store" } });
}

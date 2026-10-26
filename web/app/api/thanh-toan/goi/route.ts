// GET /api/thanh-toan/goi — gói Sao đang bán + cổng đang bật + giá 1 báo cáo (để ghi "≈ N báo cáo") + thông tin tặng
// lần nạp đầu (SAO-ND, 0027). Gửi kèm access token (Authorization) thì nap_dau.lan_dau là của chính người đó; không có thì
// null. Không có dữ liệu riêng nào khác.
import { NextResponse } from "next/server";
import { layCauHinh } from "@/lib/cau-hinh";
import { congDangBat, dsGoiSao, napDauThongTin } from "@/lib/thanh-toan/cong";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const [goi, nap_dau, gia_bao_cao] = await Promise.all([
    dsGoiSao(), napDauThongTin(req), layCauHinh<number>("luan_giai.gia_sao").catch(() => 10),
  ]);
  return NextResponse.json({ goi, cong: congDangBat(), gia_bao_cao, nap_dau },
    { headers: { "cache-control": "private, no-store" } });
}

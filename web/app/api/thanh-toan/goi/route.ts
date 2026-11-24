// GET /api/thanh-toan/goi — gói Sao đang bán + cổng đang bật + giá 1 báo cáo (để ghi "≈ N báo cáo") + thông tin tặng
// lần nạp đầu (SAO-ND, 0027). Gửi kèm access token (Authorization) thì nap_dau.lan_dau là của chính người đó; không có thì
// null. SAO-HV (0028): kèm hoi_vien {bat, gia_vnd, sao_thang, dang_la…} từ hoi_vien_cua_toi (có token → của chính người đó).
// Không có dữ liệu riêng nào khác.
import { NextResponse } from "next/server";
import { layCauHinh } from "@/lib/cau-hinh";
import { congDangBat, dsGoiSao, hoiVienThongTin, napDauThongTin } from "@/lib/thanh-toan/cong";
import { locGoiLanDau } from "@/lib/thanh-toan/nap-dau";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const [goi, nap_dau, gia_bao_cao, hoi_vien] = await Promise.all([
    dsGoiSao(), napDauThongTin(req), layCauHinh<number>("luan_giai.gia_sao").catch(() => 10), hoiVienThongTin(req),
  ]);
  // CRO-1: gói Lần đầu chỉ cho tài khoản chưa từng nạp — ẩn khi biết chắc đã nạp (SQL vẫn chặn lúc tạo đơn).
  return NextResponse.json({ goi: locGoiLanDau(goi, nap_dau as { lan_dau: boolean | null } | null), cong: congDangBat(), gia_bao_cao, nap_dau, hoi_vien },
    { headers: { "cache-control": "private, no-store" } });
}

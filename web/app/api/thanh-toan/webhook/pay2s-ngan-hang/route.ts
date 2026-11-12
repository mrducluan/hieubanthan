// POST /api/thanh-toan/webhook/pay2s-ngan-hang — webhook giao dịch NGÂN HÀNG của Pay2S (Open Banking): mỗi khoản tiền
// vào tài khoản liên kết. Đường báo tiền thứ HAI cạnh IPN: bắt được cả khi IPN lỡ, hay khách tự chuyển khoản đúng nội
// dung sau khi trang thanh toán đã đóng. Chỉ tin token của Hook (Authorization: Bearer, env PAY2S_HOOK_TOKEN).
// Khoản VÀO có nội dung chứa mã đơn (HBT + số) → hàm SQL nap_sao_tu_cong (idempotent theo mã đơn, tự so số tiền với đơn;
// IPN và webhook cùng báo một đơn thì chỉ cộng một lần). Khoản không mang mã đơn → bỏ qua (tiền ủng hộ, tiền khác).
// Pay2S dừng gửi lại khi nhận 200 / {"success": true}; lỗi DB → 500 để Pay2S gửi lại (tối đa 5 lần, mỗi 60 giây).
import { NextResponse } from "next/server";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { cauHinhPay2s, docHook, dungTokenHook, maDonTrongNoiDung } from "@/lib/thanh-toan/pay2s";

const TRAN_BYTE = 65_536;

export async function POST(req: Request) {
  if (!cauHinhPay2s()) return NextResponse.json({ success: false, error: "Chưa bật Pay2S" }, { status: 503 });
  if (!dungTokenHook(req.headers.get("authorization"))) return NextResponse.json({ success: false }, { status: 401 });
  const tho = await req.text().catch(() => "");
  if (!tho || Buffer.byteLength(tho) > TRAN_BYTE) return NextResponse.json({ success: false }, { status: 400 });
  let body: unknown;
  try { body = JSON.parse(tho); } catch { return NextResponse.json({ success: false }, { status: 400 }); }
  const ds = docHook(body);
  if (!ds) return NextResponse.json({ success: false }, { status: 400 });
  const can = ds.map((g) => ({ g, maDon: g.vao ? maDonTrongNoiDung(g.noiDung) : null })).filter((x) => x.maDon !== null);
  if (!can.length) return NextResponse.json({ success: true, bo_qua: ds.length });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ success: false, error: "Chưa cấu hình máy chủ" }, { status: 503 });
  const ket_qua: string[] = [];
  for (const { g, maDon } of can) {
    const { data, error } = await dv.rpc("nap_sao_tu_cong", {
      p_ma_don: maDon, p_so_tien: g.amount, p_cong: "pay2s", p_ma_giao_dich: `p2s-nh:${g.id}`.slice(0, 100),
    });
    if (error) return NextResponse.json({ success: false, error: "Chưa ghi được" }, { status: 500 });
    ket_qua.push((data as { ket_qua?: string } | null)?.ket_qua ?? "");
  }
  return NextResponse.json({ success: true, ket_qua });
}

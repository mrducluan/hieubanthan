// POST /api/thanh-toan/webhook/pay2s — IPN của Pay2S báo đã nhận tiền. CHỈ tin chữ ký m2signature (HMAC secret key) +
// đúng partnerCode; không tin tham số URL quay về của trình duyệt. Số tiền được hàm SQL so với đơn (lấy từ goi_sao lúc
// tạo) → sai thì không cộng Sao. Pay2S cần 200 + {"success": true} trong 30 giây, không thì gửi lại tối đa 5 lần.
import { NextResponse } from "next/server";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { cauHinhPay2s, kiemIpn } from "@/lib/thanh-toan/pay2s";

const TRAN_BYTE = 16_384;

export async function POST(req: Request) {
  const c = cauHinhPay2s();
  if (!c) return NextResponse.json({ success: false, error: "Chưa bật Pay2S" }, { status: 503 });
  const tho = await req.text().catch(() => "");
  if (!tho || Buffer.byteLength(tho) > TRAN_BYTE) return NextResponse.json({ success: false }, { status: 400 });
  let body: unknown;
  try { body = JSON.parse(tho); } catch { return NextResponse.json({ success: false }, { status: 400 }); }
  const d = kiemIpn(body, c);
  if (!d) return NextResponse.json({ success: false, error: "Sai chữ ký" }, { status: 401 });
  // Chữ ký đúng nhưng giao dịch không thành công → xác nhận đã nhận để Pay2S không gửi lại, không cộng gì.
  if (d.resultCode !== 0) return NextResponse.json({ success: true, bo_qua: "khong_thanh_cong" });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ success: false, error: "Chưa cấu hình máy chủ" }, { status: 503 });
  const { data, error } = await dv.rpc("nap_sao_tu_cong", {
    p_ma_don: d.maDon, p_so_tien: d.amount, p_cong: "pay2s", p_ma_giao_dich: `p2s:${d.transId}`.slice(0, 100),
  });
  // Lỗi DB → 500 để Pay2S gửi lại sau.
  if (error) return NextResponse.json({ success: false, error: "Chưa ghi được" }, { status: 500 });
  return NextResponse.json({ success: true, ket_qua: (data as { ket_qua?: string } | null)?.ket_qua });
}

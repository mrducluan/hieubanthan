// POST /api/thanh-toan/webhook/payos — payOS báo đã nhận tiền. CHỈ tin chữ ký (HMAC checksum key), không tin tham
// số URL quay về. Số tiền được hàm SQL so với đơn (lấy từ goi_sao lúc tạo) → sai thì không cộng Sao.
// Trả 200 cho mọi webhook có chữ ký đúng (kể cả webhook thử của payOS khi xác nhận URL) để cổng không gửi lại mãi.
import { NextResponse } from "next/server";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { cauHinhPayos, kiemWebhook } from "@/lib/thanh-toan/payos";

export async function POST(req: Request) {
  const c = cauHinhPayos();
  if (!c) return NextResponse.json({ error: "Chưa bật payOS" }, { status: 503 });
  const d = kiemWebhook(await req.json().catch(() => null), c.checksumKey);
  if (!d) return NextResponse.json({ error: "Sai chữ ký" }, { status: 401 });
  if (d.code !== "00" || !Number.isSafeInteger(d.orderCode)) return NextResponse.json({ ok: true, bo_qua: "khong_thanh_cong" });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ error: "Chưa cấu hình máy chủ" }, { status: 503 });
  const { data, error } = await dv.rpc("nap_sao_tu_cong", {
    p_ma_don: d.orderCode, p_so_tien: d.amount, p_cong: "payos", p_ma_giao_dich: String(d.reference ?? "").slice(0, 100),
  });
  // Lỗi DB → 500 để payOS gửi lại sau.
  if (error) return NextResponse.json({ error: "Chưa ghi được" }, { status: 500 });
  return NextResponse.json({ ok: true, ket_qua: (data as { ket_qua?: string })?.ket_qua });
}

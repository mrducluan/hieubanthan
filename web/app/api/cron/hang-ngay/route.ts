// GET /api/cron/hang-ngay — cron ngày duy nhất (Vercel Hobby chỉ cho 2 cron): 8:03 sáng giờ VN gửi nhắc Web Push
// (KC-4 GĐ1) rồi dọn dữ liệu học hết hạn. Vercel Cron gửi Bearer CRON_SECRET. Từng việc chạy tay: /api/cron/nhac-day,
// /api/cron/don-du-lieu-hoc.
import { NextResponse } from "next/server";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { donDuLieuHoc, dungKhoaCron, guiNhacNgay } from "@/lib/cron";

export const maxDuration = 60;

export async function GET(req: Request) {
  if (!dungKhoaCron(req)) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ error: "Chưa cấu hình" }, { status: 503 });
  const nhac = await guiNhacNgay(dv);
  const don = await donDuLieuHoc(dv);
  return NextResponse.json({ nhac, don: don.ket_qua }, { status: don.ok ? 200 : 502 });
}

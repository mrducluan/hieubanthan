// GET /api/cron/nhac-day — KC-4 GĐ1: gửi Web Push cho người có mốc nhac_viec đúng hôm nay (chạy tay; lịch ngày ở
// /api/cron/hang-ngay). Bearer CRON_SECRET. Nội dung chỉ nhãn do engine soạn + đường dẫn trong site.
import { NextResponse } from "next/server";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { dungKhoaCron, guiNhacNgay } from "@/lib/cron";

export const maxDuration = 60;

export async function GET(req: Request) {
  if (!dungKhoaCron(req)) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ error: "Chưa cấu hình (Supabase service role)" }, { status: 503 });
  const kq = await guiNhacNgay(dv);
  return NextResponse.json(kq, { status: kq.loi ? 502 : 200 });
}

// GET /api/cron/don-du-lieu-hoc — xoá thật dữ liệu học hết hạn (chạy tay; lịch ngày ở /api/cron/hang-ngay).
// Vercel Cron / người vận hành gửi Bearer CRON_SECRET.
import { NextResponse } from "next/server";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { donDuLieuHoc, dungKhoaCron } from "@/lib/cron";

export async function GET(req: Request) {
  if (!dungKhoaCron(req)) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ error: "Chưa cấu hình" }, { status: 503 });
  const { ok, ket_qua } = await donDuLieuHoc(dv);
  return NextResponse.json(ket_qua, { status: ok ? 200 : 502 });
}

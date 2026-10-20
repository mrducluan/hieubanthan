// GET /api/cron/don-du-lieu-hoc — TS-V3 tầng HỌC: xoá thật dữ liệu học hết hạn (góp ý > 12 tháng, ký ức > 180 ngày, mẫu
// ghi chú cụm cũ > 12 tháng) — đúng thời hạn ghi trong Chính sách quyền riêng tư. Vercel Cron gửi Bearer CRON_SECRET.
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { khachDichVu } from "@/lib/thanh-toan/cong";

function dungKhoa(req: Request): boolean {
  const bi = process.env.CRON_SECRET;
  const dua = req.headers.get("authorization") ?? "";
  if (!bi || bi.length < 16) return false;
  const a = Buffer.from(dua), b = Buffer.from(`Bearer ${bi}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!dungKhoa(req)) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  const dv = khachDichVu();
  if (!dv) return NextResponse.json({ error: "Chưa cấu hình" }, { status: 503 });
  const { data, error } = await dv.rpc("don_du_lieu_hoc");
  if (error) return NextResponse.json({ error: "Chưa dọn được (chạy migration 0016?)" }, { status: 502 });
  return NextResponse.json(data);
}

// GET /api/thanh-toan/doi-soat — đối soát đơn payOS còn "chờ" (2 phút – 3 ngày tuổi), phòng webhook lỡ.
// Gọi bằng cron (Vercel Cron gửi Authorization: Bearer CRON_SECRET) hoặc tay. Thiếu CRON_SECRET → khoá.
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { khachDichVu } from "@/lib/thanh-toan/cong";
import { doiSoatMotDon } from "@/lib/thanh-toan/doi-soat";

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
  const { data, error } = await dv.rpc("don_cho_doi_soat", { p_gioi_han: 100 });
  if (error) return NextResponse.json({ error: "Chưa đọc được đơn" }, { status: 502 });
  let da_nap = 0;
  for (const d of (data ?? []) as { ma_don: number; cong: string }[]) {
    if (d.cong === "payos" && (await doiSoatMotDon(dv, d.ma_don))) da_nap++;
  }
  return NextResponse.json({ da_xem: (data ?? []).length, da_nap });
}

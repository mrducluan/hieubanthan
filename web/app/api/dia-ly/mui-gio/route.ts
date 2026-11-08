// GET /api/dia-ly/mui-gio?mui_gio=America/Los_Angeles&ngay=1990-07-15&gio=10:00 — QTE-1 tuần 1: engine tra cơ sở dữ liệu
// múi giờ (lịch sử giờ mùa hè từng nước) → múi giờ chuẩn + có giờ mùa hè không. Web chỉ hiển thị và điền vào hồ sơ.
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;
const MUI_GIO = /^[A-Za-z]+\/[A-Za-z_]+$/;

export async function GET(req: Request): Promise<NextResponse> {
  const q = new URL(req.url).searchParams;
  const mg = q.get("mui_gio") ?? "", ngay = q.get("ngay") ?? "", gio = q.get("gio") ?? "";
  if (!MUI_GIO.test(mg) || mg.length > 40 || !/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !/^\d{2}:\d{2}$/.test(gio)) {
    return NextResponse.json({ error: "Thiếu thành phố, ngày hoặc giờ sinh." }, { status: 422 });
  }
  try {
    const r = await fetch(`${ENGINE_URL}/v1/dia-ly/mui-gio?${new URLSearchParams({ mui_gio: mg, ngay, gio })}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 86_400 },
    });
    if (r.status === 422) return NextResponse.json({ error: "Chưa tính được múi giờ cho nơi này." }, { status: 422 });
    if (!r.ok) return NextResponse.json({ error: "Chưa tính được múi giờ, thử lại sau." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ error: "Chưa tính được múi giờ, thử lại sau." }, { status: 502 });
  }
}

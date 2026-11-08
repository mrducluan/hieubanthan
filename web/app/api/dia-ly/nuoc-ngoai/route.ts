// GET /api/dia-ly/nuoc-ngoai — QTE-1 tuần 1: nước + thành phố (múi giờ IANA) cho người Việt ở nước ngoài (bảng ở engine; cache 1 ngày).
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(req: Request): Promise<NextResponse> {
  const en = new URL(req.url).searchParams.get("ngon_ngu") === "en";   // QTE-1 tuần 3–4: tên tiếng Anh cho trang /en
  try {
    const r = await fetch(`${ENGINE_URL}/v1/dia-ly/nuoc-ngoai${en ? "?ngon_ngu=en" : ""}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 86_400 },
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được danh sách nước." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được danh sách nước." }, { status: 502 });
  }
}

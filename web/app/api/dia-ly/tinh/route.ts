// GET /api/dia-ly/tinh — 63 tỉnh/thành cho ô "Nơi sinh" (bảng nằm ở engine; cache 1 ngày).
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(): Promise<NextResponse> {
  try {
    const r = await fetch(`${ENGINE_URL}/v1/dia-ly/tinh`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 86_400 },
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được danh sách tỉnh." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được danh sách tỉnh." }, { status: 502 });
  }
}

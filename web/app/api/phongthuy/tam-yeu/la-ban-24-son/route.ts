// GET /api/phongthuy/tam-yeu/la-ban-24-son — vòng 24 Sơn chuẩn từ engine (Web chỉ vẽ, không tự tính độ).
import { engineTheoReq } from "@/lib/proxy";
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const nn = engineTheoReq(req, "/v1/phongthuy/tam-yeu/la-ban-24-son");
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 86_400 },
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được vòng 24 Sơn." }, { status: 502 });
    return NextResponse.json(await r.json(), {
      headers: { "cache-control": "public, max-age=3600, s-maxage=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Chưa tải được vòng 24 Sơn." }, { status: 502 });
  }
}

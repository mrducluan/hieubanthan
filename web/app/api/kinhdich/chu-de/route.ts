// GET /api/kinhdich/chu-de — KD-ĐS: danh mục chủ đề (chip) cho hỏi quẻ; nằm ở engine (KB), web chỉ hiển thị.
import { engineTheoReq } from "@/lib/proxy";
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const nn = engineTheoReq(req, "/v1/kinhdich/chu-de");
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 86_400 },
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được danh mục chủ đề." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400", vary: "x-ngon-ngu" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được danh mục chủ đề." }, { status: 502 });
  }
}

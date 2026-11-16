// POST /api/dia-ly/tim — NS-QT: gợi ý nơi sinh ngoài Việt Nam theo chữ gõ (engine tìm trong GeoNames cities15000, CC BY 4.0).
// Chữ gõ đi trong THÂN yêu cầu (không nằm trên URL → không vào nhật ký truy cập / bộ nhớ đệm CDN), không ghi lại, không gửi đo lường.
import { z } from "zod";
import { NextResponse } from "next/server";
import { engineTheoReq } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;
const Vao = z.object({ q: z.string().trim().min(2).max(40), gh: z.number().int().min(1).max(12).optional() });

export async function POST(req: Request): Promise<NextResponse> {
  const v = Vao.safeParse(await req.json().catch(() => null));
  if (!v.success) return NextResponse.json({ ket_qua: [] });
  try {
    const nn = engineTheoReq(req, `/v1/dia-ly/tim?q=${encodeURIComponent(v.data.q)}&gh=${v.data.gh ?? 8}`);
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      cache: "no-store", signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tìm được lúc này." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Chưa tìm được lúc này." }, { status: 502 });
  }
}

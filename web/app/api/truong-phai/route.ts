// GET /api/truong-phai[?ngon_ngu=en] — TP-1 sổ trường phái (mô tả, nguồn, mặc định) từ engine. Web chỉ hiển thị.
import { engineTheoReq } from "@/lib/proxy";
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const nn = engineTheoReq(req, "/v1/truong-phai");
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 3600 },
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được sổ trường phái." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=600, s-maxage=3600" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được sổ trường phái." }, { status: 502 });
  }
}

// GET /api/phongthuy/tam-yeu/so-do — sơ đồ Cửa – Chủ – Bếp (Dương Trạch Tam Yếu) từ engine.
import { engineTheoReq } from "@/lib/proxy";
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;
const QUAI_HOP_LE = new Set(["Càn", "Đoài", "Ly", "Chấn", "Tốn", "Khảm", "Cấn", "Khôn"]);

export async function GET(req: Request): Promise<NextResponse> {
  const sp = new URL(req.url).searchParams;
  const cua = sp.get("cua") ?? "";
  const chu = sp.get("chu");
  const bep = sp.get("bep");
  if (!QUAI_HOP_LE.has(cua) || (chu && !QUAI_HOP_LE.has(chu)) || (bep && !QUAI_HOP_LE.has(bep))) {
    return NextResponse.json({ error: "Quái phương vị không hợp lệ." }, { status: 422 });
  }
  const q = new URLSearchParams({ cua });
  if (chu) q.set("chu", chu);
  if (bep) q.set("bep", bep);
  try {
    const nn = engineTheoReq(req, `/v1/phongthuy/tam-yeu/so-do?${q.toString()}`);
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 86_400 },
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tra được sơ đồ Tam Yếu." }, { status: 502 });
    return NextResponse.json(await r.json(), {
      headers: { "cache-control": "public, max-age=3600, s-maxage=86400", vary: "x-ngon-ngu" },
    });
  } catch {
    return NextResponse.json({ error: "Chưa tra được sơ đồ Tam Yếu." }, { status: 502 });
  }
}

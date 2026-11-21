// GET /api/phongthuy/tam-yeu/do-hinh — mục lục 10 đồ hình lý thuyết Dương Trạch Tam Yếu (hoặc ?ma=<slug>).
import { engineTheoReq } from "@/lib/proxy";
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(req: Request): Promise<NextResponse> {
  const ma = new URL(req.url).searchParams.get("ma");
  if (ma !== null && !/^[a-z0-9_]{2,60}$/.test(ma)) {
    return NextResponse.json({ error: "Mã đồ hình không hợp lệ." }, { status: 404 });
  }
  const path = ma ? `/v1/phongthuy/tam-yeu/do-hinh/${ma}` : "/v1/phongthuy/tam-yeu/do-hinh";
  try {
    const nn = engineTheoReq(req, path);
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 86_400 },
    });
    if (r.status === 404) return NextResponse.json({ error: "Không tìm thấy đồ hình này." }, { status: 404 });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được đồ hình Tam Yếu." }, { status: 502 });
    return NextResponse.json(await r.json(), {
      headers: { "cache-control": "public, max-age=3600, s-maxage=86400", vary: "x-ngon-ngu" },
    });
  } catch {
    return NextResponse.json({ error: "Chưa tải được đồ hình Tam Yếu." }, { status: 502 });
  }
}

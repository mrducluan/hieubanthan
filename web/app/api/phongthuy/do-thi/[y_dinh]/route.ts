// GET /api/phongthuy/do-thi/{y_dinh} — UI-PT2 P6 "Chụp một góc, trả lời 3 câu": đồ thị tri thức theo ý định (engine, KB)
// → phòng cần nhìn + câu hỏi dấu hiệu nên rà. Chỉ tra KB, không nhận dữ liệu nhà, cache dài.
import { engineTheoReq } from "@/lib/proxy";
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(req: Request, ctx: { params: Promise<{ y_dinh: string }> }): Promise<NextResponse> {
  const { y_dinh } = await ctx.params;
  if (!/^[a-z_]{3,30}$/.test(y_dinh)) return NextResponse.json({ error: "Ý định không hợp lệ." }, { status: 422 });
  try {
    const nn = engineTheoReq(req, `/v1/phongthuy/do-thi/${y_dinh}`);
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 86_400 },
    });
    if (r.status === 404) return NextResponse.json({ error: "Chưa có câu hỏi cho điều này." }, { status: 404 });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được câu hỏi." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400", vary: "x-ngon-ngu" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được câu hỏi." }, { status: 502 });
  }
}

// POST /api/hop-doi/moi — người được mời xem hợp đôi: số người mời lấy TỪ MÃ ĐÃ KÝ (không tin client),
// số người được mời lấy từ bài đọc của chính họ. Engine so cặp từ số (/v1/thanso/cap-so).
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { loiEngine } from "@/lib/proxy";
import { z } from "zod";
import { docMa } from "@/lib/ma-moi";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const So = z.union([z.number().int().min(1).max(9), z.literal(11), z.literal(22), z.literal(33)]);
const Input = z.object({
  ma: z.string().min(10).max(600),
  b: z.object({ duong_doi: So, su_menh: So.optional(), linh_hon: So.optional(), nhan_cach: So.optional() }).strict(),
}).strict();

const THU_TU = ["duong_doi", "su_menh", "linh_hon", "nhan_cach"] as const;

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const nd = docMa(p.data.ma);
  if (!nd) return NextResponse.json({ error: "Lời mời không hợp lệ hoặc đã hết hạn." }, { status: 410 });
  const a = Object.fromEntries(nd.so.map((s, i) => [THU_TU[i], s]));
  try {
    const r = await fetch(`${ENGINE_URL}/v1/thanso/cap-so`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}) },
      body: JSON.stringify({ a, b: p.data.b }),
      cache: "no-store",
    });
    const body: unknown = await r.json().catch(() => null);
    if (!r.ok) { const l = loiEngine(r.status, body); return NextResponse.json({ error: l.error }, { status: l.status }); }
    return NextResponse.json(body);
  } catch (e) {
    baoLoi(e, { noi: "api", duong: new URL(req.url).pathname });
    return NextResponse.json({ error: "Không kết nối được máy tính toán." }, { status: 502 });
  }
}

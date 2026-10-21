// GET /api/y-dinh/goi-mo?ma=…&mo_dun=… — KC-3: từ điển ý định dùng chung (engine KB), gợi mở sang mảng khác. Chỉ đọc.
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(req: Request): Promise<NextResponse> {
  const u = new URL(req.url);
  const ma = u.searchParams.get("ma") ?? "", mo_dun = u.searchParams.get("mo_dun") ?? "", toi_da = u.searchParams.get("toi_da") ?? "3";
  if (!/^[a-z_]{2,40}$/.test(ma) || (mo_dun && !/^[a-z_]{2,20}$/.test(mo_dun))) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  try {
    const q = new URLSearchParams({ ma, toi_da: /^[1-6]$/.test(toi_da) ? toi_da : "3", ...(mo_dun ? { mo_dun } : {}) });
    const r = await fetch(`${ENGINE_URL}/v1/y-dinh/goi-mo?${q}`, { headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}, next: { revalidate: 86_400 } });
    if (!r.ok) return NextResponse.json({ error: "Không có gợi mở." }, { status: r.status === 404 ? 404 : 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch { return NextResponse.json({ error: "Không có gợi mở." }, { status: 502 }); }
}

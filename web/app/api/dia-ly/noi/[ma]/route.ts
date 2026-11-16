// GET /api/dia-ly/noi/{mã} — NS-QT: tên + dòng phụ + toạ độ của một nơi đã lưu trong hồ sơ (mã gn-… hoặc mã thành phố cũ),
// để form hiện lại đúng chữ khi mở hồ sơ. Mã là dữ liệu công khai (không phải chữ người dùng gõ) → cache được.
import { NextResponse } from "next/server";
import { engineTheoReq } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(req: Request, ctx: { params: Promise<{ ma: string }> }): Promise<NextResponse> {
  const { ma } = await ctx.params;
  if (!/^[a-z]{2}-[a-z0-9_]{2,40}$/.test(ma)) return NextResponse.json({ error: "Mã không hợp lệ" }, { status: 400 });
  try {
    const nn = engineTheoReq(req, `/v1/dia-ly/noi/${ma}`);
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 86_400 }, signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) return NextResponse.json({ error: "Không có nơi này" }, { status: r.status === 404 ? 404 : 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400", vary: "x-ngon-ngu" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được" }, { status: 502 });
  }
}

// GET /api/hoi/goi-y?mang=battu|tuvi — EN-AI "câu gợi ý trước, gõ tự do sau": câu chuẩn engine công bố cho chip đầu khung
// hỏi đáp (`/v1/hoi/goi-y`, theo ngôn ngữ lượt gọi). Chỉ câu trong danh mục chuẩn đã kiểm định tuyến. Engine lỗi → rỗng
// (trang giữ chip mặc định của mình).
import { NextResponse } from "next/server";
import { engineTheoReq } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;
const MANG = new Set(["battu", "tuvi"]);

export async function GET(req: Request): Promise<NextResponse> {
  const mang = new URL(req.url).searchParams.get("mang") ?? "";
  if (!MANG.has(mang)) return NextResponse.json({ cau: [] });
  try {
    const nn = engineTheoReq(req, `/v1/hoi/goi-y?mang=${mang}`);
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau }, next: { revalidate: 3600 },
    });
    const d = (r.ok ? await r.json().catch(() => null) : null) as { cau?: unknown } | null;
    const cau = Array.isArray(d?.cau) ? d.cau.filter((x): x is string => typeof x === "string" && x.length <= 120).slice(0, 6) : [];
    return NextResponse.json({ cau }, { headers: { "cache-control": "public, max-age=600" } });
  } catch {
    return NextResponse.json({ cau: [] });
  }
}

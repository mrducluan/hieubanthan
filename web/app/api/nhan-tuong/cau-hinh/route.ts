// GET /api/nhan-tuong/cau-hinh — NT-1: máy gợi ý từ ảnh có bật không (người vận hành bật ở engine; mặc định tắt).
import { engineTheoReq } from "@/lib/proxy";
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const nn = engineTheoReq(req, "/v1/nhan-tuong/cau-hinh");
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, { headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau }, next: { revalidate: 300 } });
    const d = r.ok ? ((await r.json()) as { doc_anh?: boolean }) : null;
    return NextResponse.json({ doc_anh: Boolean(d?.doc_anh) }, { headers: { "cache-control": "public, max-age=300", vary: "x-ngon-ngu" } });
  } catch {
    return NextResponse.json({ doc_anh: false });
  }
}

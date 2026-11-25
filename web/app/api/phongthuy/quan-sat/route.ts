// TY-2 — "Nhìn quanh nhà": GET danh sách câu hỏi quan sát (điều Dương Trạch Thập Thư chưa gắn dấu hiệu trong nhà),
// POST mã điều người dùng đã tích → khối "Sách xưa ghi" (khuôn SX-C). Chỉ MÃ, không chữ gõ, không địa chỉ; engine không lưu.
import { z } from "zod";
import { NextResponse } from "next/server";
import { engineTheoReq, goiEngine } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const Input = z.object({
  chon: z.array(z.string().regex(/^[a-z_]{3,40}$/)).max(60),
  nam_sinh: z.number().int().min(1900).max(2100).optional(),
  du_18: z.boolean().optional(),
}).strict();

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const nn = engineTheoReq(req, "/v1/phongthuy/quan-sat");
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 86_400 },
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được danh sách." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được danh sách." }, { status: 502 });
  }
}

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/quan-sat");
}

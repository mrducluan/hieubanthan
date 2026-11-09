// /api/tarot/la-ngay — TR-1: GET lá của ngày (chung, cache theo ngày); POST lá riêng theo ngày sinh (không lưu, không cache).
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNgonNgu, goiEngine } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request): Promise<NextResponse> {
  const ngay = new URL(req.url).searchParams.get("ngay") ?? "";
  if (!NGAY.test(ngay)) return NextResponse.json({ error: "Thiếu ngày" }, { status: 422 });
  try {
    // QTE: trang /en gửi `x-ngon-ngu: en` → lá của ngày tiếng Anh (khoá đệm riêng theo ngôn ngữ).
    const nn = dauNgonNgu(req);
    const r = await fetch(`${ENGINE_URL}/v1/tarot/la-ngay?ngay=${ngay}${nn["x-ngon-ngu"] ? "&ngon_ngu=en" : ""}`,
      { headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn }, next: { revalidate: 3600 } });
    if (!r.ok) return NextResponse.json({ error: "Chưa lấy được lá của ngày." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=600, s-maxage=3600", vary: "x-ngon-ngu" } });
  } catch {
    return NextResponse.json({ error: "Chưa lấy được lá của ngày." }, { status: 502 });
  }
}

const Input = z.object({ ngay: z.string().regex(NGAY).optional(), ngay_sinh: z.string().regex(NGAY).optional() }).strict();
export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/tarot/la-ngay");
}

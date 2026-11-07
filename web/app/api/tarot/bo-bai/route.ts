// GET /api/tarot/bo-bai — TR-1: 78 lá rút gọn + bộ, nguyên tố, trải bài, chủ đề, trường phái — nằm ở KB engine, web chỉ vẽ.
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(): Promise<NextResponse> {
  try {
    // Khoá đệm theo bản build (như /api/nhan-tuong/khao-sat): bản web mới phải thấy ngay phản hồi mới của engine.
    const ban = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "dev";
    const r = await fetch(`${ENGINE_URL}/v1/tarot/bo-bai?b=${ban}`, { headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}, next: { revalidate: 21_600 } });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được bộ bài." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=3600, s-maxage=21600" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được bộ bài." }, { status: 502 });
  }
}

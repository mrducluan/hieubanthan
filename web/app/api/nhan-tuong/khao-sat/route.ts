// GET /api/nhan-tuong/khao-sat — NT-1: bộ câu hỏi tự quan sát + bộ vị (vùng vẽ) — nằm ở KB engine, web chỉ hiển thị.
import { NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function GET(): Promise<NextResponse> {
  try {
    // Khoá đệm theo bản build: bộ đệm dữ liệu của Vercel sống qua lần deploy — bản mới (vd ANH-2 thêm `diem_do`) phải thấy
    // ngay phản hồi mới của engine, không chờ 6 giờ. Engine bỏ qua tham số lạ.
    const ban = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "dev";
    const r = await fetch(`${ENGINE_URL}/v1/nhan-tuong/khao-sat?b=${ban}`, { headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}, next: { revalidate: 21_600 } });
    if (!r.ok) return NextResponse.json({ error: "Chưa tải được bộ câu hỏi." }, { status: 502 });
    return NextResponse.json(await r.json(), { headers: { "cache-control": "public, max-age=3600, s-maxage=21600" } });
  } catch {
    return NextResponse.json({ error: "Chưa tải được bộ câu hỏi." }, { status: 502 });
  }
}

// POST /api/thanso/hoi — proxy hỏi sâu tới engine (giữ ENGINE key server-side).
import { NextResponse } from "next/server";
import { z } from "zod";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const Input = z.object({
  ho_ten: z.array(z.string().min(1)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  cau_hoi: z.string().min(3).max(400),
});

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  }
  try {
    const r = await fetch(`${ENGINE_URL}/v1/thanso/hoi`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    const body = await r.json().catch(() => null);
    if (!r.ok) {
      return NextResponse.json({ error: "Engine lỗi" }, { status: r.status });
    }
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Không kết nối được engine" }, { status: 502 });
  }
}

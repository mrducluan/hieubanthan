// Proxy mỏng web → engine cho route handler: giữ ENGINE key phía server, không tự tính gì.
import { NextResponse } from "next/server";
import type { ZodTypeAny } from "zod";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function goiEngine(req: Request, schema: ZodTypeAny, path: string): Promise<NextResponse> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  }
  try {
    const r = await fetch(`${ENGINE_URL}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    const body: unknown = await r.json().catch(() => null);
    if (!r.ok) {
      const detail =
        body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
          ? body.detail
          : "Engine lỗi";
      return NextResponse.json({ error: detail }, { status: r.status });
    }
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Không kết nối được máy tính toán. Thử lại sau." }, { status: 502 });
  }
}

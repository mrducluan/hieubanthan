// POST /api/tuvi/chart — SPEC-004a.
// Web là proxy mỏng: validate bằng zod hai chiều, gọi engine, KHÔNG tự tính gì.
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { dauNguoiGoi, loiEngine } from "@/lib/proxy";
import { ChartInput, ChartOutput } from "../schema";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function POST(req: Request): Promise<NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không phải JSON" }, { status: 400 });
  }

  const parsed = ChartInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Đầu vào không hợp lệ", chi_tiet: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  let engineRes: Response;
  try {
    engineRes = await fetch(`${ENGINE_URL}/v1/tuvi/tuan-triet`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}),
        ...dauNguoiGoi(req),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Không kết nối được máy tính toán. Thử lại sau ít phút." },
      { status: 502 },
    );
  }

  const body: unknown = await engineRes.json().catch(() => null);
  if (!engineRes.ok) {
    const l = loiEngine(engineRes.status, body);
    return NextResponse.json({ error: l.error }, { status: l.status });
  }

  // Validate output: engine đổi shape mà web chưa cập nhật → lỗi to, rõ, ngay
  // tại ranh giới — không để dữ liệu lệch schema lọt xuống UI.
  const out = ChartOutput.safeParse(body);
  if (!out.success) {
    baoLoi(new Error("engine_lech_schema"), { duong: "/api/tuvi/chart" });   // SEC-2: chi tiết chỉ gửi Sentry
    return NextResponse.json(
      { error: "Máy tính toán đang cập nhật, thử lại sau ít phút." },
      { status: 502 },
    );
  }
  return NextResponse.json(out.data);
}

// POST /api/tuvi/chart — SPEC-004a.
// Web là proxy mỏng: validate bằng zod hai chiều, gọi engine, KHÔNG tự tính gì.
import { NextResponse } from "next/server";
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
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Không kết nối được engine (port 8000)" },
      { status: 502 },
    );
  }

  const body: unknown = await engineRes.json().catch(() => null);
  if (!engineRes.ok) {
    const detail =
      body !== null && typeof body === "object" && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : engineRes.statusText;
    return NextResponse.json({ error: detail }, { status: engineRes.status });
  }

  // Validate output: engine đổi shape mà web chưa cập nhật → lỗi to, rõ, ngay
  // tại ranh giới — không để dữ liệu lệch schema lọt xuống UI.
  const out = ChartOutput.safeParse(body);
  if (!out.success) {
    return NextResponse.json(
      { error: "Output engine lệch schema — kiểm tra phiên bản hai bên",
        chi_tiet: out.error.flatten().fieldErrors },
      { status: 502 },
    );
  }
  return NextResponse.json(out.data);
}

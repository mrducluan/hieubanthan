// POST /api/tuvi/la-so — SPEC-005: lá số an sao đầy đủ (iztro chạy cục bộ trong engine).
// Proxy mỏng như /api/tuvi/chart: zod hai chiều, KHÔNG tự tính gì. Đầu vào giống chart.
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { dauNguoiGoi, loiEngine } from "@/lib/proxy";
import { ChartInput, LaSoOutput } from "../schema";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = ChartInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Đầu vào không hợp lệ", chi_tiet: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  let engineRes: Response;
  try {
    engineRes = await fetch(`${ENGINE_URL}/v1/tuvi/an-sao`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}),
        ...dauNguoiGoi(req),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch (e) {
    baoLoi(e, { noi: "api", duong: new URL(req.url).pathname });
    return NextResponse.json({ error: "Không kết nối được máy tính toán. Thử lại sau ít phút." }, { status: 502 });
  }

  const body: unknown = await engineRes.json().catch(() => null);
  if (!engineRes.ok) {
    const l = loiEngine(engineRes.status, body);
    return NextResponse.json({ error: l.error }, { status: l.status });
  }

  const out = LaSoOutput.safeParse(body);
  if (!out.success) {
    baoLoi(new Error("engine_lech_schema"), { duong: "/api/tuvi/la-so" });   // SEC-2: chi tiết chỉ gửi Sentry
    return NextResponse.json(
      { error: "Máy tính toán đang cập nhật, thử lại sau ít phút." },
      { status: 502 },
    );
  }
  return NextResponse.json(out.data);
}

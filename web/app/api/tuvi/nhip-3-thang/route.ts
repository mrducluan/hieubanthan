// POST /api/tuvi/nhip-3-thang — TV-V2 — nhịp 3 tháng tới (lưu nguyệt + tứ hoá lưu niên), mức thuận/bình/cần thận trọng.
// Proxy mỏng: zod hai chiều, KHÔNG tự tính gì.
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { loiEngine } from "@/lib/proxy";
import { Nhip3ThangInput, Nhip3ThangOutput } from "../schema";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = Nhip3ThangInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Đầu vào không hợp lệ", chi_tiet: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  let engineRes: Response;
  try {
    engineRes = await fetch(`${ENGINE_URL}/v1/tuvi/nhip-3-thang`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}),
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

  const out = Nhip3ThangOutput.safeParse(body);
  if (!out.success) {
    return NextResponse.json(
      { error: "Output engine lệch schema — kiểm tra phiên bản hai bên",
        chi_tiet: out.error.flatten().fieldErrors },
      { status: 502 },
    );
  }
  return NextResponse.json(out.data);
}

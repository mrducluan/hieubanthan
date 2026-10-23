// POST /api/tuvi/dinh-gio — TV-V2 — định giờ sinh: các canh giờ ứng viên + câu đối chiếu theo năm người dùng chọn.
// Proxy mỏng: zod hai chiều, KHÔNG tự tính gì.
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { dauNguoiGoi, loiEngine } from "@/lib/proxy";
import { DinhGioInput, DinhGioOutput } from "../schema";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = DinhGioInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Đầu vào không hợp lệ", chi_tiet: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  let engineRes: Response;
  try {
    engineRes = await fetch(`${ENGINE_URL}/v1/tuvi/dinh-gio`, {
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

  const out = DinhGioOutput.safeParse(body);
  if (!out.success) {
    return NextResponse.json(
      { error: "Output engine lệch schema — kiểm tra phiên bản hai bên",
        chi_tiet: out.error.flatten().fieldErrors },
      { status: 502 },
    );
  }
  return NextResponse.json(out.data);
}

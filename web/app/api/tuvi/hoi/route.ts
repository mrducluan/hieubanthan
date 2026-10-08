// POST /api/tuvi/hoi — proxy hỏi đáp Tử vi tới engine (giữ ENGINE key server-side).
// Web không tự an sao, không tự tính hạn: lá số và vận hạn do engine (iztro) tính.
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { z } from "zod";
import { dauNguoiGoi, loiEngine } from "@/lib/proxy";
import { LaSoVao } from "@/lib/la-so-vao";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const LaSo = LaSoVao;

const Input = z.object({
  cau_hoi: z.string().min(3).max(500),
  che_do: z.enum(["tham_khao", "chi_tiet"]).default("tham_khao"),
  la_so: LaSo.optional(),
}).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  }
  try {
    const r = await fetch(`${ENGINE_URL}/v1/tuvi/hoi`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}),
        ...dauNguoiGoi(req),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    const body: unknown = await r.json().catch(() => null);
    if (!r.ok) {
      const l = loiEngine(r.status, body);
      return NextResponse.json({ error: l.error }, { status: l.status });
    }
    return NextResponse.json(body);
  } catch (e) {
    baoLoi(e, { noi: "api", duong: new URL(req.url).pathname });
    return NextResponse.json({ error: "Không kết nối được máy tính toán. Thử lại sau ít phút." }, { status: 502 });
  }
}

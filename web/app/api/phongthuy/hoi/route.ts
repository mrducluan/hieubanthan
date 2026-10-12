// POST /api/phongthuy/hoi — proxy hỏi đáp Phong thuỷ tới engine (giữ ENGINE key server-side).
// Web không tự tính mệnh quái hay du niên: engine tính (Bát trạch).
import { voiCuaHoi } from "@/lib/cua-sao";
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { z } from "zod";
import { dauNguoiGoi, loiEngine } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const Sinh = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["nam", "nu"]),
  moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
}).strict();

const Input = z.object({
  cau_hoi: z.string().min(3).max(500),
  sinh: Sinh.optional(),
}).strict();

// SAO-2: hạn mức câu miễn phí / trừ Sao khi vượt (lib/cua-sao.ts, tắt mặc định).
export async function POST(req: Request): Promise<NextResponse> {
  return voiCuaHoi(req, "phongthuy", () => xuLy(req));
}

async function xuLy(req: Request): Promise<NextResponse> {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  }
  try {
    const r = await fetch(`${ENGINE_URL}/v1/phongthuy/hoi`, {
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

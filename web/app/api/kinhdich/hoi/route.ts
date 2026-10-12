// POST /api/kinhdich/hoi — proxy hỏi đáp Kinh Dịch tới engine (giữ ENGINE key server-side).
// Web không tự gieo, không tự chọn quẻ: quẻ do engine gieo, Mai Hoa theo giờ, hoặc gieo tay.
import { voiCuaHoi } from "@/lib/cua-sao";
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { z } from "zod";
import { dauNguoiGoi, loiEngine } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const Input = z.object({
  cau_hoi: z.string().min(3).max(500),
  che_do: z.enum(["tu_dong", "nghia_ly", "day_du"]).default("tu_dong"),
  cach_ra_que: z.enum(["may_gieo", "gieo_tay", "mai_hoa"]).default("may_gieo"),
  /** TP-LICH — âm lịch dùng cho Mai Hoa. */
  lich: z.enum(["viet", "trung"]).optional(),
  gia_tri_hao: z.array(z.number().int().min(6).max(9)).length(6).optional(),
}).strict();

// SAO-2: hạn mức câu miễn phí / trừ Sao khi vượt (lib/cua-sao.ts, tắt mặc định).
export async function POST(req: Request): Promise<NextResponse> {
  return voiCuaHoi(req, "kinhdich", () => xuLy(req));
}

async function xuLy(req: Request): Promise<NextResponse> {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  }
  try {
    const r = await fetch(`${ENGINE_URL}/v1/kinhdich/hoi`, {
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

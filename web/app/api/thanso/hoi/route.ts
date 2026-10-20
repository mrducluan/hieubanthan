// POST /api/thanso/hoi — proxy hỏi sâu tới engine (giữ ENGINE key server-side).
// Engine v2 trả lời được cả khi chưa bật LLM (template từ kho tri thức).
import { voiCuaHoi } from "@/lib/cua-sao";
import { NextResponse } from "next/server";
import { baoLoi } from "@/lib/giam-sat";
import { z } from "zod";
import { dauNguoiGoi, loiEngine } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

const Input = z.object({
  ho_ten: z.array(z.string().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  cau_hoi: z.string().min(3).max(400),
  // TS-PHAI-2: trả lời theo phái đang xem ở /than-so.
  phai: z.enum(["pitago", "chaldea", "tong_hop"]).optional(),
  // TS-V3: cách cộng Đường đời người dùng chọn.
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).optional(),
  nguoi_kia: z.object({
    ho_ten: z.array(z.string().min(1).max(80)).min(1).max(5).optional(),
    ngay: z.number().int().min(1).max(31),
    thang: z.number().int().min(1).max(12),
    nam: z.number().int().min(1900).max(2100),
  }).optional(),
});

// SAO-2: hạn mức câu miễn phí / trừ Sao khi vượt (lib/cua-sao.ts, tắt mặc định).
export async function POST(req: Request): Promise<NextResponse> {
  return voiCuaHoi(req, "thanso", () => xuLy(req));
}

async function xuLy(req: Request): Promise<NextResponse> {
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
        ...dauNguoiGoi(req),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    const body = await r.json().catch(() => null);
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

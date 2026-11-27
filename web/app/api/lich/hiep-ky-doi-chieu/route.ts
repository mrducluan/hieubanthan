// POST /api/lich/hiep-ky-doi-chieu — Chặng 4.3: Đối chiếu Trạch Nhật cổ điển Hiệp Kỷ Biện Phương Thư.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  tu_ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  so_ngay: z.number().int().min(1).max(30).default(7),
  huong_tu_tao: z.enum(["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"]).nullable().optional(),
}).strict();

export const maxDuration = 20;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  const kq = await goiEngineDaKiem(parsed.data, "/v1/lich/hiep-ky-doi-chieu", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}

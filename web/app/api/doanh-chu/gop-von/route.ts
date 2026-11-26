// POST /api/doanh-chu/gop-von — GV-1 "Khi góp vốn với người khác": web chỉ chuyển ngày sinh + đồng ý sang engine
// (vai trò, khâu còn trống, điều lệ gợi ý do engine dựng; không lưu, không chấm điểm).
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const SangLap = z.object({
  ten: z.string().trim().max(40).default(""),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1930).max(2025),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  ty_le_du_kien: z.number().min(0).max(100).optional(),
  dong_y_tu_nguyen: z.boolean(),
}).strict();

const Input = z.object({
  sang_lap: z.array(SangLap).min(2).max(4),
  cam_ket_thoa_thuan: z.boolean(),
}).strict();

export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  const kq = await goiEngineDaKiem(parsed.data, "/v1/doanh-chu/gop-von", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}

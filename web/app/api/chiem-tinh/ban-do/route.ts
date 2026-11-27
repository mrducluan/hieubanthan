// POST /api/chiem-tinh/ban-do — Chặng 4.2: Bản đồ sao Chiêm tinh Natal, Transit & Cầu nối Đông–Tây.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gio_sinh: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  noi_sinh: z.string().trim().max(60).nullable().optional(),
  vung_vn: z.enum(["north", "south"]).default("north"),
  vi_do: z.number().min(-89.9).max(89.9).nullable().optional(),
  kinh_do: z.number().min(-180).max(180).nullable().optional(),
  utc_lech: z.number().min(-12).max(14).nullable().optional(),
  he_nha: z.enum(["whole_sign", "placidus"]).default("whole_sign"),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  kem_cau_noi_dong_tay: z.boolean().default(true),
}).strict();

export const maxDuration = 25;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  const kq = await goiEngineDaKiem(parsed.data, "/v1/chiem-tinh/ban-do", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}

// POST /api/nhan-tuong/doi-chieu-menh — Chặng 3.2: Đối chiếu Nhịp năm Lá số & Tướng lưu niên / Chỉ tay Saint-Germain 1897.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  gio_sinh: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  do_lech_hai_tay: z.enum(["thuan_troi", "khong_thuan_troi", "can_doi"]).default("can_doi"),
  muc_chi_tay: z.array(z.enum(["ngon_cai", "duong_tri_dao", "duong_su_nghiep", "duong_thai_duong", "tam_giac_tu_giac"])).max(5).nullable().optional(),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).strict();

export const maxDuration = 20;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  const kq = await goiEngineDaKiem(parsed.data, "/v1/nhan-tuong/doi-chieu-menh", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}

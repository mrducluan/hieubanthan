// POST /api/co-van — Cố vấn liên mảng Tam Tài: ba cách xem đọc riêng (không gộp mức), chỉ dùng phần miễn phí của các báo
// cáo → miễn phí, không đi qua cổng Sao. Không lưu; ngày sinh người liên quan chỉ gửi khi có ô đồng ý.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const NhaCoVan = z.object({
  do_huong: z.number().min(0).lt(360),
  nam_xay: z.number().int().min(1864).max(2043).nullable().optional(),
}).strict();

const DoiTacCoVan = z.object({
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  vai_tro: z.enum(["nguoi_thuong", "gop_von", "cong_su"]).default("cong_su"),
  dong_y_tu_nguyen: z.literal(true),
}).strict();

const Input = z.object({
  cau_hoi: z.string().trim().min(3).max(500),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  gio_sinh: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  do_tin_gio: z.enum(["exact", "approx", "unknown"]).default("unknown"),
  noi_sinh: z.string().trim().max(60).nullable().optional(),
  nha: NhaCoVan.nullable().optional(),
  doi_tac: DoiTacCoVan.nullable().optional(),
  che_do: z.enum(["doi_song", "kinh_doanh"]).default("doi_song"),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).strict();

export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  const kq = await goiEngineDaKiem(parsed.data, "/v1/co-van", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}

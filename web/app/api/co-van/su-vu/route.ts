// POST /api/co-van/su-vu — Chặng 3.1: Chiến thuật Sự vụ tức thời (Kỳ Môn Thời Gia · Lục Hào Nạp Giáp đọc riêng).
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  cau_hoi: z.string().trim().min(3).max(500),
  tinh_huong: z.enum([
    "dam_phan_thuong_vu",
    "ky_ket_hop_dong",
    "thu_hoi_cong_no",
    "ra_mat_khai_truong",
    "hoa_giai_bat_dong",
    "cho_tin_ket_qua",
  ]).default("dam_phan_thuong_vu"),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  gio_xem: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  utc: z.number().min(-12).max(14).default(7),
  gia_tri_hao: z.array(z.union([z.literal(6), z.literal(7), z.literal(8), z.literal(9)])).length(6).nullable().optional(),
  hat_giong: z.string().regex(/^[A-Za-z0-9._:-]{4,128}$/).nullable().optional(),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).strict();

export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  const kq = await goiEngineDaKiem(parsed.data, "/v1/co-van/su-vu", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}

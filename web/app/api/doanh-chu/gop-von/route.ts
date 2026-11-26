// POST /api/doanh-chu/gop-von — Chặng 2: Proxy Soi Bù Khuyết Co-founder & Phân Vai Góp Vốn (Zero-PII, bắt buộc đồng ý PDPA).
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const SangLap = z.object({
  ten: z.string().trim().max(60).default(""),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1930).max(2025),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  gio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  ty_le_du_kien: z.number().min(0).max(100).nullable().optional(),
  dong_y_tu_nguyen: z.literal(true),
}).strict();

const Input = z.object({
  sang_lap: z.array(SangLap).min(2).max(4),
  nganh: z.enum(["dich_vu", "thuong_mai", "cong_nghe", "san_xuat"]).default("dich_vu"),
  nam_xem: z.number().int().min(2020).max(2050).default(2026),
  cam_ket_thoa_thuan: z.literal(true),
}).strict();

function ngayHopLe(nam: number, thang: number, ngay: number): boolean {
  const d = new Date(Date.UTC(nam, thang - 1, ngay));
  return d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngay;
}

export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  }
  for (const tv of parsed.data.sang_lap) {
    if (!ngayHopLe(tv.nam, tv.thang, tv.ngay)) {
      return NextResponse.json({ error: loiChung("khong_hop_le", en) }, { status: 422 });
    }
  }
  const kq = await goiEngineDaKiem(parsed.data, "/v1/doanh-chu/gop-von", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body);
}

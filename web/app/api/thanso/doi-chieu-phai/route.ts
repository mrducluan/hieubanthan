// POST /api/thanso/doi-chieu-phai — Chặng 3.3A: Đối chiếu 5 trường phái Thần số học.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ho_ten: z.string().max(120).default(""),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).default("tong_het"),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).strict();

export const maxDuration = 20;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  const kq = await goiEngineDaKiem(parsed.data, "/v1/thanso/doi-chieu-phai", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}

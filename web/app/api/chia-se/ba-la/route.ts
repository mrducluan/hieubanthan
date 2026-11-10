// POST /api/chia-se/ba-la — BT-UI: mã có KÝ cho thẻ "Ba lá của {tên} hôm nay". Máy chủ tự gọi engine lấy ba lá của đúng
// ngày xem (client không tự khai lá / số được); mã chỉ mang tên hiển thị + lá Tarot + số ngày + tên quẻ + ngày xem.
// Không mang họ tên, ngày sinh.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { kyMaBaLa, tuTuMa } from "@/lib/ma-moi";
import { traLoiChiaSe } from "@/lib/loi-chia-se";

const Input = z.object({
  ten_hien_thi: z.string().trim().min(1).max(40),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  /** Ngày người dùng đang xem (đồng hồ máy họ — QTE-2); chỉ nhận trong ±2 ngày quanh ngày máy chủ. */
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

interface HomNayEngine {
  ngay_xem: string;
  ba_la?: { tarot: { id: string; ten: string }; so: { so: number }; thoi_khac: { que: { ten: string } | null } };
}

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { ten_hien_thi, ngay_xem, ...sinh } = p.data;
  if (ngay_xem) {
    const lech = Math.abs(Date.parse(ngay_xem) - Date.now()) / 86_400_000;
    if (!(lech <= 2)) return NextResponse.json({ error: "Ngày xem không hợp lệ" }, { status: 422 });
  }
  const r = await goiEngineDaKiem({ ...sinh, ...(ngay_xem ? { ngay_xem } : {}) }, "/v1/thanso/hom-nay", dauNguoiGoi(req));
  if (!r.ok) return r.res;
  const d = r.body as HomNayEngine;
  if (!d.ba_la) return NextResponse.json({ error: "Chưa tạo được thẻ lúc này. Bạn thử lại sau ít phút nhé." }, { status: 503 });
  try {
    const ma = kyMaBaLa({ t: ten_hien_thi, l: [d.ba_la.tarot.id, d.ba_la.tarot.ten.slice(0, 24)], n: d.ba_la.so.so,
      q: d.ba_la.thoi_khac.que?.ten.slice(0, 40) ?? null, d: d.ngay_xem });
    return NextResponse.json({ ma, tu: tuTuMa("bl", ma), ngay: d.ngay_xem });
  } catch (e) {
    return traLoiChiaSe(e, "ba_la");
  }
}

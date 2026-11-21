// POST /api/doanh-chu/lich-12-thang — Proxy Lịch Quyết Định 12 Tháng (Bát Tự + Thần Số + Hoàng Lịch, Zero-PII).
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const Input = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1930).max(2025),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  // Giờ sinh "HH:MM" — bỏ trống (không biết giờ) thì engine không đọc lớp Bát tự, không đoán giờ.
  gio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  // Bỏ trống = 12 tháng kể từ tháng hiện tại; năm sau = từ tháng 1 của năm đó.
  nam_xem: z.number().int().min(2020).max(2050).optional(),
  cap_quan_ly: z.enum(["chu_dn", "giam_doc", "truong_nhom"]).default("chu_dn"),
  muc_tieu: z.enum(["tang_truong", "ky_ket", "giu_tien", "ra_mat"]).default("tang_truong"),
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
  const { ngay, thang, nam } = parsed.data;
  if (!ngayHopLe(nam, thang, ngay)) {
    return NextResponse.json({ error: loiChung("khong_hop_le", en) }, { status: 422 });
  }
  const kq = await goiEngineDaKiem(parsed.data, "/v1/doanh-chu/lich-12-thang", dauNguoiGoi(req));
  if (!kq.ok) {
    if (kq.res.status === 404) {
      return NextResponse.json(
        {
          error: en
            ? "The 12-Month Decision Calendar is being updated on the server. Please try again in a few minutes."
            : "Tính năng Lịch Quyết Định 12 Tháng đang được cập nhật trên máy chủ. Vui lòng thử lại sau vài phút.",
        },
        { status: 503 },
      );
    }
    return kq.res;
  }
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}

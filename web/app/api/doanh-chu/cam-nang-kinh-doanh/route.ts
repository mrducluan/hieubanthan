// POST /api/doanh-chu/cam-nang-kinh-doanh — Chặng 2: Cẩm nang Chiến lược Kinh doanh 5 Trụ
// (Mở rộng thị trường · So sánh 1–3 Địa điểm & Thành Môn Quyết · Ghép vai nhân sự · Bố trí văn phòng · Bài trí cửa hàng).
// Không nhận ngày sinh người thứ ba, không lưu dữ liệu trên máy chủ.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const MatBangUngVien = z.object({
  ten_diem: z.string().trim().max(80).default(""),
  loai_hinh: z.enum(["van_phong", "cua_hang", "quan_ca_phe", "xuong_kho"]).default("cua_hang"),
  do_huong: z.number().min(0).lt(360),
  nam_xay: z.number().int().min(1864).max(2043).nullable().optional(),
}).strict();

const Input = z.object({
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  gio_sinh: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  nganh: z.enum(["dich_vu", "thuong_mai", "cong_nghe", "san_xuat"]).default("dich_vu"),
  mat_bang_ung_vien: z.array(MatBangUngVien).max(3).default([]),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).strict();

export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  }
  const nam = Number(parsed.data.ngay_sinh.slice(0, 4));
  if (nam < 1930 || nam > 2025) {
    return NextResponse.json({ error: loiChung("khong_hop_le", en) }, { status: 422 });
  }
  const kq = await goiEngineDaKiem(parsed.data, "/v1/doanh-chu/cam-nang-kinh-doanh", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body);
}

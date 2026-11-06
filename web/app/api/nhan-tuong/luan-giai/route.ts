// POST /api/nhan-tuong/luan-giai — NT-1: bài đọc "Gương mặt của bạn" (engine dựng mọi chữ; web chỉ vẽ). Miễn phí, không lưu.
// Đầu vào: câu trả lời khảo sát (mã) + năm sinh / giới tính (tuổi lưu niên) + lá số Bát tự (tuỳ chọn, chương Tướng và lá số).
// HỌC-ĐS: kèm `trong_so` / `ca_nhan` như các mảng khác — engine chỉ hạ / xếp lại hộp.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";
import { LaSoVao } from "@/lib/la-so-vao";

const MA = z.string().regex(/^[a-z0-9_]{2,40}$/);
const Input = z.object({
  tra_loi: z.record(MA, MA).refine((o) => Object.keys(o).length <= 60),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nam_sinh: z.number().int().min(1900).max(2100).optional(),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  la_so: LaSoVao.optional(),
}).strict();

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const them = await themHocLuanGiai({ loai: "doi_song", tienTo: "ds.nhantuong." }).catch(() => ({}));
  const dau = dauNguoiGoi(req);
  let kq = await goiEngineDaKiem({ ...parsed.data, ...them }, "/v1/nhan-tuong/luan-giai", dau);
  if (!kq.ok && Object.keys(them).length) kq = await goiEngineDaKiem(parsed.data, "/v1/nhan-tuong/luan-giai", dau);
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}

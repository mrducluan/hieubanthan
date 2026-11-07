// POST /api/tarot/doc-bai — TR-1: bài đọc "Trải bài của bạn" từ lá NGƯỜI DÙNG đã rút (engine dựng mọi chữ; web chỉ vẽ).
// Miễn phí, không lưu; câu hỏi chỉ đi qua lượt gọi (engine không trả lại). HỌC-ĐS: kèm `trong_so` / `ca_nhan` như các mảng khác.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";

const MA = z.string().regex(/^[a-z0-9_]{2,40}$/);
const La = z.object({ id: z.string().regex(/^[a-z]{3,4}_[a-z0-9_]{1,12}$/), nguoc: z.boolean().optional() }).strict();
const Input = z.object({
  trai_bai: z.enum(["mot_la", "ba_la_thoi_gian", "ba_la_loi_khuyen", "nam_la", "celtic", "hai_lua_chon"]),
  la: z.array(La).min(1).max(10),
  cau_hoi: z.string().trim().max(500).optional(),
  chu_de: z.string().regex(/^[a-z_]{2,30}$/).optional(),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nam_sinh: z.number().int().min(1900).max(2100).optional(),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  tra_loi_nhan_tuong: z.record(MA, MA).refine((o) => Object.keys(o).length <= 60).optional(),
  bo_dai_dien: z.enum(["gay", "coc", "kiem", "tien"]).optional(),
}).strict();

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const them = await themHocLuanGiai({ loai: "doi_song", tienTo: "ds.tarot." }).catch(() => ({}));
  const dau = dauNguoiGoi(req);
  let kq = await goiEngineDaKiem({ ...parsed.data, ...them }, "/v1/tarot/doc-bai", dau);
  if (!kq.ok && Object.keys(them).length) kq = await goiEngineDaKiem(parsed.data, "/v1/tarot/doc-bai", dau);
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}

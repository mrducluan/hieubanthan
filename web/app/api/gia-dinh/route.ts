// POST /api/gia-dinh — GD-1 đợt 1 "Bảng nhà mình": engine ghép con giáp, Tam tai, sao hạn, cung phi của tối đa 8 người theo
// năm âm lịch. Chỉ nhận mã người + vai + năm sinh (+ giới tính, ngày sinh) — KHÔNG nhận tên (schema strict). Không lưu.
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { goiEngine } from "@/lib/proxy";

const VAI = ["ban_than", "vo_chong", "con", "bo", "me", "anh_chi", "em", "ong_ba", "chau", "bo_me_ben_kia", "con_dau_re", "nguoi_cung_nha"] as const;
const Input = z.object({
  nam: z.number().int().min(1901).max(2098).optional(),
  nguoi: z.array(z.object({
    id: z.string().regex(/^[a-z0-9]{1,12}$/),
    vai: z.enum(VAI),
    nam_sinh: z.number().int().min(1901).max(2098),
    gioi_tinh: z.enum(["nam", "nu"]).optional(),
    ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).strict()).min(1).max(8),
  // GD-2: lá số theo ngày giờ sinh của CHÍNH người dùng (như route luận giải) → khối "Lá số của bạn nhìn về nhà mình".
  la_so: LaSoVao.optional(),
}).strict();

export const maxDuration = 30;

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/gia-dinh");
}

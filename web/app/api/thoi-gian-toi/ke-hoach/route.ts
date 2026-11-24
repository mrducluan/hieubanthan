// KH-1 — POST /api/thoi-gian-toi/ke-hoach: "Việc bạn định làm: tháng nào hợp" — người dùng chọn một việc trong danh mục cố
// định, engine đếm các cách xem của 12 tháng tới (thần số, con giáp, sách lịch; Tử vi + Bát tự khi đủ giờ sinh). Miễn phí,
// không lưu; ngày sinh chỉ đi qua lượt gọi. Web không tính gì.
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { goiEngine } from "@/lib/proxy";
import { MA_KE_HOACH } from "@/lib/ke-hoach";

const Input = z.object({
  ke_hoach: z.enum(MA_KE_HOACH),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  la_so: LaSoVao.optional(),
}).strict();

export const maxDuration = 30;

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thoi-gian-toi/ke-hoach");
}

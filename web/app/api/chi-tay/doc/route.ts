// POST /api/chi-tay/doc — các hình vân người dùng TỰ CHỌN (mã) + ngày sinh tuỳ chọn (chỉ để biết đủ 18 tuổi) → lời sách xưa.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  van: z.array(z.string().regex(/^[a-z0-9-]{2,40}$/)).min(1).max(30),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/chi-tay/doc");
}

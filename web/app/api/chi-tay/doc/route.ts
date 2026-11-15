// POST /api/chi-tay/doc — các hình vân người dùng TỰ CHỌN (mã) + lựa chọn tự quan sát từng cung trên ảnh tay (CT-2, mã) +
// ngày sinh tuỳ chọn (chỉ để biết đủ 18 tuổi) → lời sách xưa. Phải có ít nhất một trong `van`, `cung`.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Ma = z.string().regex(/^[a-z_]{2,20}$/);

const Input = z.object({
  van: z.array(z.string().regex(/^[a-z0-9-]{2,40}$/)).min(1).max(30).optional(),
  cung: z.record(Ma, Ma).refine((c) => { const n = Object.keys(c).length; return n >= 1 && n <= 12; }).optional(),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict().refine((d) => Boolean(d.van?.length || (d.cung && Object.keys(d.cung).length)));

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/chi-tay/doc");
}

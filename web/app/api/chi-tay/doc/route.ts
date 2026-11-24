// POST /api/chi-tay/doc — các hình vân người dùng TỰ CHỌN (mã) + lựa chọn tự quan sát từng cung trên ảnh tay (CT-2, mã) +
// ngày sinh tuỳ chọn (chỉ để biết đủ 16 tuổi) → lời sách xưa. Phải có ít nhất một trong `van`, `cung`.
// TK-2: `phai: "tay"` → dáng tay / gò / đường chỉ phương Tây (Cheiro, Benham).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Ma = z.string().regex(/^[a-z_]{2,20}$/);

const Input = z.object({
  phai: z.enum(["dong", "tay"]).optional(),
  dang_tay: Ma.optional(),
  go: z.record(Ma, Ma).refine((c) => { const n = Object.keys(c).length; return n >= 1 && n <= 7; }).optional(),
  van: z.array(z.string().regex(/^[a-z0-9-]{2,40}$/)).min(1).max(30).optional(),
  cung: z.record(Ma, Ma).refine((c) => { const n = Object.keys(c).length; return n >= 1 && n <= 12; }).optional(),
  duong: z.record(Ma, Ma).refine((c) => { const n = Object.keys(c).length; return n >= 1 && n <= 8; }).optional(),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict().refine((d) => d.phai === "tay"
  // TK-2: phái Tây — dáng tay / gò / đường chỉ; không vân, không cung, không ngày sinh
  ? !d.van && !d.cung && !d.ngay_sinh && Boolean(d.dang_tay || (d.go && Object.keys(d.go).length) || (d.duong && Object.keys(d.duong).length))
  : !d.dang_tay && !d.go && Boolean(d.van?.length || (d.cung && Object.keys(d.cung).length) || (d.duong && Object.keys(d.duong).length)));

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/chi-tay/doc");
}

// POST /api/phongthuy/viec-tuan — Y4: thẻ "Việc 0 đồng tuần này" (Hôm nay). Chỉ MÃ dấu hiệu từ hồ sơ nhà trên máy; engine chọn
// việc theo tuần, không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Ma = z.string().regex(/^[a-z_]{3,30}$/);
const Input = z.object({
  dau_hieu: z.array(Ma).max(40),
  da_xu_ly: z.array(Ma).max(40).optional(),
  loai_nha: z.enum(["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"]).optional(),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/viec-tuan");
}

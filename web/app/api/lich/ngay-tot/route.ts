// POST /api/lich/ngay-tot — HL-1 thẻ ngày có tuổi người xem (ngày sinh chỉ dùng tính xung/hợp, không lưu) + việc.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nam_sinh: z.number().int().min(1900).max(2100).optional(),
  thang_sinh: z.number().int().min(1).max(12).optional(),
  ngay_sinh: z.number().int().min(1).max(31).optional(),
  viec: z.string().regex(/^[a-z_]{2,20}$/).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/lich/ngay-tot");
}

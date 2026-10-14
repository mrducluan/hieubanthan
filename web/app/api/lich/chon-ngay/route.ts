// POST /api/lich/chon-ngay — HL-1 tìm ngày tốt cho một việc trong ≤ 3 tháng, loại ngày xung tuổi (nếu có năm sinh).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Ngay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Input = z.object({
  viec: z.string().regex(/^[a-z_]{2,20}$/), tu: Ngay, den: Ngay,
  nam_sinh: z.number().int().min(1900).max(2100).optional(),
  thang_sinh: z.number().int().min(1).max(12).optional(),
  ngay_sinh: z.number().int().min(1).max(31).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/lich/chon-ngay");
}

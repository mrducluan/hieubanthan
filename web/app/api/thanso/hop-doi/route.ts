// POST /api/thanso/hop-doi — hợp đôi từ ngày sinh (+ tên nếu có) của hai người; engine tính.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Nguoi = z.object({
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5).optional(),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
}).strict();

const Input = z.object({ a: Nguoi, b: Nguoi }).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thanso/hop-doi");
}

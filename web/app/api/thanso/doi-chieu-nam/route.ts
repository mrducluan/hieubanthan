// POST /api/thanso/doi-chieu-nam — đặt các năm có biến cố lên dòng đời; engine tính, không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  cac_nam: z.array(z.number().int().min(1900).max(2100)).min(1).max(12),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thanso/doi-chieu-nam");
}

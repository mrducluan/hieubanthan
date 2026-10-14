// POST /api/thanso/nhip — NHIP-1: nhịp cá nhân gọn (ngày · tháng · tháng tới · năm còn N ngày · năm tới). Không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thanso/nhip");
}

// POST /api/lich/doi — đổi ngày âm ↔ dương cho form hồ sơ (engine đổi, web chỉ chuyển tiếp).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  chieu: z.enum(["am_sang_duong", "duong_sang_am"]),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  nhuan: z.boolean().optional(),
  noi_sinh: z.string().regex(/^[a-z0-9_-]{2,40}$/).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/lich/doi");
}

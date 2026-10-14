// POST /api/tuoi/xong-dat — TDG-1 chọn tuổi xông đất cho gia chủ. Không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  nam: z.number().int().min(1901).max(2099), nam_sinh: z.number().int().min(1900).max(2099),
  thang_sinh: z.number().int().min(1).max(12).optional(), ngay_sinh: z.number().int().min(1).max(31).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/tuoi/xong-dat");
}

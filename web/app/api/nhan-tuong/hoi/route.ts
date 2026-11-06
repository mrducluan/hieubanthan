// POST /api/nhan-tuong/hoi — NT-1: hỏi đáp theo bộ vị / cung / nốt ruồi / tuổi lưu niên (engine tất định, không LLM).
// Câu trả lời khảo sát (mã) đi kèm để lời riêng; không lưu câu hỏi gắn người dùng.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const MA = z.string().regex(/^[a-z0-9_]{2,40}$/);
const Input = z.object({
  cau_hoi: z.string().trim().min(2).max(500),
  tra_loi: z.record(MA, MA).optional(),
  nam_sinh: z.number().int().min(1900).max(2100).optional(),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/nhan-tuong/hoi");
}

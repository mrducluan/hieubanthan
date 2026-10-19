// POST /api/thanso/noi-dau — TS-NOIDAU "Bạn đang vướng ở đâu?": 5 trụ đời × câu hỏi nỗi đau, kèm con số trả lời. Không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thanso/noi-dau");
}

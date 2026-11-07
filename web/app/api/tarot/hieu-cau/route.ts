// POST /api/tarot/hieu-cau — TR-2: engine nhận ra kiểu câu hỏi (có nên / khi nào / A hay B…) + lĩnh vực + trải bài hợp. Chỉ trả
// mã và nhãn danh mục; câu hỏi không lưu, không trả lại, không ghi log (chỉ đi qua lượt gọi như /api/tarot/doc-bai).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  cau_hoi: z.string().trim().max(500),
  chu_de: z.string().regex(/^[a-z_]{2,30}$/).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/tarot/hieu-cau");
}

// POST /api/battu/doi-chieu-cach — BT-DC "Cách nào đúng với bạn?": engine dựng câu hỏi nhìn lại năm đã qua + mức của
// hai cách lấy dụng thần (web chỉ hiển thị, so mã trên máy người dùng). Không lưu, không trừ Sao.
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({ la_so: LaSoVao }).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/battu/doi-chieu-cach");
}

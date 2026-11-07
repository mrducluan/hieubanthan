// POST /api/tarot/hoi — TR-1: hỏi đáp tất định (nghĩa lá, vị trí trong trải bài vừa rút, trải bài, khái niệm). Không LLM, không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const La = z.object({ id: z.string().regex(/^[a-z]{3,4}_[a-z0-9_]{1,12}$/), nguoc: z.boolean().optional() }).strict();
const Input = z.object({
  cau_hoi: z.string().trim().min(2).max(500),
  trai_bai: z.enum(["mot_la", "ba_la_thoi_gian", "ba_la_loi_khuyen", "nam_la", "celtic", "hai_lua_chon"]).optional(),
  la: z.array(La).max(10).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/tarot/hoi");
}

// POST /api/battu/ban-do — BD-1 "Bản đồ lá số": engine dựng nghĩa từng chữ trong tứ trụ (là gì, nằm ở đâu trong đời,
// nối với chữ nào, năm nào chạm tới) + dòng thời gian năm / đại vận. Web chỉ vẽ. Không lưu, không trừ Sao.
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({ la_so: LaSoVao }).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/battu/ban-do");
}

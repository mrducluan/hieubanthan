// POST /api/battu/luan-giai — LG: luận giải toàn bộ theo chương (engine ghép, không lưu). Miễn phí thử nghiệm.
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({ la_so: LaSoVao }).strict();

// AI diễn đạt từng chương chạy song song phía engine (mỗi chương ≤ 40 giây).
export const maxDuration = 60;

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/battu/luan-giai");
}

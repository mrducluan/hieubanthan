// POST /api/tuvi/luan-giai — LG: luận giải toàn bộ theo chương (engine ghép, không lưu). Trừ Sao khi bật công tắc (lib/luan-giai-sao).
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { luanGiaiCoSao } from "@/lib/luan-giai-sao";

const Input = z.object({ la_so: LaSoVao }).strict();

// AI diễn đạt từng chương chạy song song phía engine (mỗi chương ≤ 40 giây).
export const maxDuration = 60;

export function POST(req: Request) {
  return luanGiaiCoSao(req, Input, "/v1/tuvi/luan-giai", "tuvi");
}

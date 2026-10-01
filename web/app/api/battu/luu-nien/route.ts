// POST /api/battu/luu-nien — VZ-3: năm xem + 12 lưu nguyệt đặt cạnh tứ trụ (engine tính, web chỉ vẽ).
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({ la_so: LaSoVao, nam_xem: z.number().int().min(1900).max(2100) }).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/battu/luu-nien");
}

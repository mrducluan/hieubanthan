// POST /api/phongthuy/huyen-khong — PT-HK: hạ quái bàn Huyền Không (engine tính, web chỉ vẽ).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  nam_xay: z.number().int().min(1864).max(2150),
  toa: z.string().max(10).optional(),
  do: z.number().min(0).lt(360).optional(),
  nam_xem: z.number().int().min(1900).max(2150).optional(),
  the_quai: z.boolean().optional(),
}).strict().refine((x) => (x.toa === undefined) !== (x.do === undefined), "Cần toạ sơn hoặc độ la bàn");

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/huyen-khong");
}

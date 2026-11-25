// POST /api/phongthuy/huyen-khong — PT-HK: hạ quái bàn Huyền Không (engine tính, web chỉ vẽ).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  nam_xay: z.number().int().min(1864).max(2150).optional(),
  van_xay: z.number().int().min(1).max(9).optional(),   // PT-NHA: chỉ nhớ khoảng năm xây → vận
  toa: z.string().max(10).optional(),
  do: z.number().min(0).lt(360).optional(),
  // PT-NHA: độ HƯỚNG nhà từ hồ sơ — engine đổi sang toạ (web không tự cộng 180°).
  huong_do: z.number().min(0).lt(360).optional(),
  nam_xem: z.number().int().min(1900).max(2150).optional(),
  the_quai: z.boolean().optional(),
}).strict()
  .refine((x) => [x.toa, x.do, x.huong_do].filter((v) => v !== undefined).length === 1, "Cần toạ sơn hoặc độ la bàn")
  .refine((x) => (x.nam_xay === undefined) !== (x.van_xay === undefined), "Cần năm xây hoặc khoảng năm xây");

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/huyen-khong");
}

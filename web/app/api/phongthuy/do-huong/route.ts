// POST /api/phongthuy/do-huong — PT-V1: độ hướng nhà (la bàn điện thoại / nhập tay) → engine đổi ra hướng, sơn, trạch.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  do_huong: z.number().min(0).lt(360),
  sinh: z.object({
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(["nam", "nu"]),
    moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
  }).strict().optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/do-huong");
}

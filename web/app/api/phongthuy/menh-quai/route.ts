// POST /api/phongthuy/menh-quai — mệnh quái + bảng 8 hướng du niên (engine tính).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["nam", "nu"]),
  moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/menh-quai");
}

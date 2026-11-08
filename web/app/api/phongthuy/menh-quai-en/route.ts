// POST /api/phongthuy/menh-quai-en — QTE-1 tuần 6: Kua number cho trang /en (cùng phép tính /v1/phongthuy/menh-quai).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["nam", "nu"]),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/menh-quai-en");
}

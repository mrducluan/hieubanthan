// POST /api/battu/la-so — tứ trụ, thập thần, ngũ hành, đại vận (engine tính, web chỉ vẽ).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/),
  gender: z.enum(["nam", "nu"]),
  vung: z.enum(["north", "south"]).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/battu/la-so");
}

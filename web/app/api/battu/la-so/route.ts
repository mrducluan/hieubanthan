// POST /api/battu/la-so — tứ trụ, thập thần, ngũ hành, đại vận (engine tính, web chỉ vẽ).
import { LaSoVao } from "@/lib/la-so-vao";
import { goiEngine } from "@/lib/proxy";

const Input = LaSoVao;

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/battu/la-so");
}

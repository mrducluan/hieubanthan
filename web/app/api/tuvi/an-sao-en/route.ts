// POST /api/tuvi/an-sao-en — QTE-1 tuần 5: lá số Tử vi cho trang /en (cùng lá số /v1/tuvi/an-sao, nhãn tiếng Anh).
import { LaSoVao } from "@/lib/la-so-vao";
import { goiEngine } from "@/lib/proxy";

export function POST(req: Request) {
  return goiEngine(req, LaSoVao, "/v1/tuvi/an-sao-en");
}

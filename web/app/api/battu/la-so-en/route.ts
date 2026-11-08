// POST /api/battu/la-so-en — QTE-1 tuần 3–4: lá số Bát tự cho trang /en (cùng phép tính /v1/battu/la-so, nhãn tiếng Anh).
import { LaSoVao } from "@/lib/la-so-vao";
import { goiEngine } from "@/lib/proxy";

export function POST(req: Request) {
  return goiEngine(req, LaSoVao, "/v1/battu/la-so-en");
}

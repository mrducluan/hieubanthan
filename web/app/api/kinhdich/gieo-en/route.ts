// POST /api/kinhdich/gieo-en — QTE-1 tuần 7: gieo quẻ cho trang /en (engine gieo bằng CSPRNG; câu hỏi KHÔNG gửi lên).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({ gia_tri_hao: z.array(z.number().int().min(6).max(9)).length(6).optional() }).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/kinhdich/gieo-en");
}

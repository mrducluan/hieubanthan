// POST /api/lich/thang — HL-1 lịch một tháng (tóm tắt từng ngày), không dữ liệu cá nhân.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({ nam: z.number().int().min(1901).max(2099), thang: z.number().int().min(1).max(12) }).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/lich/thang");
}

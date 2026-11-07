// POST /api/tarot/xao-bai — TR-1: thứ tự 78 lá + cờ ngược. `hat_giong` = băm SHA-256 web tạo từ cử chỉ (chỉ hex rời máy);
// không gửi → engine dùng CSPRNG. Không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  hat_giong: z.string().regex(/^[A-Za-z0-9._:-]{4,256}$/).optional(),
  nguoc: z.boolean().optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/tarot/xao-bai");
}

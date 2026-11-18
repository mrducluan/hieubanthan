// POST /api/phongthuy/hai-cung — UI-HHT: hướng chung hai người (vợ chồng, người cùng nhà). Chỉ năm sinh + giới tính, engine
// tính (cung phi, du niên từng hướng, hướng chung, lệ vợ chồng khác nhóm); không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Nguoi = z.object({ nam: z.number().int().min(1900).max(2100), gioi_tinh: z.enum(["nam", "nu"]) }).strict();
const Input = z.object({ a: Nguoi, b: Nguoi }).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/hai-cung");
}

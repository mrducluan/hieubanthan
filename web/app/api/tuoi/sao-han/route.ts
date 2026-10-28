// POST /api/tuoi/sao-han — MT-ĐS B3 sao hạn Cửu Diệu + Bát hạn theo tuổi mụ (tập quán, miễn phí). Không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  nam: z.number().int().min(1901).max(2099), nam_sinh: z.number().int().min(1900).max(2099), gioi_tinh: z.enum(["nam", "nu"]),
  thang_sinh: z.number().int().min(1).max(12).optional(), ngay_sinh: z.number().int().min(1).max(31).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/tuoi/sao-han");
}

// POST /api/tuoi/lam-nha — TDG-1 xem tuổi làm nhà / cưới (Kim lâu, Hoang ốc, Tam tai). Không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  nam_sinh: z.number().int().min(1900).max(2099), nam_xay: z.number().int().min(1901).max(2099),
  thang_sinh: z.number().int().min(1).max(12).optional(), ngay_sinh: z.number().int().min(1).max(31).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/tuoi/lam-nha");
}

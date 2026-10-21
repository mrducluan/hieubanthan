// POST /api/phongthuy/thang-nay — KC-2: thẻ "Tháng này nhà bạn" (Hôm nay) từ hồ sơ nhà lưu trên máy. Engine tính, không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  huong_do: z.number().min(0).lt(360).optional(),
  huong: z.enum(["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"]).optional(),
  nam_xay: z.number().int().min(1864).max(2150).optional(),
  toa: z.string().max(10).optional(),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict().refine((x) => x.huong_do !== undefined || x.huong !== undefined, "Cần hướng nhà");

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/thang-nay");
}

// POST /api/chiem-tinh/cung-hoang-dao — CHT-1: tra cung hoàng đạo theo ngày sinh (engine tính, web chỉ chuyển tiếp, không lưu).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  vung: z.enum(["north", "south"]).default("north"),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/chiem-tinh/cung-hoang-dao/tra");
}

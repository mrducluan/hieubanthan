// POST /api/dia-ly/mui-gio/tai — múi giờ chuẩn + giờ mùa hè tại ngày giờ sinh (dòng xác nhận trong form hồ sơ; không lưu).
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  mui_gio: z.string().regex(/^[A-Za-z][A-Za-z0-9_+\-\/]{1,63}$/),
  ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gio: z.string().regex(/^\d{2}:\d{2}$/),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/dia-ly/mui-gio/tai");
}

// Đầu vào lá số (Tử vi / Bát tự) dùng chung cho các route proxy — validate, KHÔNG tính gì.
// Nơi sinh: mã tỉnh (GET /api/dia-ly/tinh) hoặc "nuoc_ngoai" (giờ địa phương, engine xử lý).
import { z } from "zod";

export const LaSoVao = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/),
  gender: z.enum(["nam", "nu"]),
  vung: z.enum(["north", "south"]).optional(),
  noi_sinh: z.string().regex(/^[a-z0-9_-]{2,40}$/).optional(),
  gio_mua_he: z.boolean().optional(),
  do_tin_gio: z.enum(["exact", "approx", "unknown"]).optional(),
}).strict();

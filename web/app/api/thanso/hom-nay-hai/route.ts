// POST /api/thanso/hom-nay-hai — BT-UI đợt 2 "Hôm nay của hai người": engine tính ngày cá nhân của hai người + một việc nên
// làm cùng (không chấm điểm). Người thứ hai chỉ gửi ngày + tháng sinh (năm chỉ khi nhập âm lịch, để engine đổi lịch);
// không tên, không lưu, không ghi log.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  kia_ngay: z.number().int().min(1).max(31),
  kia_thang: z.number().int().min(1).max(12),
  kia_nam: z.number().int().min(1900).max(2100).optional(),
  kia_lich: z.enum(["duong", "am"]).optional(),
  kia_nhuan: z.boolean().optional(),
  kia_vung: z.enum(["north", "south"]).optional(),
  kia_lich_am: z.enum(["viet", "trung"]).optional(),
  quan_he: z.string().regex(/^[a-z_]{2,20}$/).optional(),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => Math.abs(Date.parse(`${s}T00:00:00Z`) - Date.now()) <= 2 * 86_400_000,
    "ngay_xem phải là hôm nay theo một múi giờ nào đó").optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thanso/hom-nay-hai");
}

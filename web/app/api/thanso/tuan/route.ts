// POST /api/thanso/tuan — BT-UI đợt 2 "Tuần này của bạn": engine ghép bảy ngày (ngày cá nhân × hoàng lịch theo tuổi) và chọn
// tối đa ba ngày đáng để ý. Không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  // Hôm nay theo đồng hồ máy người dùng (như /api/thanso/hom-nay) — chỉ nhận ngày cách hôm nay ≤ 2 ngày.
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => Math.abs(Date.parse(`${s}T00:00:00Z`) - Date.now()) <= 2 * 86_400_000,
    "ngay_xem phải là hôm nay theo một múi giờ nào đó").optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thanso/tuan");
}

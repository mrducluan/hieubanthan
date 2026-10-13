// POST /api/thanso/hom-nay — HN-1 "Hôm nay của bạn": engine tính ngày/tháng/năm cá nhân + âm lịch của ngày xem
// + ý định trong ngày (HN-2), không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  // HN-2: ý định chọn sẵn + câu gõ tay (engine chỉ nhận diện ý định, không lưu, không trả lại câu).
  y_dinh: z.array(z.string().regex(/^[a-z_]{2,20}$/)).max(11).optional(),
  du_dinh: z.string().trim().max(200).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thanso/hom-nay");
}

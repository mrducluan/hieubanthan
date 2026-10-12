// POST /api/thanso/hom-nay — HN-1 "Hôm nay của bạn": engine tính ngày/tháng/năm cá nhân + âm lịch của ngày xem, không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/thanso/hom-nay");
}

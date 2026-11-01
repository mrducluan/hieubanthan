// POST /api/lich/chon-ngay-nhieu — EN-5.1 chọn ngày cho nhiều người (cưới hỏi, khai trương…): ngày hợp việc, không xung
// tuổi ai, lưu ý tháng xung / Kim lâu / tuổi làm nhà của người chính. Năm sinh chỉ đi qua lượt gọi, không lưu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Ngay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Nguoi = z.object({
  vai: z.string().regex(/^[a-z_]{2,20}$/),
  nam_sinh: z.number().int().min(1900).max(2100),
  thang_sinh: z.number().int().min(1).max(12).optional(),
  ngay_sinh: z.number().int().min(1).max(31).optional(),
}).strict();
const Input = z.object({
  viec: z.string().regex(/^[a-z_]{2,20}$/), tu: Ngay, den: Ngay,
  nguoi: z.array(Nguoi).min(1).max(8),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/lich/chon-ngay-nhieu");
}

// POST /api/tuvi/ban-do — TV-BD1 "Bản đồ 12 cung Tử vi": engine dựng nghĩa từng cung + tam phương tứ chính + đường bay
// 2 chặng + dòng thời gian đại hạn / lưu niên. Web chỉ vẽ. TUYỆT ĐỐI KHÔNG nhận `ngay_xem` từ trình duyệt (chống lách SAO-2).
import { z } from "zod";
import { ChartInput } from "@/app/api/tuvi/schema";
import { goiEngine } from "@/lib/proxy";

const LaSoBanDo = ChartInput.extend({
  gio_sinh: z.enum(["dong_ho", "mat_troi"]).optional(),
}).strict();

const Input = z.object({ la_so: LaSoBanDo }).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/tuvi/ban-do");
}

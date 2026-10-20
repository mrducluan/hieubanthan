// POST /api/thanso/ban-do-con-so — gói Sao "Bản đồ con số" (Luận giải toàn bộ thần số): chương Tổng quan miễn phí,
// Nghịch lý bên trong · 12 tháng tới · Sự nghiệp & tiền bạc mở bằng Sao khi bật thu Sao (lib/luan-giai-sao). Engine
// ghép từ CALC + KB, không lưu.
import { z } from "zod";
import { luanGiaiCoSao } from "@/lib/luan-giai-sao";

const Input = z.object({
  ho_ten: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).optional(),
}).strict();

export function POST(req: Request) {
  return luanGiaiCoSao(req, Input, "/v1/thanso/ban-do-con-so", "thanso");
}

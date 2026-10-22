// POST /api/phongthuy/huong-ban-do — Q3: hướng nhà từ HAI ĐIỂM trên bản đồ (tâm nhà → điểm ngay trước mặt nhà) cho căn hộ
// không đo được la bàn ở cửa. Toạ độ chỉ đi qua lượt gọi để engine tính góc — không lưu, không ghi nhật ký.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Diem = z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]);
const Input = z.object({
  tam: Diem,
  truoc: Diem,
  sinh: z.object({
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(["nam", "nu"]),
    moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
  }).strict().optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/huong-ban-do");
}

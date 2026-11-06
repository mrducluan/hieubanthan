// POST /api/nhan-tuong/do-anh — NT-1: 4 điểm người dùng tự chấm trên ảnh CỦA HỌ (toạ độ 0..1, KHÔNG ảnh) → tỉ lệ ba đình.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Diem = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict();
const Input = z.object({ chan_toc: Diem, an_duong: Diem, chuan_dau: Diem, cam: Diem }).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/nhan-tuong/do-anh");
}

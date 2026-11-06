// POST /api/nhan-tuong/do-mat — ANH-2 "Đo trên ảnh" (không AI): toạ độ 0..1 các điểm mốc người dùng TỰ CHẤM trên ảnh của
// chính mình + tỉ lệ rộng/cao của ảnh (KHÔNG ảnh) → engine CALC đo tỉ lệ "tam đình ngũ nhãn" và gợi ý lựa chọn khảo sát.
// Điểm mốc gương mặt là dữ liệu nhạy cảm → chỉ đi khi người dùng đã tích thoả thuận (`dong_y: true`). Không lưu, không log.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Diem = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict();
const Diem_ = (min: number, max: number) =>
  z.record(z.string().regex(/^[a-z_]{2,20}$/), Diem).refine((o) => Object.keys(o).length >= min && Object.keys(o).length <= max);
// ANH-4: tối đa hai ảnh nghiêng (mỗi bên một) — vẫn chỉ toạ độ người dùng chấm trên đường viền, không ảnh.
const Nghieng = z.object({ goc: z.enum(["nghieng_trai", "nghieng_phai"]), diem: Diem_(4, 20), ti_le: z.number().min(0.2).max(5) }).strict();
const Input = z.object({
  diem: Diem_(4, 30),
  ti_le: z.number().min(0.2).max(5),
  dong_y: z.literal(true),
  nghieng: z.array(Nghieng).max(2).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/nhan-tuong/do-mat");
}

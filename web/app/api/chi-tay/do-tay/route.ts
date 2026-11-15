// POST /api/chi-tay/do-tay — CT-2: 21 toạ độ điểm mốc bàn tay (0..1, máy người dùng tự tìm — ẢNH KHÔNG gửi lên) + tỉ lệ khung
// ảnh + tay (trái/phải) + ngày sinh tuỳ chọn (chỉ để biết đủ 18 tuổi) → engine đo tỉ lệ bàn tay / ngón, toạ độ tám cung trên
// ảnh của người dùng, câu sách theo số đo. Bắt buộc `dong_y: true` (thoả thuận ct1). Không lưu, không log thân yêu cầu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const So01 = z.number().finite().min(0).max(1);

const Input = z.object({
  dong_y: z.literal(true),
  tay: z.enum(["trai", "phai"]),
  ty_le: z.number().finite().min(0.1).max(10),
  diem: z.array(z.tuple([So01, So01])).length(21),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/chi-tay/do-tay");
}

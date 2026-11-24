// POST /api/chi-tay/do-tay — CT-2: 21 toạ độ điểm mốc bàn tay (0..1, máy người dùng tự tìm — ẢNH KHÔNG gửi lên; + 21 điểm 3D và
// tín hiệu ước lượng ba đường chỉ, tuỳ chọn) + tỉ lệ khung
// ảnh + tay (trái/phải) + ngày sinh tuỳ chọn (chỉ để biết đủ 16 tuổi) → engine đo tỉ lệ bàn tay / ngón, toạ độ tám cung trên
// ảnh của người dùng, câu sách theo số đo. Bắt buộc `dong_y: true` (thoả thuận ct2). Không lưu, không log thân yêu cầu.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const So01 = z.number().finite().min(0).max(1);

const So = z.number().finite();
// Tín hiệu ước lượng ba đường chỉ do máy người dùng dò (lib/duong-chi-tay-cv.ts `KetQuaDuongChiCV`) — CHỈ con số 0..1, schema chặt.
// `polylines` (nét vẽ lớp phủ) không được gửi lên: engine không dùng, ít dữ liệu hơn là tốt hơn → có thì bị từ chối (strict).
const TinHieuDuong = z.object({ do_ro: So01, chieu_dai_uoc_luong: So01, do_cong: So01 }).strict();
const DuongChiGoiY = z.object({
  do_ro_tong: So01,
  tam_dao: TinHieuDuong,
  tri_dao: TinHieuDuong,
  sinh_dao: TinHieuDuong,
  do_tin: z.literal("goi_y_tham_khao"),
}).strict();

const Input = z.object({
  dong_y: z.literal(true),
  phai: z.enum(["dong", "tay", "hop_nhat"]).optional(),   // TK-2: "tay" → phương Tây; "hop_nhat" → hợp nhất Đông–Tây
  tay: z.enum(["trai", "phai"]),
  ty_le: z.number().finite().min(0.1).max(10),
  diem: z.array(z.tuple([So01, So01])).length(21),
  diem_3d: z.array(z.tuple([So, So, So])).length(21).optional(),
  duong_chi_goi_y: DuongChiGoiY.optional(),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/chi-tay/do-tay");
}

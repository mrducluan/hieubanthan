// POST /api/chi-tay/luan-giai-hai-tay — Đo và luận giải hợp nhất Đông–Tây cho 1 hoặc 2 bàn tay (Tay Trái Tiên Thiên + Tay Phải Hậu Thiên).
// Ảnh KHÔNG bao giờ rời máy người dùng: chỉ nhận 21 điểm mốc 2D, 21 điểm 3D tuỳ chọn, tín hiệu đường chỉ ROI tuỳ chọn.
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

const MotTay = z.object({
  ty_le: z.number().finite().min(0.1).max(10),
  diem: z.array(z.tuple([So01, So01])).length(21),
  diem_3d: z.array(z.tuple([So, So, So])).length(21).optional(),
  duong_chi_goi_y: DuongChiGoiY.optional(),
}).strict();

const Input = z.object({
  dong_y: z.literal(true),
  trai: MotTay.optional(),
  phai: MotTay.optional(),
  van: z.array(z.string().regex(/^[a-z0-9-]{2,40}$/)).max(30).optional(),
  cung: z.record(z.string(), z.string()).optional(),
  duong: z.record(z.string(), z.string()).optional(),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict().refine((d) => Boolean(d.trai || d.phai), { message: "Cần ít nhất một bàn tay (trái hoặc phải)." });

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/chi-tay/luan-giai-hai-tay");
}

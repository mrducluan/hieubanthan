// POST /api/thoi-gian-toi — NAM-2 "Thời gian tới của bạn" (3 tháng · 12 tháng · năm). Engine ghép từ các bộ tính có sẵn,
// không lưu. Chương 1 (3 tháng tới + tóm tắt năm) miễn phí; 3 chương sau mở bằng Sao khi công tắc thu Sao chung bật
// (chủ dự án chốt 2026-10-30) — cùng giá / luồng `luanGiaiCoSao` với Luận giải toàn bộ (mô-đun "thoi_gian").
// Kèm `trong_so` / `ca_nhan` (tầng HỌC, mã `ds.*`) như báo cáo Tử vi — không tính vào khoá "đã mở hôm nay".
import { z } from "zod";
import { LaSoVao } from "@/lib/la-so-vao";
import { luanGiaiCoSao } from "@/lib/luan-giai-sao";
import { themHocLuanGiai } from "@/lib/hoc-tuvi";

const Input = z.object({
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  la_so: LaSoVao.optional(),
  nam: z.number().int().min(1901).max(2099).optional(),
}).strict();

export const maxDuration = 30;

export function POST(req: Request) {
  return luanGiaiCoSao(req, Input, "/v1/thoi-gian-toi", "thoi_gian", undefined,
    () => themHocLuanGiai({ loai: "doi_song", tienTo: "ds." }));
}

// PT-V0 / Q2 — hình dạng JSON bố cục nhà (BoCuc 0.2 của engine) dùng chung cho /api/phongthuy/bo-cuc và /api/phongthuy/luan-giai.
// Zod chỉ kiểm hình dạng; engine kiểm nghiệp vụ (mã dấu hiệu, phương, lưới). Không lưu gì.
import { z } from "zod";

export const Do = z.number().min(0).lt(360);
export const DauHieuZ = z.object({
  co: z.boolean(),
  do_tin: z.number().min(0).max(1).optional(),
  nguon: z.enum(["nguoi_dung", "anh", "video"]).optional(),
  xac_nhan: z.boolean().optional(),
}).strict();
// Q2: mặt bằng vẽ tay trên lưới N×N (3–12), ô tô = "1"; ô đại diện từng phòng + ô ban công. Engine tính tâm, Cửu cung, khuyết góc.
const O = z.tuple([z.number().int().min(0).max(11), z.number().int().min(0).max(11)]);
export const MatBangZ = z.object({
  luoi: z.array(z.string().regex(/^[01#.xX]{3,12}$/)).min(3).max(12),
  phong: z.record(z.string().max(30), O).optional(),
  ban_cong: O.optional(),
}).strict();
export const BoCucZ = z.object({
  phien_ban: z.enum(["0.1", "0.2"]).optional(),
  loai_nha: z.enum(["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"]).optional(),
  huong_nha_do: Do.optional(),
  huong_nha: z.string().max(12).optional(),
  vi_tri: z.record(z.string().max(30), z.string().max(12)).optional(),
  huong_do: z.record(z.string().max(30), Do).optional(),
  dau_hieu: z.record(z.string().max(40), DauHieuZ).optional(),
  mat_bang: MatBangZ.optional(),
}).strict();
/** Q4: câu giải thích dấu hiệu đưa lên trước — theo sách xưa hay theo đời sống (ánh sáng, gió, tiếng ồn). */
export const GocNhinZ = z.enum(["sach_xua", "doi_song"]);

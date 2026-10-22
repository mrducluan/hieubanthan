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

/** Đầu vào /api/phongthuy/luan-giai (PT-ĐS) — dùng chung với /api/chia-se/nha (UI-PT2 P7: máy chủ đọc lại rồi ký thẻ). */
export const SinhZ = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  birth_year: z.number().int().min(1860).max(2150).optional(),
  gender: z.enum(["nam", "nu"]),
  moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
}).strict();
export const LuanGiaiPTZ = z.object({
  sinh: SinhZ.optional(),
  nha: z.object({
    huong_do: Do.optional(),
    huong: z.enum(["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"]).optional(),
    nam_xay: z.number().int().min(1864).max(2150).optional(),
    toa: z.string().max(10).optional(),
    theo: z.enum(["cua", "ban_cong"]).optional(),
    bo_cuc: BoCucZ.optional(),
  }).strict(),
  thanh_vien: z.array(SinhZ.extend({ vai: z.enum(["vo", "chong", "con", "cha_me", "khac"]).optional() }).strict()).max(6).optional(),
  ngay_xem: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // Q4 góc nhìn giải thích dấu hiệu · đồ thị tri thức: ý định chung → mục "Theo điều bạn đang băn khoăn".
  goc_nhin: GocNhinZ.optional(),
  y_dinh: z.string().regex(/^[a-z_]{3,30}$/).optional(),
}).strict();

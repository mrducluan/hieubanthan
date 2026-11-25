// POST /api/phongthuy/vi-tri-vat — VT-1: "Đứng giữa nhà, chĩa điện thoại" (mẫu la bàn) hoặc điểm trên khung nhà theo tỉ lệ
// → engine tính phương, sơn từng vật, Cửa – Chủ – Bếp từng tầng, du niên với mệnh, sao Huyền Không. Web chỉ kiểm đầu vào.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";
import { boBanCong, boSan, gopLui } from "@/lib/lui-so-do";

const Do = z.number().min(0).lt(360);
const Vat = z.object({
  loai: z.enum(["cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho", "cau_thang", "ban_cong"]),
  mau: z.array(Do).min(1).max(120).optional(),
  sai_so: z.number().min(-1).max(360).optional(),
  diem: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).optional(),
  // SD-1: chỉ gửi khi người dùng TỰ CHỈNH trên sơ đồ — engine dùng để gợi ý dấu hiệu (web không tự suy)
  kich_thuoc: z.tuple([z.number().min(0.3).max(200), z.number().min(0.3).max(200)]).optional(),
  huong_cua: z.enum(["truoc", "phai", "sau", "trai"]).optional(),
}).strict();
const Input = z.object({
  huong_nha_do: Do.optional(),
  truc_mau: z.array(Do).min(1).max(120).optional(),
  khung: z.object({
    rong: z.number().positive().max(200),
    sau: z.number().positive().max(200),
    luoi: z.array(z.string().regex(/^[01]{3,12}$/)).min(3).max(12).optional(),
    // TY-2 gói 2: dải sân / giếng trời (y0, y1 theo chiều sâu, 0..1) — engine kiểm nằm trong nhà, không chồng, đếm lớp.
    san: z.array(z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])).max(14).optional(),
  }).strict().optional(),
  nam_xay: z.number().int().min(1864).max(2150).optional(),
  van_xay: z.number().int().min(1).max(9).optional(),   // PT-NHA: chỉ nhớ khoảng năm xây → vận
  sinh: z.object({
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(["nam", "nu"]),
    moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
  }).strict().optional(),
  du_18: z.boolean().optional(),
  tang: z.array(z.object({ so: z.number().int().min(1).max(6), vat: z.array(Vat).min(1).max(6) }).strict()).min(1).max(6),
}).strict();

export function POST(req: Request) {
  // Deploy lệch: engine cũ chưa nhận "ban_cong" / sân → gọi lại một lần không kèm các phần đó.
  return goiEngine(req, Input, "/v1/phongthuy/vi-tri-vat", gopLui(boBanCong, boSan));
}

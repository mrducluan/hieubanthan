// POST /api/phongthuy/bo-cuc — PT-V0: bố cục nhà (khảo sát tay; sau này từ ảnh) → engine luận Bát trạch + dấu hiệu.
// Proxy mỏng: zod kiểm hình dạng, engine kiểm nghiệp vụ (mã dấu hiệu, phương). Không lưu gì.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Do = z.number().min(0).lt(360);
const DauHieu = z.object({
  co: z.boolean(),
  do_tin: z.number().min(0).max(1).optional(),
  nguon: z.enum(["nguoi_dung", "anh", "video"]).optional(),
  xac_nhan: z.boolean().optional(),
}).strict();

const Input = z.object({
  bo_cuc: z.object({
    phien_ban: z.literal("0.1").optional(),
    loai_nha: z.enum(["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"]).optional(),
    huong_nha_do: Do.optional(),
    huong_nha: z.string().max(12).optional(),
    vi_tri: z.record(z.string().max(30), z.string().max(12)).optional(),
    huong_do: z.record(z.string().max(30), Do).optional(),
    dau_hieu: z.record(z.string().max(40), DauHieu).optional(),
  }).strict(),
  sinh: z.object({
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(["nam", "nu"]),
    moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
  }).strict().optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/bo-cuc");
}

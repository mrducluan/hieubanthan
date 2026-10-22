// POST /api/phongthuy/bo-cuc — PT-V0: bố cục nhà (khảo sát tay; Q2 mặt bằng vẽ tay; sau này từ ảnh) → engine luận Bát trạch
// + dấu hiệu (Q1 veto, Q4 hai lối giải thích, Q5 việc theo chi phí, Q6 luật căn hộ). Proxy mỏng; không lưu gì.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";
import { BoCucZ, GocNhinZ } from "@/lib/bo-cuc-zod";

const Input = z.object({
  bo_cuc: BoCucZ,
  goc_nhin: GocNhinZ.optional(),
  sinh: z.object({
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(["nam", "nu"]),
    moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
  }).strict().optional(),
}).strict();

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/bo-cuc");
}

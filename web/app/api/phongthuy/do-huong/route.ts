// POST /api/phongthuy/do-huong — PT-V1: độ hướng nhà (nhập tay) hoặc LK-1: MẪU la bàn thô lấy lúc giữ yên máy (`mau`, tuỳ
// chọn lần đo thứ hai `mau_2`) → engine tính trung bình, độ rung, mức ổn định, so hai lần đo, rồi đổi ra hướng, sơn, trạch.
// Web không tự tính số độ được chốt.
import { z } from "zod";
import { goiEngine } from "@/lib/proxy";

const Input = z.object({
  do_huong: z.number().min(0).lt(360).optional(),
  mau: z.array(z.number().min(0).lt(360)).min(1).max(240).optional(),
  sai_so: z.number().min(-1).max(360).optional(),
  mau_2: z.array(z.number().min(0).lt(360)).min(1).max(240).optional(),
  sai_so_2: z.number().min(-1).max(360).optional(),
  sinh: z.object({
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gender: z.enum(["nam", "nu"]),
    moc_nam: z.enum(["lap_xuan", "tet_viet", "tet_trung"]).optional(),
  }).strict().optional(),
}).strict().refine((v) => (v.do_huong == null) !== (v.mau == null), { message: "cần đúng một trong hai: do_huong hoặc mau" });

export function POST(req: Request) {
  return goiEngine(req, Input, "/v1/phongthuy/do-huong");
}

// POST /api/phongthuy/doc-ban-ve — TY-2 đợt 4 "Máy đọc bản vẽ": chuyển tiếp MỘT ảnh bản vẽ mặt bằng (base64, đã thu nhỏ trên
// trình duyệt) tới engine → engine gọi mô hình thị giác qua lớp narrative, trả CHỖ gợi ý (toạ độ theo ảnh, `can_xac_nhan`).
// Chỉ đi khi người dùng tự tích đồng ý ở giao diện. Máy chủ web KHÔNG lưu, KHÔNG log thân yêu cầu. Trần ≤ 1.600.000 ký tự.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";

export const maxDuration = 60;

const MOI_ANH = 1_600_000;

const Input = z.object({
  anh: z.object({
    du_lieu: z.string().min(16).max(MOI_ANH).regex(/^[A-Za-z0-9+/]+={0,2}$/),
    loai: z.enum(["image/jpeg", "image/png", "image/webp"]),
  }).strict(),
  loai_nha: z.enum(["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"]).nullable().optional(),
  tang: z.number().int().min(1).max(10).nullable().optional(),
}).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const tho = await req.text().catch(() => "");
  if (tho.length > MOI_ANH + 4096) return NextResponse.json({ error: "Ảnh quá nặng — chọn ảnh nhỏ hơn." }, { status: 413 });
  let json: unknown = null;
  try { json = JSON.parse(tho); } catch { /* zod báo */ }
  const vao = Input.safeParse(json);
  if (!vao.success) return NextResponse.json({ error: "Ảnh gửi lên chưa hợp lệ — thử chọn lại ảnh." }, { status: 422 });
  const kq = await goiEngineDaKiem(vao.data, "/v1/phongthuy/doc-ban-ve", dauNguoiGoi(req));
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}

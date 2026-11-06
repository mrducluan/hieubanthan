// POST /api/nhan-tuong/doc-anh — NT-1 "Để máy gợi ý từ ảnh" (mặc định TẮT ở engine): chuyển tiếp MỘT ảnh chân dung (base64,
// đã thu nhỏ trên trình duyệt) → engine gọi mô hình thị giác và trả GỢI Ý lựa chọn (`can_xac_nhan: true`). Chỉ đi khi người
// dùng tự tích đồng ý. Máy chủ web KHÔNG lưu, KHÔNG log thân yêu cầu. Trần ≤ 1.600.000 ký tự.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";

export const maxDuration = 60;
const MOI_ANH = 1_600_000;
const Anh = z.object({ du_lieu: z.string().min(16).max(MOI_ANH).regex(/^[A-Za-z0-9+/]+={0,2}$/), loai: z.enum(["image/jpeg", "image/png", "image/webp"]) }).strict();
const Input = z.object({ anh: z.array(Anh).min(1).max(1) }).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const tho = await req.text().catch(() => "");
  if (tho.length > MOI_ANH + 8192) return NextResponse.json({ error: "Ảnh quá nặng — chọn ảnh nhỏ hơn." }, { status: 413 });
  let json: unknown = null;
  try { json = JSON.parse(tho); } catch { /* zod báo */ }
  const vao = Input.safeParse(json);
  if (!vao.success) return NextResponse.json({ error: "Ảnh gửi lên chưa hợp lệ — thử chọn lại ảnh." }, { status: 422 });
  const kq = await goiEngineDaKiem(vao.data, "/v1/nhan-tuong/doc-anh", dauNguoiGoi(req));
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}

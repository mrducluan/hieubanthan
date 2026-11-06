// POST /api/nhan-tuong/doc-anh — ANH-1 "Tải ảnh chân dung" (engine mặc định TẮT): chuyển tiếp ≤ 3 ảnh (chính diện + nghiêng
// trái / phải; base64 đã thu nhỏ trên trình duyệt) → engine gọi mô hình thị giác và trả GỢI Ý lựa chọn (`can_xac_nhan: true`)
// + kết quả kiểm "đúng một gương mặt". Chỉ đi khi người dùng đã tích thoả thuận (`dong_y: true` — máy chủ từ chối lượt
// thiếu). Máy chủ web KHÔNG lưu, KHÔNG log thân yêu cầu. Trần ≤ 1.600.000 ký tự mỗi ảnh.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";

export const maxDuration = 60;
const MOI_ANH = 1_600_000;
const SO_ANH = 3;
const Anh = z.object({ du_lieu: z.string().min(16).max(MOI_ANH).regex(/^[A-Za-z0-9+/]+={0,2}$/), loai: z.enum(["image/jpeg", "image/png", "image/webp"]),
  goc: z.enum(["thang", "nghieng_trai", "nghieng_phai"]).optional() }).strict();
const Input = z.object({ anh: z.array(Anh).min(1).max(SO_ANH), dong_y: z.literal(true) }).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const tho = await req.text().catch(() => "");
  if (tho.length > SO_ANH * MOI_ANH + 8192) return NextResponse.json({ error: "Ảnh quá nặng — chọn ảnh nhỏ hơn." }, { status: 413 });
  let json: unknown = null;
  try { json = JSON.parse(tho); } catch { /* zod báo */ }
  const vao = Input.safeParse(json);
  if (!vao.success) return NextResponse.json({ error: "Ảnh gửi lên chưa hợp lệ — thử chọn lại ảnh." }, { status: 422 });
  const kq = await goiEngineDaKiem(vao.data, "/v1/nhan-tuong/doc-anh", dauNguoiGoi(req));
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}

// POST /api/phongthuy/doc-anh — PT-V2 "Để máy đọc ảnh": chuyển tiếp 1–3 ảnh nhà (base64, đã thu nhỏ trên trình duyệt)
// tới engine → engine gọi mô hình thị giác qua lớp narrative và trả dấu hiệu GỢI Ý (`can_xac_nhan: true`); người dùng
// xác nhận rồi hệ thống mới luận. Chỉ đi khi người dùng tự tích đồng ý ở giao diện. Máy chủ web KHÔNG lưu, KHÔNG log
// thân yêu cầu (không Sentry body — lib/giam-sat đã bỏ request.data). Trần: mỗi ảnh ≤ 1.600.000 ký tự, tổng ≤ 4.000.000.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";

export const maxDuration = 60;

const MOI_ANH = 1_600_000;
const TONG = 4_000_000;
const QUA_LON = { error: "Ảnh quá nặng — chọn ít ảnh hơn hoặc ảnh nhỏ hơn." } as const;

const Anh = z.object({
  du_lieu: z.string().min(16).max(MOI_ANH).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  loai: z.enum(["image/jpeg", "image/png", "image/webp"]),
}).strict();
const Input = z.object({
  anh: z.array(Anh).min(1).max(3),
  goc: z.string().trim().max(60).nullable().optional(),
  loai_nha: z.enum(["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"]).nullable().optional(),
  y_dinh: z.string().regex(/^[a-z_]{3,30}$/).nullable().optional(),
}).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const tho = await req.text().catch(() => "");
  if (tho.length > TONG + 8192) return NextResponse.json(QUA_LON, { status: 413 });
  let json: unknown = null;
  try { json = JSON.parse(tho); } catch { /* zod báo */ }
  const vao = Input.safeParse(json);
  if (!vao.success) return NextResponse.json({ error: "Ảnh gửi lên chưa hợp lệ — thử chọn lại ảnh." }, { status: 422 });
  if (vao.data.anh.reduce((s, a) => s + a.du_lieu.length, 0) > TONG) return NextResponse.json(QUA_LON, { status: 413 });
  const kq = await goiEngineDaKiem(vao.data, "/v1/phongthuy/doc-anh", dauNguoiGoi(req));
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}

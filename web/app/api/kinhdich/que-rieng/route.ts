// POST /api/kinhdich/que-rieng — KD-2c (P8) "Quẻ ngày của bạn": Mai Hoa theo HAI SỐ người dùng tự chọn + giờ lúc khởi (giờ VN).
// Engine tính + nghĩa nôm na KB; web chỉ hiển thị và nhớ trên máy theo ngày. Không câu hỏi, không hồ sơ, không hạn mức hỏi đáp
// (không có lời đọc AI). `thoi_diem` tuỳ chọn (giờ VN không múi) để kết quả nhớ trên máy khớp lúc khởi.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";

const Input = z.object({
  so: z.array(z.number().int().min(1).max(9999)).length(2),
  thoi_diem: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).optional(),
}).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Cần hai số nguyên từ 1 đến 9999." }, { status: 422 });
  const r = await goiEngineDaKiem(p.data, "/v1/kinhdich/que-rieng", dauNguoiGoi(req));
  return r.ok ? NextResponse.json(r.body) : r.res;
}

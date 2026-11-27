// POST /api/co-van/nhan-dien — khung hỏi đáp hỏi: câu vừa hỏi có phải MỘT QUYẾT ĐỊNH mà Cố vấn đọc được không (gợi ý "xem ba cách
// nhìn"). Chỉ nhận câu hỏi (không ngày sinh), không lưu, không ghi nhật ký. Cùng mức tin cậy với route hỏi đáp (câu vốn đã tới engine).
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem, loiChung, laBanAnh } from "@/lib/proxy";

const Input = z.object({ cau_hoi: z.string().trim().min(3).max(500) }).strict();
export const maxDuration = 10;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  const kq = await goiEngineDaKiem(parsed.data, "/v1/co-van/nhan-dien", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json(kq.body, { headers: { "cache-control": "no-store" } });
}

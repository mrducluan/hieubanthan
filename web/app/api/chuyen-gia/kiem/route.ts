// POST /api/chuyen-gia/kiem {cau_hoi} — kiểm TRƯỚC khi mua: câu khủng hoảng ('an_toan') → lời hỗ trợ, không bán; câu ngoài
// phạm vi ('tu_choi_nhe': xổ số, ngày chết, chẩn đoán bệnh, tuyển dụng) → từ chối nhẹ. Engine RULES (/v1/hoi/dac-biet),
// không LLM, không lưu câu. Máy chủ kiểm lại lần nữa ở /api/chuyen-gia/tao.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";

const Vao = z.object({ cau_hoi: z.string().trim().min(1).max(1500) }).strict();

export async function POST(req: Request) {
  const vao = Vao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const kq = await goiEngineDaKiem({ cau_hoi: vao.data.cau_hoi.slice(0, 500) }, "/v1/hoi/dac-biet", dauNguoiGoi(req));
  if (!kq.ok) return kq.res;
  return NextResponse.json({ loai: (kq.body as { loai?: string | null })?.loai ?? null });
}

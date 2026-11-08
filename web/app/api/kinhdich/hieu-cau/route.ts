// POST /api/kinhdich/hieu-cau — KD-V3: hiểu câu hỏi TRƯỚC khi gieo (kiểu câu, chủ đề gợi ý, câu làm rõ) để trang điền sẵn
// chủ đề. Engine chỉ trả mã + nhãn danh mục cố định (không trả lại câu người dùng); web không ghi nhật ký, không cache theo câu.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi } from "@/lib/proxy";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;
const Input = z.object({ cau_hoi: z.string().min(3).max(500) }).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  try {
    const r = await fetch(`${ENGINE_URL}/v1/kinhdich/hieu-cau`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...dauNguoiGoi(req) },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    if (!r.ok) return NextResponse.json({ error: "Chưa hiểu được câu hỏi." }, { status: 502 });
    return NextResponse.json(await r.json());
  } catch {
    return NextResponse.json({ error: "Chưa hiểu được câu hỏi." }, { status: 502 });
  }
}

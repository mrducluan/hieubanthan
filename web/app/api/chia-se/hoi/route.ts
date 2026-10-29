// POST /api/chia-se/hoi — HD-CS đợt 3 (ý 2): ký mã thẻ "một câu trả lời". Nhận mảng + câu hỏi chuẩn + khối hình dạng gọn
// (lib/the-hoi.ts — chỉ số danh mục cố định + con số; zod chặn mọi chữ tự do). Câu hỏi phải nằm trong danh mục engine công bố
// cho đúng mảng, nếu không → 422. KHÔNG nhận câu người dùng gõ, lời trả lời hay ngày sinh.
import { NextResponse } from "next/server";
import { z } from "zod";
import { kyMaHoi, tuTuMa } from "@/lib/ma-moi";
import { traLoiChiaSe } from "@/lib/loi-chia-se";
import { MANG_THE, TheGon } from "@/lib/the-hoi";
import { cauChuan } from "@/lib/cau-chuan";

const Input = z.object({ mang: z.enum(MANG_THE), cau: z.string().trim().min(3).max(80), khoi: TheGon }).strict();

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { mang, cau, khoi } = p.data;
  if (!((await cauChuan())[mang] ?? []).includes(cau)) return NextResponse.json({ error: "Câu này chưa tạo được thẻ." }, { status: 422 });
  try {
    const ma = kyMaHoi({ m: mang, c: cau, g: khoi });
    return NextResponse.json({ ma, tu: tuTuMa("hq", ma) });
  } catch (e) {
    return traLoiChiaSe(e, "hoi");
  }
}

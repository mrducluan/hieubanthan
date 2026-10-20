// POST /api/thanso/cay-hai-nguoi — TS-V3b "Cây của hai người": đường nối Sephirah ngày sinh hai người trên Cây Sự sống.
// Hai cách: biết ngày sinh cả hai (trang Hợp đôi) · hoặc người được mời: Sephirah người mời lấy TỪ MÃ ĐÃ KÝ (không tin
// client, không có ngày sinh người mời). Engine tính, không lưu.
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { docMa } from "@/lib/ma-moi";

const Sinh = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
}).strict();
const Input = z.union([
  z.object({ a: Sinh, b: Sinh }).strict(),
  z.object({ ma: z.string().min(10).max(600), b: Sinh }).strict(),
]);

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  let a: z.infer<typeof Sinh> | { sephirah: number };
  if ("ma" in p.data) {
    const nd = docMa(p.data.ma);
    if (!nd) return NextResponse.json({ error: "Lời mời không hợp lệ hoặc đã hết hạn." }, { status: 410 });
    if (!nd.sp) return NextResponse.json({ error: "Lời mời này tạo trước khi có Cây của hai người." }, { status: 409 });
    a = { sephirah: nd.sp };
  } else {
    a = p.data.a;
  }
  const kq = await goiEngineDaKiem({ a, b: p.data.b }, "/v1/thanso/cay-hai-nguoi", dauNguoiGoi(req));
  return kq.ok ? NextResponse.json(kq.body) : kq.res;
}

// GET /api/hoi/cau-chuan?mang=…&cau=… — HD-CS đợt 3: câu này có thuộc danh mục câu chuẩn của mảng không (để khung hỏi đáp
// điền sẵn câu khi người nhận thẻ mở trang). Chỉ trả có / không — câu ngoài danh mục không bao giờ được điền vào ô hỏi.
import { NextResponse } from "next/server";
import { cauChuan } from "@/lib/cau-chuan";

export async function GET(req: Request): Promise<NextResponse> {
  const u = new URL(req.url);
  const mang = u.searchParams.get("mang") ?? "";
  const cau = (u.searchParams.get("cau") ?? "").slice(0, 120);
  const ds = (await cauChuan())[mang] ?? [];
  return NextResponse.json({ co: ds.includes(cau) }, { headers: { "cache-control": "public, max-age=600" } });
}

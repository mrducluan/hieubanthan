// GET /api/luan-giai/phi — giao diện hỏi giá "Luận giải toàn bộ" và công tắc thu Sao (SAO-LG).
import { NextResponse } from "next/server";
import { dangThuSao, giaLuanGiaiSao } from "@/lib/luan-giai-sao";

export const dynamic = "force-dynamic";

export async function GET() {
  const [thu, gia] = await Promise.all([dangThuSao(), giaLuanGiaiSao()]);
  return NextResponse.json({ thu, gia });
}

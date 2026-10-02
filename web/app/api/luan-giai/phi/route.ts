// GET /api/luan-giai/phi — giao diện hỏi giá "Luận giải toàn bộ" và công tắc thu Sao (SAO-LG).
import { NextResponse } from "next/server";
import { dangThuSao, GIA_LUAN_GIAI_SAO } from "@/lib/luan-giai-sao";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ thu: dangThuSao(), gia: GIA_LUAN_GIAI_SAO });
}

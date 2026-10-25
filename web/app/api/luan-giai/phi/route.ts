// GET /api/luan-giai/phi?mo_dun=<tuvi|battu|thanso> — giao diện hỏi giá "Luận giải toàn bộ" và công tắc thu Sao (SAO-LG).
// SAO-V: công tắc chung HOẶC công tắc riêng của mảng đang xem (luan_giai.thu_sao.<mảng>). Không có mo_dun → công tắc chung.
import { NextResponse } from "next/server";
import { dangThuSao, giaLuanGiaiSao } from "@/lib/luan-giai-sao";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const moDun = new URL(req.url).searchParams.get("mo_dun");
  const [thu, gia] = await Promise.all([dangThuSao(moDun), giaLuanGiaiSao()]);
  return NextResponse.json({ thu, gia });
}

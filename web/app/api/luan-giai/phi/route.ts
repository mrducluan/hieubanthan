// GET /api/luan-giai/phi?mo_dun=<tuvi|battu|thanso> — giao diện hỏi giá "Luận giải toàn bộ" và công tắc thu Sao (SAO-LG).
// GIA-99: giá theo báo cáo (mo_dun có giá riêng thì trả giá riêng).
// SAO-V: công tắc chung HOẶC công tắc riêng của mảng đang xem (luan_giai.thu_sao.<mảng>). Không có mo_dun → công tắc chung.
import { NextResponse } from "next/server";
import { dangThuSao, giaLuanGiaiSao } from "@/lib/luan-giai-sao";
import { uuDaiCho } from "@/lib/uu-dai-may-chu";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const moDun = new URL(req.url).searchParams.get("mo_dun");
  const [thu, gia] = await Promise.all([dangThuSao(moDun), giaLuanGiaiSao(moDun)]);
  // UD-1: đang có đợt ưu đãi → `gia` là giá đang áp dụng, `uu_dai` mang giá thường + hạn chót + suất còn lại.
  const uuDai = thu ? await uuDaiCho(gia) : null;
  return NextResponse.json(uuDai ? { thu, gia: uuDai.gia, uu_dai: uuDai } : { thu, gia });
}

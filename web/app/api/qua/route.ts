// GET  /api/qua — người đang đăng nhập còn tặng được bao nhiêu chương trong 30 ngày (hàm SQL qua_cua_toi, migration 0025).
// POST /api/qua {mo_dun} — tạo link quà "Tặng một chương" (hàm SQL tao_qua_chuong: chỉ người đã mở Luận giải toàn bộ
// bằng Sao, công tắc sao.qua.bat, trần sao.qua.tran_30_ngay). Không trả mã quà người khác, không lộ người nhận.
import { NextResponse } from "next/server";
import { phienNguoiDung } from "@/lib/cua-sao";
import { mangLuanGiai } from "@/lib/luan-giai-mang";

export const dynamic = "force-dynamic";

const TAT = { bat: false, tran: 0, da_gui_30_ngay: 0, co_the_tang: false };

export async function GET() {
  const phien = await phienNguoiDung();
  if (!phien) return NextResponse.json(TAT);
  const { data, error } = await phien.sb.rpc("qua_cua_toi");
  if (error || !data) return NextResponse.json(TAT);         // chưa chạy 0025 → coi như chưa mở tặng quà
  const d = data as typeof TAT;
  return NextResponse.json({ bat: Boolean(d.bat), tran: Number(d.tran) || 0, da_gui_30_ngay: Number(d.da_gui_30_ngay) || 0,
    co_the_tang: Boolean(d.co_the_tang) });
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { mo_dun?: unknown } | null;
  const mang = mangLuanGiai(typeof b?.mo_dun === "string" ? b.mo_dun : null);
  if (!mang) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const phien = await phienNguoiDung();
  if (!phien) return NextResponse.json({ error: "Đăng nhập để tặng quà.", can: "dang_nhap" }, { status: 401 });
  const { data, error } = await phien.sb.rpc("tao_qua_chuong", { p_mo_dun: mang });
  if (error || !data) return NextResponse.json({ error: "Chưa tạo được quà, thử lại sau ít phút." }, { status: 502 });
  return NextResponse.json(data);
}

// GET  /api/qua/<mã> — trạng thái trang nhận quà (quà còn dùng được không, người xem đã đăng nhập / lưu hồ sơ chưa).
// POST /api/qua/<mã> — nhận quà bằng phiên của chính người dùng (hàm SQL nhan_qua_chuong, migration 0025).
// SAO-V "Tặng một chương": quà là nội dung (thêm 1 chương trong báo cáo của chính người nhận), không phải Sao.
import { NextResponse } from "next/server";
import { phienNguoiDung } from "@/lib/cua-sao";
import { MA_QUA } from "@/lib/luan-giai-mang";
import { docQua } from "@/lib/qua-chuong";

export const dynamic = "force-dynamic";

interface Ctx { params: Promise<{ ma: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const { ma } = await params;
  if (!MA_QUA.test(ma)) return NextResponse.json({ qua: null, dang_nhap: false, co_ho_so: false });
  const tt = await docQua(ma);
  return tt ? NextResponse.json(tt) : NextResponse.json({ error: "Chưa đọc được quà, thử lại sau ít phút." }, { status: 503 });
}

export async function POST(_req: Request, { params }: Ctx) {
  const { ma } = await params;
  if (!MA_QUA.test(ma)) return NextResponse.json({ ket_qua: "khong_hop_le" });
  const phien = await phienNguoiDung();
  if (!phien) return NextResponse.json({ error: "Đăng nhập để nhận quà.", can: "dang_nhap" }, { status: 401 });
  const { data, error } = await phien.sb.rpc("nhan_qua_chuong", { p_ma: ma });
  if (error || !data) return NextResponse.json({ error: "Chưa nhận được quà, thử lại sau ít phút." }, { status: 502 });
  return NextResponse.json(data);
}

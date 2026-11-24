// GET /api/li-xi/[ma] — xem thông tin công khai (Zero-PII) của 1 bao lì xì.
// POST /api/li-xi/[ma] — người nhận đăng nhập & mở khoá quyền đọc trọn Báo cáo Năm 2027 (/thoi-gian-toi) từ LÌ XÌ TẾT 2027.
import { NextResponse } from "next/server";
import { khachNguoiMua } from "@/lib/thanh-toan/cong";
import { docLiXi } from "@/lib/li-xi-may-chu";
import { MA_LI_XI_RE } from "@/lib/li-xi-tet";

type Ctx = { params: Promise<{ ma: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { ma } = await params;
  if (!MA_LI_XI_RE.test(ma)) return NextResponse.json({ co: false }, { status: 404 });
  const d = await docLiXi(ma);
  return NextResponse.json(d, { status: d.co ? 200 : 404, headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request, { params }: Ctx) {
  const { ma } = await params;
  if (!MA_LI_XI_RE.test(ma)) return NextResponse.json({ error: "Mã bao lì xì không hợp lệ." }, { status: 404 });
  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập để nhận bao lì xì vào tài khoản của bạn.", can: "dang_nhap" }, { status: 401 });

  const { data, error } = await nm.sb.rpc("nhan_li_xi_tet", { p_ma: ma });
  if (error) return NextResponse.json({ error: "Chưa nhận được bao lì xì, thử lại sau ít phút." }, { status: 502 });
  const d = data as { ket_qua: string; nam?: number; het_han?: string };
  if (d.ket_qua === "da_nhan" || d.ket_qua === "da_nhan_boi_ban") {
    return NextResponse.json(d);
  }
  const msg = d.ket_qua === "da_co_nguoi_nhan" ? "Bao lì xì này đã có người khác nhận."
    : d.ket_qua === "het_han" ? "Bao lì xì này đã quá hạn nhận."
    : "Không tìm thấy bao lì xì này.";
  return NextResponse.json({ error: msg, ket_qua: d.ket_qua }, { status: d.ket_qua === "khong_co" ? 404 : 409 });
}

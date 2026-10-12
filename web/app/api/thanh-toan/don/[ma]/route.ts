// GET /api/thanh-toan/don/{ma} — trạng thái đơn của CHÍNH người mua (RLS). Đơn payOS còn "chờ" thì tra thẳng payOS
// (người mua đang đợi ở trang kết quả) → webhook có lỡ thì Sao vẫn vào ngay.
import { NextResponse } from "next/server";
import { khachDichVu, khachNguoiMua } from "@/lib/thanh-toan/cong";
import { doiSoatMotDon } from "@/lib/thanh-toan/doi-soat";

export async function GET(req: Request, { params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  if (!/^\d{1,15}$/.test(ma)) return NextResponse.json({ error: "Mã đơn không hợp lệ" }, { status: 422 });
  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập.", can: "dang_nhap" }, { status: 401 });
  const doc = () => nm.sb.from("don_nap").select("ma_don,goi,so_tien,sao,cong,trang_thai,tao_luc,het_han,tra_luc")
    .eq("ma_don", Number(ma)).maybeSingle();
  let { data } = await doc();
  if (!data) return NextResponse.json({ error: "Không thấy đơn." }, { status: 404 });
  if (data.trang_thai === "cho" && data.cong === "payos") {
    const dv = khachDichVu();
    if (dv && (await doiSoatMotDon(dv, Number(ma)))) ({ data } = await doc());
  }
  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}

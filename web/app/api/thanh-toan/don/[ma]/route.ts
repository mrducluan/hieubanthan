// GET /api/thanh-toan/don/{ma} — trạng thái đơn của CHÍNH người mua (RLS). Đơn Pay2S còn "chờ" thì đối soát qua lịch
// sử giao dịch ngân hàng (người mua đang đợi ở trang kết quả) → IPN có lỡ thì Sao vẫn vào ngay.
import { NextResponse } from "next/server";
import { khachDichVu, khachNguoiMua } from "@/lib/thanh-toan/cong";
import { doiSoatMotDon } from "@/lib/thanh-toan/doi-soat";

export async function GET(req: Request, { params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  if (!/^\d{1,15}$/.test(ma)) return NextResponse.json({ error: "Mã đơn không hợp lệ" }, { status: 422 });
  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập.", can: "dang_nhap" }, { status: 401 });
  const doc = () => nm.sb.from("don_nap").select("ma_don,goi,so_tien,sao,cong,trang_thai,tao_luc,het_han,tra_luc,loai")
    .eq("ma_don", Number(ma)).maybeSingle();
  let { data } = await doc();
  if (!data) return NextResponse.json({ error: "Không thấy đơn." }, { status: 404 });
  // Chỉ tra khi đơn đã ≥ 20 giây (người mua kịp quét QR) — bớt gọi API lịch sử (giới hạn 60 lượt/phút).
  if (data.trang_thai === "cho" && data.cong === "pay2s" && Date.now() - new Date(data.tao_luc).getTime() > 20_000) {
    const dv = khachDichVu();
    if (dv && (await doiSoatMotDon(dv, { ma_don: Number(ma), tao_luc: data.tao_luc }))) ({ data } = await doc());
  }
  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}

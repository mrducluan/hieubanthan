// POST /api/thanh-toan/gia {ma_don} — CỔNG GIẢ: giả lập "đã nhận tiền" cho đơn của chính người gọi, để thử trọn luồng
// trên bản preview. Chỉ chạy khi THANH_TOAN_GIA=1 và KHÔNG phải production (lib/thanh-toan/cong.ts).
import { NextResponse } from "next/server";
import { z } from "zod";
import { choPhepCongGia, khachDichVu, khachNguoiMua } from "@/lib/thanh-toan/cong";

const Vao = z.object({ ma_don: z.number().int().positive() });

export async function POST(req: Request) {
  if (!choPhepCongGia()) return NextResponse.json({ error: "Không có" }, { status: 404 });
  const vao = Vao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập." }, { status: 401 });
  const { data: don } = await nm.sb.from("don_nap").select("ma_don,so_tien,cong").eq("ma_don", vao.data.ma_don).maybeSingle();
  if (!don || don.cong !== "gia") return NextResponse.json({ error: "Không thấy đơn." }, { status: 404 });
  const dv = khachDichVu();
  if (!dv) {
    // Tên khoá chỉ vào log máy chủ; người thử chỉ thấy câu thường.
    console.error("[thanh-toan/gia] thiếu SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json({ error: "Cổng thử chưa sẵn sàng, bạn thử lại sau nhé." }, { status: 503 });
  }
  const { data, error } = await dv.rpc("nap_sao_tu_cong", {
    p_ma_don: don.ma_don, p_so_tien: don.so_tien, p_cong: "gia", p_ma_giao_dich: `gia-${don.ma_don}`,
  });
  if (error) return NextResponse.json({ error: "Chưa ghi được" }, { status: 502 });
  return NextResponse.json(data);
}

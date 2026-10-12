// POST /api/thanh-toan/tao-don {goi} — tạo đơn nạp Sao. Số tiền + Sao do hàm SQL tao_don_nap lấy từ bảng goi_sao
// (KHÔNG tin trình duyệt). payOS: tạo link thanh toán (QR VietQR + mở app ngân hàng) rồi trả checkoutUrl.
import { NextResponse } from "next/server";
import { z } from "zod";
import { congDangBat, khachDichVu, khachNguoiMua } from "@/lib/thanh-toan/cong";
import { cauHinhPayos, moTaChuyenKhoan, taoLink } from "@/lib/thanh-toan/payos";
import { siteUrl } from "@/lib/seo";

const Vao = z.object({ goi: z.string().regex(/^[a-z0-9_]{2,30}$/) });

const LOI: Record<string, [string, number]> = {
  goi_khong_hop_le: ["Gói này không còn bán.", 422],
  cong_khong_hop_le: ["Cổng thanh toán chưa sẵn sàng.", 503],
  qua_nhieu_don: ["Bạn đang có nhiều đơn chờ thanh toán. Hoàn tất hoặc chờ 15 phút rồi thử lại.", 429],
};

export async function POST(req: Request) {
  const cong = congDangBat();
  if (!cong) return NextResponse.json({ error: "Nạp Sao chưa mở." }, { status: 503 });
  const vao = Vao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập để nạp Sao.", can: "dang_nhap" }, { status: 401 });

  const { data, error } = await nm.sb.rpc("tao_don_nap", { p_goi: vao.data.goi, p_cong: cong });
  if (error) return NextResponse.json({ error: "Chưa tạo được đơn, thử lại sau ít phút." }, { status: 502 });
  const d = data as { ket_qua: string; ma_don: number; so_tien: number; sao: number; ten_goi: string; het_han: string };
  if (d.ket_qua !== "da_tao") {
    const [msg, st] = LOI[d.ket_qua] ?? ["Chưa tạo được đơn.", 400];
    return NextResponse.json({ error: msg }, { status: st });
  }

  const ketQua = `${siteUrl()}/nap-sao/ket-qua?ma=${d.ma_don}`;
  if (cong === "gia") {
    return NextResponse.json({ ma_don: d.ma_don, so_tien: d.so_tien, sao: d.sao, cong, checkoutUrl: `/nap-sao/gia?ma=${d.ma_don}` });
  }
  const c = cauHinhPayos()!;
  try {
    const link = await taoLink(c, {
      orderCode: d.ma_don, amount: d.so_tien, description: moTaChuyenKhoan(d.ma_don), tenGoi: `Gói ${d.ten_goi} · ${d.sao} Sao`,
      returnUrl: ketQua, cancelUrl: `${ketQua}&huy=1`, hetHanGiay: Math.floor(new Date(d.het_han).getTime() / 1000),
    });
    if (link.paymentLinkId) await khachDichVu()?.rpc("gan_link_don", { p_ma_don: d.ma_don, p_link_id: link.paymentLinkId });
    return NextResponse.json({ ma_don: d.ma_don, so_tien: d.so_tien, sao: d.sao, cong, checkoutUrl: link.checkoutUrl });
  } catch {
    await nm.sb.rpc("huy_don_nap", { p_ma_don: d.ma_don });
    return NextResponse.json({ error: "Cổng thanh toán đang bận, thử lại sau ít phút." }, { status: 502 });
  }
}

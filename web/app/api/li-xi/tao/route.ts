// POST /api/li-xi/tao — tạo đơn Lì xì Tết 2027 (loai='li_xi', 0042). Giá do SQL lấy từ cấu hình (không tin trình duyệt);
// trả tiền xong cổng đưa về /nap-sao/ket-qua như mọi đơn khác (trang kết quả nhận loai li_xi).
import { NextResponse } from "next/server";
import { z } from "zod";
import { congDangBat, khachDichVu, khachNguoiMua } from "@/lib/thanh-toan/cong";
import { cauHinhPay2s, maPay2s, taoLink } from "@/lib/thanh-toan/pay2s";
import { siteUrl } from "@/lib/seo";
import { ghiMetaDon } from "@/lib/meta-capi";
import { ghiGoogleDon } from "@/lib/google-offline";
import { dangThuSao } from "@/lib/luan-giai-sao";
import { kiemLoiChuc, kiemTen, MAU_THIEP } from "@/lib/li-xi-tet";

const Vao = z.object({
  so_bao: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  mau_thiep: z.enum(MAU_THIEP).default("do_son"),
  ten_nguoi_tang: z.string().trim().max(40).optional(),
  loi_chuc: z.string().trim().max(160).optional(),
  meta: z.boolean().optional(),
  google: z.unknown().optional(),
}).strict();

const LOI: Record<string, [string, number]> = {
  chua_dang_nhap: ["Hãy đăng nhập để mua Lì xì Tết 2027.", 401],
  chua_mo: ["Lì xì Tết 2027 chưa mở bán.", 503],
  cong_khong_hop_le: ["Cổng thanh toán chưa sẵn sàng.", 503],
  goi_khong_hop_le: ["Gói lì xì không hợp lệ.", 422],
  mau_khong_hop_le: ["Mẫu thiệp không hợp lệ.", 422],
  ten_khong_hop_le: ["Tên người tặng chỉ gồm chữ, tối đa 40 ký tự.", 422],
  loi_chuc_khong_hop_le: ["Lời chúc tối đa 160 ký tự, không kèm đường dẫn, số điện thoại hay số tài khoản.", 422],
  qua_nhieu_don: ["Bạn đang có nhiều đơn chờ thanh toán. Hoàn tất hoặc chờ 15 phút rồi thử lại.", 429],
};

export async function POST(req: Request) {
  const vao = Vao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Thông tin đơn lì xì không hợp lệ." }, { status: 422 });
  const { so_bao, mau_thiep, ten_nguoi_tang, loi_chuc, meta, google } = vao.data;
  // Lọc lại ở máy chủ (SQL lọc lần nữa) — gọi thẳng API không lách được bộ lọc của trình duyệt.
  const loiChu = kiemTen(ten_nguoi_tang ?? "") ?? kiemLoiChuc(loi_chuc ?? "");
  if (loiChu) return NextResponse.json({ error: loiChu }, { status: 422 });

  const cong = congDangBat();
  if (!cong) return NextResponse.json({ error: "Cổng thanh toán chưa mở." }, { status: 503 });
  // Không bán quà cho thứ đang miễn phí: báo cáo Thời gian tới chưa thu Sao thì lì xì chưa mở bán.
  if (!(await dangThuSao("thoi_gian"))) return NextResponse.json({ error: LOI.chua_mo![0] }, { status: 503 });

  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập để tạo bao lì xì.", can: "dang_nhap" }, { status: 401 });

  const { data, error } = await nm.sb.rpc("tao_don_li_xi", {
    p_cong: cong, p_so_bao: so_bao, p_mau_thiep: mau_thiep,
    p_ten_nguoi_tang: ten_nguoi_tang || null, p_loi_chuc: loi_chuc || null,
  });
  if (error) return NextResponse.json({ error: "Chưa tạo được đơn lì xì, thử lại sau ít phút." }, { status: 502 });
  const d = data as { ket_qua: string; ma_don?: number; so_tien?: number; so_bao?: number };
  if (d.ket_qua !== "da_tao" || !d.ma_don || !d.so_tien) {
    const [msg, st] = LOI[d.ket_qua] ?? ["Chưa tạo được đơn lì xì.", 400];
    return NextResponse.json({ error: msg }, { status: st });
  }

  await ghiMetaDon(khachDichVu(), d.ma_don, req, meta === true);
  await ghiGoogleDon(khachDichVu(), d.ma_don, google as never, meta === true);
  if (cong === "gia") {
    return NextResponse.json({ ma_don: d.ma_don, so_tien: d.so_tien, so_bao: d.so_bao, cong, loai: "li_xi",
      checkoutUrl: `/nap-sao/gia?ma=${d.ma_don}` });
  }
  const c = cauHinhPay2s();
  if (!c) {
    await nm.sb.rpc("huy_don_nap", { p_ma_don: d.ma_don });
    return NextResponse.json({ error: "Cổng thanh toán chưa sẵn sàng." }, { status: 503 });
  }
  try {
    const ma = maPay2s(d.ma_don);
    const link = await taoLink(c, {
      orderId: ma, orderInfo: ma, amount: d.so_tien,
      tenDon: `Hiểu Bản Thân · Lì xì Tết 2027 (${so_bao} bao)`,
      redirectUrl: `${siteUrl()}/nap-sao/ket-qua?ma=${d.ma_don}`,
      ipnUrl: `${siteUrl()}/api/thanh-toan/webhook/pay2s`,
    });
    await khachDichVu()?.rpc("gan_link_don", { p_ma_don: d.ma_don, p_link_id: ma });
    return NextResponse.json({ ma_don: d.ma_don, so_tien: d.so_tien, so_bao: d.so_bao, cong, loai: "li_xi", checkoutUrl: link.payUrl });
  } catch {
    await nm.sb.rpc("huy_don_nap", { p_ma_don: d.ma_don });
    return NextResponse.json({ error: "Cổng thanh toán đang bận, thử lại sau ít phút." }, { status: 502 });
  }
}

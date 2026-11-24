// POST /api/li-xi/tao — tạo đơn Lì xì Báo cáo Tết 2027 (loai='li_xi' qua Pay2S hoặc cổng giả).
import { NextResponse } from "next/server";
import { z } from "zod";
import { congDangBat, khachDichVu, khachNguoiMua } from "@/lib/thanh-toan/cong";
import { cauHinhPay2s, maPay2s, taoLink } from "@/lib/thanh-toan/pay2s";
import { siteUrl } from "@/lib/seo";
import { MAU_THIEP } from "@/lib/li-xi-tet";

const Vao = z.object({
  so_bao: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  mau_thiep: z.enum(MAU_THIEP).default("do_son"),
  ten_nguoi_tang: z.string().trim().max(40).optional(),
  loi_chuc: z.string().trim().max(160).optional(),
}).strict();

const LOI: Record<string, [string, number]> = {
  chua_dang_nhap: ["Hãy đăng nhập để mua Lì xì Tết 2027.", 401],
  chua_mo: ["Chương trình Lì xì Báo cáo Tết 2027 chưa mở bán.", 503],
  cong_khong_hop_le: ["Cổng thanh toán chưa sẵn sàng.", 503],
  goi_khong_hop_le: ["Gói Lì xì không hợp lệ.", 422],
  mau_khong_hop_le: ["Mẫu thiệp không hợp lệ.", 422],
  ten_qua_dai: ["Tên người tặng tối đa 40 ký tự.", 422],
  loi_chuc_khong_hop_le: ["Lời chúc tối đa 160 ký tự và không chứa link, email hoặc số điện thoại.", 422],
};

export async function POST(req: Request) {
  const vao = Vao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Thông tin đơn Lì xì không hợp lệ." }, { status: 422 });

  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập để tạo Bao Lì Xì.", can: "dang_nhap" }, { status: 401 });

  const cong = congDangBat();
  if (!cong) return NextResponse.json({ error: "Cổng thanh toán chưa mở." }, { status: 503 });

  const { so_bao, mau_thiep, ten_nguoi_tang, loi_chuc } = vao.data;
  const { data, error } = await nm.sb.rpc("tao_don_li_xi", {
    p_cong: cong,
    p_so_bao: so_bao,
    p_mau_thiep: mau_thiep,
    p_ten_nguoi_tang: ten_nguoi_tang || null,
    p_loi_chuc: loi_chuc || null,
  });
  if (error) return NextResponse.json({ error: "Chưa tạo được đơn Lì xì, thử lại sau ít phút." }, { status: 502 });
  const d = data as { ket_qua: string; ma_don?: number; so_tien_vnd?: number; so_bao?: number; ma_ds?: string[] };
  if (d.ket_qua !== "da_tao" || !d.ma_don || !d.so_tien_vnd) {
    const [msg, st] = LOI[d.ket_qua] ?? ["Chưa tạo được đơn Lì xì.", 400];
    return NextResponse.json({ error: msg }, { status: st });
  }

  const ve = `${siteUrl()}/li-xi-tet-2027?don=${d.ma_don}`;
  if (cong === "gia") {
    return NextResponse.json({
      ma_don: d.ma_don,
      so_tien_vnd: d.so_tien_vnd,
      so_bao: d.so_bao,
      cong,
      checkoutUrl: `/nap-sao/gia?ma=${d.ma_don}&ve=${encodeURIComponent("/li-xi-tet-2027?moi=1")}`,
    });
  }

  const c = cauHinhPay2s();
  if (!c) return NextResponse.json({ error: "Cổng Pay2S chưa cấu hình đủ." }, { status: 503 });
  try {
    const ma = maPay2s(d.ma_don);
    const link = await taoLink(c, {
      orderId: ma,
      orderInfo: ma,
      amount: d.so_tien_vnd,
      tenDon: `Hiểu Bản Thân · LÌ XÌ TẾT 2027 (${so_bao} bao)`,
      redirectUrl: ve,
      ipnUrl: `${siteUrl()}/api/thanh-toan/webhook/pay2s`,
    });
    await khachDichVu()?.rpc("gan_link_don", { p_ma_don: d.ma_don, p_link_id: ma });
    return NextResponse.json({
      ma_don: d.ma_don,
      so_tien_vnd: d.so_tien_vnd,
      so_bao: d.so_bao,
      cong,
      checkoutUrl: link.payUrl,
    });
  } catch {
    return NextResponse.json({ error: "Không tạo được liên kết thanh toán Pay2S, thử lại sau." }, { status: 502 });
  }
}

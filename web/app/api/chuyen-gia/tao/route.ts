// POST /api/chuyen-gia/tao {mang, cau_hoi, ho_so?, dong_y, dung_hoi_vien} — tạo câu hỏi chuyên gia (SAO-CG, 0029).
//   1. Kiểm câu đặc biệt ở engine: khủng hoảng → 403 kèm lời hỗ trợ (không bán); ngoài phạm vi → 422.
//   2. dung_hoi_vien: SQL tự trừ lượt hội viên trong cùng giao dịch tạo câu (0029 → hoi_vien_dung_cau_hoi của 0028) —
//      không phải hội viên / hết lượt → 409 (web mời trả VND). Web KHÔNG tự trừ lượt (tránh trừ hai lần / trừ mà không tạo câu).
//   3. Tạo câu hỏi + đơn don_nap loai 'chuyen_gia' (giá + giảm lần đầu do SQL tính, KHÔNG tin trình duyệt) → link thanh toán
//      payOS (quay về /tai-khoan/cau-hoi) hoặc cổng giả. Hồ sơ chỉ gửi khi dong_y = true (SQL lọc lại khoá).
import { NextResponse } from "next/server";
import { z } from "zod";
import { congDangBat, khachDichVu, khachNguoiMua } from "@/lib/thanh-toan/cong";
import { cauHinhPayos, moTaChuyenKhoan, taoLink } from "@/lib/thanh-toan/payos";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { siteUrl } from "@/lib/seo";
import { CAU_HOI_TOI_DA, CAU_HOI_TOI_THIEU, MANG_CG } from "@/lib/chuyen-gia-hoi";

const HoSo = z.object({
  ho_ten: z.string().trim().min(1).max(80),
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gio_sinh: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  do_tin_gio: z.enum(["exact", "approx", "unknown"]).optional(),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  noi_sinh: z.string().regex(/^[a-z0-9_-]{2,40}$/).optional(),
  gio_mua_he: z.boolean().optional(),
}).strict();
const Vao = z.object({
  mang: z.enum(MANG_CG),
  cau_hoi: z.string().trim().min(CAU_HOI_TOI_THIEU).max(CAU_HOI_TOI_DA),
  ho_so: HoSo.optional(),
  dong_y: z.boolean().default(false),
  dung_hoi_vien: z.boolean().default(false),
}).strict();

const LOI: Record<string, [string, number]> = {
  tat: ["Hỏi chuyên gia chưa mở.", 503],
  mang_khong_hop_le: ["Mảng không hợp lệ.", 422],
  cau_hoi_khong_hop_le: ["Câu hỏi cần từ 10 đến 1.500 ký tự.", 422],
  cong_khong_hop_le: ["Cổng thanh toán chưa sẵn sàng.", 503],
  qua_nhieu_cau: ["Bạn đang có 3 câu hỏi chờ thanh toán. Hoàn tất hoặc huỷ bớt rồi hỏi tiếp.", 429],
};
const HO_TRO_KHUNG_HOANG = "Có vẻ bạn đang rất mệt. Hỏi chuyên gia không phải nơi phù hợp lúc này — hãy nói chuyện ngay với một người bạn tin, hoặc gọi đường dây hỗ trợ tâm lý gần bạn. Chúng tôi không bán câu hỏi này.";

export async function POST(req: Request) {
  const vao = Vao.safeParse(await req.json().catch(() => null));
  if (!vao.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { mang, cau_hoi, dong_y, dung_hoi_vien } = vao.data;
  const ho_so = dong_y && vao.data.ho_so ? vao.data.ho_so : null;

  const db = await goiEngineDaKiem({ cau_hoi: cau_hoi.slice(0, 500) }, "/v1/hoi/dac-biet", dauNguoiGoi(req));
  const loai = db.ok ? (db.body as { loai?: string | null })?.loai ?? null : null;
  if (loai === "an_toan") return NextResponse.json({ error: HO_TRO_KHUNG_HOANG, loai }, { status: 403 });
  if (loai === "tu_choi_nhe") return NextResponse.json({ error: "Câu hỏi này nằm ngoài phạm vi chuyên gia trả lời (bệnh tật, sống chết, xổ số, tuyển dụng). Hãy hỏi về con đường, lựa chọn, thời điểm của chính bạn.", loai }, { status: 422 });

  const nm = await khachNguoiMua(req);
  if (!nm) return NextResponse.json({ error: "Hãy đăng nhập để hỏi chuyên gia.", can: "dang_nhap" }, { status: 401 });

  const mienPhi = Boolean(dung_hoi_vien);
  const cong = congDangBat();
  if (!mienPhi && !cong) return NextResponse.json({ error: "Cổng thanh toán chưa mở." }, { status: 503 });

  const { data, error } = await nm.sb.rpc("tao_cau_hoi_chuyen_gia", {
    p_mang: mang, p_cau_hoi: cau_hoi, p_ho_so: ho_so, p_dong_y: dong_y, p_mien_phi_hoi_vien: mienPhi, p_cong: mienPhi ? null : cong,
  });
  if (error) return NextResponse.json({ error: "Chưa tạo được câu hỏi, thử lại sau ít phút." }, { status: 502 });
  const d = data as { ket_qua: string; id: number; trang_thai: string; ma_don?: number; so_tien?: number; het_han?: string; lan_dau?: boolean; han_tra_loi?: string };
  if (d.ket_qua === "het_luot_hoi_vien") {
    return NextResponse.json({ error: "Bạn không còn lượt hội viên cho câu hỏi này.", can: "tra_vnd" }, { status: 409 });
  }
  if (d.ket_qua !== "da_tao") {
    const [msg, st] = LOI[d.ket_qua] ?? ["Chưa tạo được câu hỏi.", 400];
    return NextResponse.json({ error: msg }, { status: st });
  }
  if (mienPhi || !d.ma_don) return NextResponse.json({ id: d.id, trang_thai: d.trang_thai, han_tra_loi: d.han_tra_loi, mien_phi: true });

  const ve = `${siteUrl()}/tai-khoan/cau-hoi?don=${d.ma_don}`;
  if (cong === "gia") {
    return NextResponse.json({ id: d.id, ma_don: d.ma_don, so_tien: d.so_tien, lan_dau: d.lan_dau, cong,
      checkoutUrl: `/nap-sao/gia?ma=${d.ma_don}&ve=${encodeURIComponent("/tai-khoan/cau-hoi")}` });
  }
  const c = cauHinhPayos()!;
  try {
    const link = await taoLink(c, {
      orderCode: d.ma_don, amount: d.so_tien!, description: moTaChuyenKhoan(d.ma_don), tenGoi: "Hỏi chuyên gia · 1 câu hỏi",
      returnUrl: ve, cancelUrl: `${ve}&huy=1`, hetHanGiay: Math.floor(new Date(d.het_han!).getTime() / 1000),
    });
    if (link.paymentLinkId) await khachDichVu()?.rpc("gan_link_don", { p_ma_don: d.ma_don, p_link_id: link.paymentLinkId });
    return NextResponse.json({ id: d.id, ma_don: d.ma_don, so_tien: d.so_tien, lan_dau: d.lan_dau, cong, checkoutUrl: link.checkoutUrl });
  } catch {
    await nm.sb.rpc("huy_cau_hoi", { p_id: d.id });
    return NextResponse.json({ error: "Cổng thanh toán đang bận, thử lại sau ít phút." }, { status: 502 });
  }
}

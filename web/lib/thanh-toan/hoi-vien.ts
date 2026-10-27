// SAO-HV (migration 0028) — phần THUẦN dùng chung trang /hoi-vien, thẻ ở /tai-khoan, hộp nạp nhanh và e2e. Không gọi mạng.
// Số thật (giá, Sao tháng, câu hỏi, hạn) do SQL quyết (hoi_vien_cua_toi / tao_don_hoi_vien); ở đây chỉ hiển thị + câu chữ.
// Giọng: nói rõ quyền lợi và cái giá; "mua một lần, không tự gia hạn"; không đếm ngược, không "ưu đãi", không gạch giá.

export type HangHoiVien = "thuong" | "chuyen_gia";
/** Một hạng đang bán (cài đặt hiện hành; mua xong thì quyền lợi đóng băng trên dòng hội viên). */
export interface GoiHoiVien { hang: HangHoiVien; bat: boolean; gia_vnd: number; cau_hoi_nam: number; han_gio: number | null }

/** Kết quả hoi_vien_cua_toi() (hợp đồng giao diện dùng chung với mảng "Hỏi chuyên gia"). gia_vnd / cau_hoi_nam ở gốc:
 *  chưa là hội viên = hạng thường; đang là = quyền lợi của chính dòng mình (cau_hoi_nam). */
export interface HoiVien {
  bat: boolean;
  gia_vnd: number;
  sao_thang: number;
  cau_hoi_nam: number;
  dang_la: boolean;
  tu_ngay: string | null;
  den_ngay: string | null;
  cau_hoi_con: number;
  con_ngay: number;
  gia_han_duoc: boolean;
  sao_thang_da_cap: boolean;
  goi: GoiHoiVien[];
  hang: HangHoiVien | null;
  han_gio: number | null;
  nang_hang_duoc: boolean;
  gia_nang_hang: number | null;
}

export const HOI_VIEN_MAC_DINH: HoiVien = {
  bat: false, gia_vnd: 399000, sao_thang: 15, cau_hoi_nam: 1, dang_la: false, tu_ngay: null, den_ngay: null,
  cau_hoi_con: 0, con_ngay: 0, gia_han_duoc: false, sao_thang_da_cap: false,
  goi: [
    { hang: "thuong", bat: false, gia_vnd: 399000, cau_hoi_nam: 1, han_gio: null },
    { hang: "chuyen_gia", bat: false, gia_vnd: 1990000, cau_hoi_nam: 6, han_gio: 24 },
  ],
  hang: null, han_gio: null, nang_hang_duoc: false, gia_nang_hang: null,
};

const docGoi = (g: unknown): GoiHoiVien | null => {
  if (!g || typeof g !== "object") return null;
  const x = g as Record<string, unknown>;
  if (x.hang !== "thuong" && x.hang !== "chuyen_gia") return null;
  return { hang: x.hang, bat: x.bat === true, gia_vnd: typeof x.gia_vnd === "number" ? x.gia_vnd : 0,
    cau_hoi_nam: typeof x.cau_hoi_nam === "number" ? x.cau_hoi_nam : 0, han_gio: typeof x.han_gio === "number" ? x.han_gio : null };
};

/** Đọc an toàn JSON từ RPC (thiếu trường → mặc định). Không phải object → null (chưa chạy 0028). */
export function docHoiVien(d: unknown): HoiVien | null {
  if (!d || typeof d !== "object") return null;
  const x = d as Record<string, unknown>;
  const so = (k: keyof HoiVien, md: number) => (typeof x[k] === "number" ? (x[k] as number) : md);
  const bool = (k: keyof HoiVien) => x[k] === true;
  return {
    bat: bool("bat"), gia_vnd: so("gia_vnd", HOI_VIEN_MAC_DINH.gia_vnd), sao_thang: so("sao_thang", HOI_VIEN_MAC_DINH.sao_thang),
    cau_hoi_nam: so("cau_hoi_nam", HOI_VIEN_MAC_DINH.cau_hoi_nam), dang_la: bool("dang_la"),
    tu_ngay: typeof x.tu_ngay === "string" ? x.tu_ngay : null, den_ngay: typeof x.den_ngay === "string" ? x.den_ngay : null,
    cau_hoi_con: so("cau_hoi_con", 0), con_ngay: so("con_ngay", 0), gia_han_duoc: bool("gia_han_duoc"),
    sao_thang_da_cap: bool("sao_thang_da_cap"),
    // Bản 0028 một hạng (chưa có goi[]) → coi như chỉ có hạng thường theo giá gốc.
    goi: Array.isArray(x.goi) ? (x.goi.map(docGoi).filter(Boolean) as GoiHoiVien[])
      : [{ hang: "thuong", bat: bool("bat"), gia_vnd: so("gia_vnd", HOI_VIEN_MAC_DINH.gia_vnd), cau_hoi_nam: so("cau_hoi_nam", 1), han_gio: null }],
    hang: x.hang === "thuong" || x.hang === "chuyen_gia" ? x.hang : null,
    han_gio: typeof x.han_gio === "number" ? x.han_gio : null,
    nang_hang_duoc: bool("nang_hang_duoc"),
    gia_nang_hang: typeof x.gia_nang_hang === "number" ? x.gia_nang_hang : null,
  };
}

export const TEN_HANG: Record<HangHoiVien, string> = { thuong: "Hội viên năm", chuyen_gia: "Hội viên Chuyên gia" };
/** Hạng đang bán của một loại (null = không có / tắt). */
export const goiCua = (hv: HoiVien, hang: HangHoiVien) => hv.goi.find((g) => g.hang === hang && g.bat) ?? null;
/** Giá thấp nhất đang bán — cho dòng "từ … ₫" ở hộp nạp nhanh. */
export const giaTu = (hv: HoiVien) => Math.min(...hv.goi.filter((g) => g.bat).map((g) => g.gia_vnd), hv.gia_vnd);

export const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

export const ngayVn = (s: string | null) => {
  if (!s) return "";
  const [y, m, d] = s.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : s;
};

/** Giá mỗi tháng quy đổi (chỉ để so sánh, làm tròn nghìn) — không phải giá bán theo tháng. */
export const giaMoiThang = (giaNam: number) => Math.round(giaNam / 12 / 1000) * 1000;

/** Dòng tóm tắt quyền lợi cho trang nạp / hộp nạp nhanh (một dòng, trung tính). */
export const dongHoiVien = (hv: Pick<HoiVien, "gia_vnd" | "sao_thang"> & Partial<Pick<HoiVien, "goi">>) => {
  const coCg = Boolean(hv.goi?.some((g) => g.hang === "chuyen_gia" && g.bat));
  return `Hoặc hội viên năm ${coCg ? "từ " : ""}${vnd(hv.gia_vnd)}: mở mọi chương Luận giải toàn bộ, ${hv.sao_thang} Sao tặng mỗi tháng — mua một lần, không tự gia hạn.`;
};

/** Câu nâng hạng ở thẻ tài khoản (trung tính, nói rõ cách tính). null = không nâng được. */
export function loiNangHang(hv: HoiVien): string | null {
  if (!hv.dang_la || !hv.nang_hang_duoc || hv.gia_nang_hang == null) return null;
  const cg = hv.goi.find((g) => g.hang === "chuyen_gia");
  return `Nâng lên Hội viên Chuyên gia: ${vnd(hv.gia_nang_hang)} — phần còn lại của gói hiện tại đã được trừ vào giá. `
    + `Bạn có kỳ mới 365 ngày từ hôm nay${cg ? `, ${cg.cau_hoi_nam} câu hỏi chuyên gia/năm` : ""}${cg?.han_gio ? `, trả lời trong ${cg.han_gio} giờ` : ""}.`;
}

/** Có hiện dòng hội viên không: công tắc bật và người xem CHƯA là hội viên. */
export const hienDongHoiVien = (hv: HoiVien | null | undefined): hv is HoiVien => Boolean(hv && hv.bat && !hv.dang_la);

/** Nhắc gia hạn ở thẻ tài khoản: chỉ khi còn ≤ 30 ngày (SQL mới nhận đơn gia hạn), lời trung tính. */
export function loiGiaHan(hv: HoiVien): string | null {
  if (!hv.dang_la || !hv.gia_han_duoc) return null;
  if (hv.con_ngay <= 0) return "Hội viên hết hạn hôm nay. Gia hạn nếu bạn vẫn muốn dùng tiếp — không tự gia hạn, không trừ tiền tự động.";
  return `Hội viên còn ${hv.con_ngay} ngày. Gia hạn thêm 365 ngày nối tiếp hạn hiện tại nếu bạn muốn — không tự gia hạn, không trừ tiền tự động.`;
}

/** Tóm tắt chính sách hoàn tiền (khớp hoan_don_nap, migration 0028) — dùng ở /hoi-vien và Điều khoản. */
export const HOAN_TIEN_HOI_VIEN = [
  "Trong 14 ngày đầu, nếu bạn chưa mở chương khoá nào bằng quyền hội viên và chưa dùng câu hỏi chuyên gia: hoàn 100%.",
  "Sau đó: hoàn theo số tháng tròn còn lại trên 12 tháng, trừ giá trị câu hỏi chuyên gia đã dùng (theo giá lẻ đang công bố). Sao tặng hằng tháng đã cấp không bị thu hồi.",
  "Áp dụng như nhau cho hạng thường và hạng Chuyên gia. Hoàn khoản nâng hạng thì bạn trở lại hạng thường với hạn cũ (nếu còn).",
  "Gửi mã đơn qua trang Liên hệ; tiền hoàn chuyển khoản trong 7 ngày làm việc sau khi xác nhận.",
] as const;

/** Thuộc tính đo checkout_started cho hội viên: chỉ loại + gia hạn hay mua mới. Không số tiền, không định danh. */
export const thuocTinhHoiVien = (giaHan: boolean, hang: HangHoiVien = "thuong", nang = false) => ({
  kind: "hoi_vien",
  goi: `${hang === "chuyen_gia" ? "hoi_vien_cg" : "hoi_vien"}${nang ? "_nang_hang" : giaHan ? "_gia_han" : ""}`,
});

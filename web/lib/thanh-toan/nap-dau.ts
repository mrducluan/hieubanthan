// SAO-ND (migration 0027) — phần thuần dùng chung trang /nap-sao và hộp nạp nhanh (HopThoaiSao). Không gọi mạng.
// Số Sao tặng THẬT do SQL tính (nd_tang_cho_don: floor(Sao gói × % / 100)); ở đây chỉ hiển thị cùng công thức.
// Giọng: một dòng trung tính, không đếm ngược, không "chỉ còn N suất", không gạch giá.

export type NapDau = { bat: boolean; phan_tram: number; lan_dau: boolean | null };
export type GoiHienThi = { ma: string; ten: string; gia_vnd: number; sao: number; nhan: string | null; mo_ta: string | null };

/** Mã gói khởi đầu (19.000 ₫ / 19 Sao — cùng 10 Sao chào mừng vừa đủ 1 báo cáo 29 Sao) — không chọn sẵn ở trang nạp, chỉ gợi ý khi nó là gói nhỏ nhất đủ dùng. */
export const GOI_KHOI_DAU = "khoi_dau";

export const saoTangLanDau = (sao: number, phanTram: number) =>
  phanTram > 0 ? Math.floor((sao * Math.min(phanTram, 100)) / 100) : 0;

/** Số báo cáo Luận giải toàn bộ mua được bằng số Sao của gói (làm tròn xuống). */
export const soBaoCao = (sao: number, giaBaoCao: number) => (giaBaoCao > 0 ? Math.floor(sao / giaBaoCao) : 0);

/** Có hiện dòng "Lần nạp đầu tặng thêm X% Sao" không: công tắc bật và người xem CHƯA từng nạp (khách: chưa biết → hiện
 *  câu chung "mỗi tài khoản"). Đã nạp rồi thì ẩn. */
export const hienNapDau = (nd: NapDau | null | undefined): nd is NapDau =>
  Boolean(nd && nd.bat && nd.phan_tram > 0 && nd.lan_dau !== false);

export const dongNapDau = (nd: NapDau) =>
  nd.lan_dau === true
    ? `Lần nạp đầu tặng thêm ${nd.phan_tram}% Sao (Sao tặng, hạn 365 ngày).`
    : `Lần nạp đầu của mỗi tài khoản tặng thêm ${nd.phan_tram}% Sao (Sao tặng, hạn 365 ngày).`;

/** Gói gợi ý trong hộp nạp nhanh: gói rẻ nhất có đủ số Sao còn thiếu; không gói nào đủ → gói có nhãn → gói đầu. */
export function goiGoiY<G extends GoiHienThi>(ds: readonly G[], can: number): G | undefined {
  const du = ds.filter((g) => g.sao >= can).sort((a, b) => a.gia_vnd - b.gia_vnd)[0];
  return du ?? ds.find((g) => g.nhan && g.ma !== GOI_KHOI_DAU) ?? ds[0];
}

/** Gói chọn sẵn ở /nap-sao: gói có nhãn (vd "Phổ biến") nhưng không phải gói khởi đầu — giữ mặc định cũ khi thêm gói nhỏ. */
export function goiMacDinh<G extends GoiHienThi>(ds: readonly G[]): G | undefined {
  return ds.find((g) => g.nhan && g.ma !== GOI_KHOI_DAU) ?? ds[0];
}

/** Thuộc tính đo checkout_started: mã gói + lần đầu (1/0; chưa biết thì bỏ). Không số tiền, không định danh. */
export function thuocTinhNap(goi: string, nd: NapDau | null | undefined): { kind: string; goi: string; lan_dau?: number } {
  const lanDau = nd?.lan_dau;
  return { kind: goi, goi, ...(typeof lanDau === "boolean" ? { lan_dau: lanDau ? 1 : 0 } : {}) };
}

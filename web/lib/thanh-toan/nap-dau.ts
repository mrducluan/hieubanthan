// SAO-ND (migration 0027) — phần thuần dùng chung trang /nap-sao và hộp nạp nhanh (HopThoaiSao). Không gọi mạng.
// Số Sao tặng THẬT do SQL tính (nd_tang_cho_don: floor(Sao gói × % / 100)); ở đây chỉ hiển thị cùng công thức.
// Giọng: một dòng trung tính, không đếm ngược, không "chỉ còn N suất", không gạch giá.

export type NapDau = { bat: boolean; phan_tram: number; lan_dau: boolean | null };
export type GoiHienThi = { ma: string; ten: string; gia_vnd: number; sao: number; nhan: string | null; mo_ta: string | null };

/** Mã gói khởi đầu (19.000 ₫ / 19 Sao, từ thời giá 29 Sao; GIA-99 để tắt) — không chọn sẵn ở trang nạp, chỉ gợi ý khi nó là gói nhỏ nhất đủ dùng. */
export const GOI_KHOI_DAU = "khoi_dau";
/** CRO-1 (migration 0040): gói "Lần đầu" 59.000 ₫ / 59 Sao — chỉ tài khoản chưa từng nạp (SQL kiểm lúc tạo đơn). */
export const GOI_LAN_DAU = "lan_dau";
/** Gói nhỏ đặc biệt: không chọn sẵn ở /nap-sao, không phải "gói đích" của gợi ý nâng gói. */
export const laGoiDacBiet = (ma: string) => ma === GOI_KHOI_DAU || ma === GOI_LAN_DAU;
/** Bỏ gói Lần đầu khỏi danh sách khi biết chắc tài khoản đã từng nạp (lan_dau === false). Khách / chưa biết → giữ. */
export function locGoiLanDau<G extends { ma: string }>(ds: readonly G[], nd: { lan_dau: boolean | null } | null | undefined): G[] {
  return nd?.lan_dau === false ? ds.filter((g) => g.ma !== GOI_LAN_DAU) : [...ds];
}

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
  return du ?? ds.find((g) => g.nhan && !laGoiDacBiet(g.ma)) ?? ds[0];
}

/** Gói chọn sẵn ở /nap-sao: gói có nhãn (vd "Phổ biến") nhưng không phải gói khởi đầu — giữ mặc định cũ khi thêm gói nhỏ. */
export function goiMacDinh<G extends GoiHienThi>(ds: readonly G[]): G | undefined {
  return ds.find((g) => g.nhan && !laGoiDacBiet(g.ma)) ?? ds[0];
}

/** Thuộc tính đo checkout_started: mã gói + lần đầu (1/0; chưa biết thì bỏ). Không số tiền, không định danh. */
export function thuocTinhNap(goi: string, nd: NapDau | null | undefined): { kind: string; goi: string; lan_dau?: number } {
  const lanDau = nd?.lan_dau;
  return { kind: goi, goi, ...(typeof lanDau === "boolean" ? { lan_dau: lanDau ? 1 : 0 } : {}) };
}

/** GIA-99: gói này rẻ hơn bao nhiêu % mỗi Sao so với gói ĐẮT NHẤT tính theo Sao trong danh sách đang bán (thường là gói
 *  lẻ). Số thật tính từ chính bảng giá — không gạch giá, không "giá gốc". < 5 % → 0 (không khoe mức lệch làm tròn). */
export function tietKiemPhanTram(g: GoiHienThi, ds: readonly GoiHienThi[]): number {
  const donGia = (x: GoiHienThi) => (x.sao > 0 ? x.gia_vnd / x.sao : 0);
  const cao = Math.max(0, ...ds.map(donGia));
  const cua = donGia(g);
  if (cao <= 0 || cua <= 0) return 0;
  const pt = Math.round((1 - cua / cao) * 100);
  return pt >= 5 ? pt : 0;
}

/** Giá mỗi lần xem (₫) khi dùng hết gói vào Luận giải toàn bộ; gói chưa đủ một báo cáo → null. */
export function giaMoiLanXem(g: GoiHienThi, giaBaoCao: number): number | null {
  const n = soBaoCao(g.sao, giaBaoCao);
  return n > 0 ? Math.round(g.gia_vnd / n / 1000) * 1000 : null;
}

/** GIA-99 (chim mồi trung thực): đang chọn gói `chon`, có gói CÓ NHÃN lớn hơn mà mỗi Sao rẻ hơn ≥ 5 % → gợi ý đổi, kèm
 *  phần chênh thật. Không có / đang chọn chính nó / gói đang chọn đã lớn hơn → null. */
export function goiNangCap<G extends GoiHienThi>(ds: readonly G[], chon: string, giaBaoCao: number):
  { goi: G; themVnd: number; baoCao: number; moiLan: number | null } | null {
  const c = ds.find((g) => g.ma === chon);
  const dich = ds.find((g) => g.nhan && !laGoiDacBiet(g.ma));
  if (!c || !dich || dich.ma === c.ma || dich.gia_vnd <= c.gia_vnd || c.sao <= 0 || dich.sao <= 0) return null;
  if (dich.gia_vnd / dich.sao > (c.gia_vnd / c.sao) * 0.95) return null;
  return { goi: dich, themVnd: dich.gia_vnd - c.gia_vnd, baoCao: soBaoCao(dich.sao, giaBaoCao), moiLan: giaMoiLanXem(dich, giaBaoCao) };
}

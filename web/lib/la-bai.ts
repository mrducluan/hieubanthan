// SAO-HH — "Lá bài đầu ngày": bản hợp pháp thay gacha (docs/CO-CHE-RUI-RO-VA-THAY-THE.md §1). Bất ngờ nằm ở NỘI DUNG:
// một điều của hôm nay rút từ thẻ /hom-nay đã có (câu tự soi ngày cá nhân · quẻ đầu ngày · giờ hoàng đạo · ngày chung ·
// phái Chaldea), chọn TẤT ĐỊNH theo (hồ sơ, ngày) — không random, không gọi engine thêm, không LLM, không giải thưởng,
// miễn phí. Mỗi ngày một lá; lật rồi máy nhớ (hbt.la_bai.v1). Hàm thuần để trang + e2e dùng chung.
export interface LaBai { ma: "tu_soi" | "que" | "gio" | "pho_quat" | "chaldea"; nhan: string; chu: string; phu?: string }

/** Phần thẻ Hôm nay mà lá bài cần (kiểu rút gọn, trang truyền `the` thật). */
export interface NguyenLieuLaBai {
  ngay_xem: string;
  ngay_ca_nhan: { so: number; nghia: string; tu_soi: string };
  que_ngay?: { ten: string; y_chinh: string | null; loi_khuyen: string | null; cau_tu_soi: string | null };
  hoang_lich?: { gio_hoang_dao: { chi: string; khung: string; than: string }[] };
  ngay_pho_quat: { so: number; nghia: string | null };
  chaldea: { so: number; kep: number | null; nghia_goc: { ten: string; hanh_tinh: string } | null; nghia_kep: { bieu_tuong: string; xu_huong: string } | null };
}

const boTienTo = (s: string) => { const t = s.replace(/^Ngày cá nhân \d+:\s*/, ""); return t.charAt(0).toUpperCase() + t.slice(1); };

/** Mọi lá có thể rút hôm nay (thứ tự cố định; thiếu dữ liệu thì bỏ lá đó). */
export function cacLaBai(t: NguyenLieuLaBai): LaBai[] {
  const ds: LaBai[] = [
    { ma: "tu_soi", nhan: `Câu hỏi tự soi — ngày cá nhân ${t.ngay_ca_nhan.so}`, chu: t.ngay_ca_nhan.tu_soi, phu: boTienTo(t.ngay_ca_nhan.nghia) },
  ];
  if (t.que_ngay) {
    const chu = t.que_ngay.cau_tu_soi ?? t.que_ngay.loi_khuyen ?? t.que_ngay.y_chinh;
    if (chu) ds.push({ ma: "que", nhan: `Quẻ đầu ngày — ${t.que_ngay.ten}`, chu, phu: t.que_ngay.cau_tu_soi && t.que_ngay.y_chinh ? t.que_ngay.y_chinh : undefined });
  }
  const g = t.hoang_lich?.gio_hoang_dao[0];
  if (g) ds.push({ ma: "gio", nhan: "Giờ hoàng đạo đầu tiên của ngày", chu: `Giờ ${g.chi} (${g.khung})`, phu: `${g.than} — theo lịch cổ truyền, tham khảo văn hoá.` });
  if (t.ngay_pho_quat.nghia) ds.push({ ma: "pho_quat", nhan: `Ngày chung của mọi người — số ${t.ngay_pho_quat.so}`, chu: t.ngay_pho_quat.nghia });
  if (t.chaldea.nghia_kep) ds.push({ ma: "chaldea", nhan: `Theo phái Chaldea — số kép ${t.chaldea.kep}`, chu: t.chaldea.nghia_kep.xu_huong, phu: t.chaldea.nghia_kep.bieu_tuong });
  else if (t.chaldea.nghia_goc) ds.push({ ma: "chaldea", nhan: `Theo phái Chaldea — số ${t.chaldea.so}`, chu: `${t.chaldea.nghia_goc.ten} (${t.chaldea.nghia_goc.hanh_tinh})` });
  return ds;
}

/** Số ngày từ mốc 2000-01-01 (ngày xem dạng yyyy-mm-dd). */
const soNgay = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);

const THU_TU: LaBai["ma"][] = ["tu_soi", "que", "gio", "pho_quat", "chaldea"];

/** Lá của hôm nay: xoay vòng theo (ngày sinh, ngày xem) trên 5 ô CỐ ĐỊNH — cùng người cùng ngày luôn cùng lá, ngày sau
 *  sang lá khác. Ô trúng thiếu dữ liệu → ô kế tiếp có dữ liệu. Đã lật (máy nhớ mã) → luôn trả lá đó nếu còn dữ liệu,
 *  để phần thẻ về muộn (quẻ, hoàng lịch) không đổi lá người dùng đã thấy. */
export function chonLaBai(t: NguyenLieuLaBai, hoSo: { ngay: number; thang: number; nam: number }, daNho?: LaBai["ma"] | null): LaBai | null {
  const ds = cacLaBai(t);
  if (!ds.length) return null;
  if (daNho) { const x = ds.find((l) => l.ma === daNho); if (x) return x; }
  const goc = hoSo.ngay * 31 + hoSo.thang * 12 + hoSo.nam;
  const i = ((goc + soNgay(t.ngay_xem)) % THU_TU.length + THU_TU.length) % THU_TU.length;
  for (let k = 0; k < THU_TU.length; k++) {
    const x = ds.find((l) => l.ma === THU_TU[(i + k) % THU_TU.length]);
    if (x) return x;
  }
  return ds[0]!;
}

export const KHOA_LA_BAI = "hbt.la_bai.v1";
/** Đã lật lá của đúng ngày này chưa (chỉ trên máy) — trả mã lá đã lật, chưa lật → null. */
export function laDaLat(ngay: string): LaBai["ma"] | "co" | null {
  try {
    const j = JSON.parse(localStorage.getItem(KHOA_LA_BAI) ?? "null") as { ngay?: string; lat?: boolean; ma?: LaBai["ma"] } | null;
    return j && j.ngay === ngay && j.lat ? (j.ma ?? "co") : null;
  } catch { return null; }
}
export function daLat(ngay: string): boolean { return laDaLat(ngay) !== null; }
export function nhoDaLat(ngay: string, ma?: LaBai["ma"]): void {
  try { localStorage.setItem(KHOA_LA_BAI, JSON.stringify({ ngay, lat: true, ...(ma ? { ma } : {}) })); } catch { /* chế độ riêng tư */ }
}

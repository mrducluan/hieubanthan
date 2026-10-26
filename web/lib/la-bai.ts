// SAO-HH — "Lá bài đầu ngày": bản hợp pháp thay gacha (docs/CO-CHE-RUI-RO-VA-THAY-THE.md §1). Bất ngờ nằm ở NỘI DUNG:
// một điều của hôm nay chọn TẤT ĐỊNH theo (hồ sơ, ngày) — không random, không gọi engine thêm, không LLM, không giải
// thưởng, miễn phí. Mỗi ngày một lá; lật rồi máy nhớ (hbt.la_bai.v1). Hàm thuần để trang + e2e dùng chung.
// Trục 2 UX (2026-10-26): lá KHÔNG lặp điều thẻ ngay phía trên đã in (câu tự soi, nghĩa ngày cá nhân) và chỉ rút từ dữ
// liệu engine đã trả mà trang chưa hiện: một việc nhỏ nên thử (`viec_nho`, KB ý định × số ngày), câu hỏi thứ tư của kho
// câu hỏi nổi bật (`cau_hoi_them`), giờ hoàng đạo đầu tiên (trang chỉ hiện khi bấm chip). Web không viết chữ huyền học.
export type MaLaBai = "viec" | "cau_hoi" | "gio";
export interface LaBai { ma: MaLaBai; nhan: string; ngan: string; chu: string; phu?: string }

/** Phần thẻ Hôm nay mà lá bài cần (kiểu rút gọn, trang truyền `the` thật). */
export interface NguyenLieuLaBai {
  ngay_xem: string;
  /** Thẻ phía trên đã in hai câu này → lá không được trùng. */
  ngay_ca_nhan: { so: number; nghia: string; tu_soi: string };
  viec_nho?: { ma: string; ten: string; nhan: string | null; cach_lam: string; tu_soi: string | null } | null;
  cau_hoi_them?: string | null;
  hoang_lich?: { gio_hoang_dao: { chi: string; khung: string; than: string }[] };
}

/** Mọi lá có thể rút hôm nay (thứ tự cố định; thiếu dữ liệu, hoặc trùng điều thẻ đã in, thì bỏ lá đó). */
export function cacLaBai(t: NguyenLieuLaBai): LaBai[] {
  const ds: LaBai[] = [];
  const v = t.viec_nho;
  if (v?.cach_lam) {
    ds.push(v.nhan
      ? { ma: "viec", ngan: "Việc nhỏ", nhan: `Việc nhỏ nên thử — ${v.ten}`, chu: v.nhan, phu: v.cach_lam }
      : { ma: "viec", ngan: "Việc nhỏ", nhan: `Việc nhỏ nên thử — ${v.ten}`, chu: v.cach_lam });
  }
  if (t.cau_hoi_them) ds.push({ ma: "cau_hoi", ngan: "Câu hỏi", nhan: "Một câu hỏi riêng cho hôm nay", chu: t.cau_hoi_them });
  const g = t.hoang_lich?.gio_hoang_dao[0];
  if (g) ds.push({ ma: "gio", ngan: "Giờ tốt", nhan: "Giờ hoàng đạo đầu tiên của ngày", chu: `Giờ ${g.chi} (${g.khung})`, phu: `${g.than} — theo lịch cổ truyền, tham khảo văn hoá.` });
  const daIn = new Set([t.ngay_ca_nhan.tu_soi, t.ngay_ca_nhan.nghia].map((s) => s.trim()));
  return ds.filter((l) => !daIn.has(l.chu.trim()) && !(l.phu && daIn.has(l.phu.trim())));
}

/** Số ngày từ mốc 1970-01-01 (ngày xem dạng yyyy-mm-dd). */
const soNgay = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);

const THU_TU: MaLaBai[] = ["viec", "cau_hoi", "gio"];

/** Lá của hôm nay: xoay vòng theo (ngày sinh, ngày xem) trên các ô CỐ ĐỊNH — cùng người cùng ngày luôn cùng lá, ngày sau
 *  sang lá khác. Ô trúng thiếu dữ liệu → ô kế tiếp có dữ liệu. Đã lật (máy nhớ mã) → luôn trả lá đó nếu còn dữ liệu,
 *  để phần thẻ về muộn (hoàng lịch) không đổi lá người dùng đã thấy. */
export function chonLaBai(t: NguyenLieuLaBai, hoSo: { ngay: number; thang: number; nam: number }, daNho?: string | null): LaBai | null {
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
/** Đã lật lá của đúng ngày này chưa (chỉ trên máy) — trả mã lá đã lật (bản cũ có thể là mã lá không còn), chưa lật → null. */
export function laDaLat(ngay: string): string | null {
  try {
    const j = JSON.parse(localStorage.getItem(KHOA_LA_BAI) ?? "null") as { ngay?: string; lat?: boolean; ma?: string } | null;
    return j && j.ngay === ngay && j.lat ? (typeof j.ma === "string" ? j.ma : "co") : null;
  } catch { return null; }
}
export function daLat(ngay: string): boolean { return laDaLat(ngay) !== null; }
export function nhoDaLat(ngay: string, ma?: MaLaBai): void {
  try { localStorage.setItem(KHOA_LA_BAI, JSON.stringify({ ngay, lat: true, ...(ma ? { ma } : {}) })); } catch { /* chế độ riêng tư */ }
}

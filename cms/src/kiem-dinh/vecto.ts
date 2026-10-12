// CMS-4 — vectơ từ khoá có trọng số cho "bài liên quan theo nghĩa" + "gợi ý liên kết nội bộ" (luật cố định, không AI,
// không pgvector, không dependency). Từ = âm tiết tiếng Việt (giữ dấu) + cụm hai âm tiết liền nhau; bỏ hư từ.
// Trọng số theo vị trí: tiêu đề, từ khoá, thẻ nặng hơn thân bài. Dùng chung trình duyệt + máy chủ (web có bản sao
// hàm doGiong trong web/lib/lien-quan.ts — giữ hai bản khớp nhau).
import { docLexical } from "./kiem-dinh.ts";

const HU_TU = new Set(("và của là có cho với những các một được trong khi này đó thì mà để từ theo như về ra vào lên " +
  "cũng đã sẽ đang rất nhiều ít hơn nhất bạn tôi mình người ta họ nó gì nào sao vì nên nếu hay hoặc không chưa đến tại " +
  "bị bởi lại thêm vẫn còn đều chỉ mỗi nhưng thế vậy rồi nữa ở trên dưới sau trước giữa ai cả").split(" "));

export type Vecto = Record<string, number>;

export function tachTu(s: string): string[] {
  const am = s.normalize("NFC").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((x) => x.length >= 1);
  const ra: string[] = [];
  for (let i = 0; i < am.length; i++) {
    const a = am[i]!;
    if (!HU_TU.has(a) && !/^\d+$/.test(a)) ra.push(a);
    const b = am[i + 1];
    if (b && !HU_TU.has(a) && !HU_TU.has(b)) ra.push(`${a} ${b}`);
  }
  return ra;
}

type BaiVecto = {
  tieu_de?: unknown; tu_khoa_chinh?: unknown; tu_khoa_phu?: unknown; the?: unknown; mo_ta_ngan?: unknown;
  tra_loi_nhanh?: unknown; noi_dung?: unknown;
};
const chuoi = (v: unknown): string => (Array.isArray(v) ? v.map((x) => String(x ?? "")).join(" . ") : typeof v === "string" ? v : "");

export function vectoVan(phan: [string, number][], toiDa = 40): Vecto {
  const tf = new Map<string, number>();
  for (const [van, trong] of phan) {
    for (const t of tachTu(van)) tf.set(t, (tf.get(t) ?? 0) + trong * (t.includes(" ") ? 1.5 : 1));
  }
  return Object.fromEntries([...tf].sort((a, b) => b[1] - a[1]).slice(0, toiDa).map(([t, w]) => [t, Math.round(w * 100) / 100]));
}

export function vectoBai(b: BaiVecto): Vecto {
  const lx = docLexical(b.noi_dung);
  return vectoVan([
    [chuoi(b.tieu_de), 4], [chuoi(b.tu_khoa_chinh), 4], [chuoi(b.tu_khoa_phu), 2], [chuoi(b.the), 2],
    [lx.tieuDe.map((h) => h.text).join(" . "), 2], [chuoi(b.mo_ta_ngan), 1.5], [chuoi(b.tra_loi_nhanh), 1.5],
    [lx.van.slice(0, 6000), 0.5],
  ]);
}

/** Cosine (có thể kèm idf để giảm từ phổ biến khắp nơi). */
export function doGiong(a: Vecto, b: Vecto, idf?: (t: string) => number): number {
  let tich = 0, na = 0, nb = 0;
  const w = (t: string) => (idf ? idf(t) : 1);
  for (const [t, x] of Object.entries(a)) { const k = x * w(t); na += k * k; if (t in b) tich += k * b[t]! * w(t); }
  for (const [t, y] of Object.entries(b)) { const k = y * w(t); nb += k * k; }
  return na && nb ? tich / Math.sqrt(na * nb) : 0;
}

/** idf trên tập ứng viên: từ có ở mọi bài → trọng số thấp. */
export function idfTu(ds: Vecto[]): (t: string) => number {
  const df = new Map<string, number>();
  for (const v of ds) for (const t of Object.keys(v)) df.set(t, (df.get(t) ?? 0) + 1);
  const n = ds.length + 1;
  return (t) => Math.log(n / ((df.get(t) ?? 0) + 1)) + 1;
}

export function xepHang<T extends { id: unknown; v: Vecto }>(goc: Vecto, ds: T[], boId?: unknown, toiDa = 8): (T & { diem: number })[] {
  const idf = idfTu(ds.map((x) => x.v));
  return ds.filter((x) => x.id !== boId).map((x) => ({ ...x, diem: doGiong(goc, x.v, idf) }))
    .filter((x) => x.diem > 0).sort((a, b) => b.diem - a.diem).slice(0, toiDa);
}

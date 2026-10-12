// CMS-4 — xếp "bài liên quan theo nghĩa": cosine trên vectơ từ khoá CMS tính sẵn khi lưu bài (cms/src/kiem-dinh/vecto.ts),
// idf trên tập bài để giảm từ phổ biến. Bản sao hàm doGiong/idfTu của CMS — giữ khớp (test: e2e/lien-quan.spec.ts).
export type Vecto = Record<string, number>;

export function idfTu(ds: Vecto[]): (t: string) => number {
  const df = new Map<string, number>();
  for (const v of ds) for (const t of Object.keys(v)) df.set(t, (df.get(t) ?? 0) + 1);
  const n = ds.length + 1;
  return (t) => Math.log(n / ((df.get(t) ?? 0) + 1)) + 1;
}

export function doGiong(a: Vecto, b: Vecto, idf: (t: string) => number = () => 1): number {
  let tich = 0, na = 0, nb = 0;
  for (const [t, x] of Object.entries(a)) { const k = x * idf(t); na += k * k; if (t in b) tich += k * b[t]! * idf(t); }
  for (const [t, y] of Object.entries(b)) { const k = y * idf(t); nb += k * k; }
  return na && nb ? tich / Math.sqrt(na * nb) : 0;
}

/** Bài gần nghĩa nhất (điểm cosine; cùng mảng cộng nhẹ 0,05 để phá hoà). Bài không có vectơ / điểm 0 xếp sau theo mảng. */
export function xepLienQuan<T extends { slug: string; mang?: string | null; vecto?: Vecto | null }>(goc: T, ds: T[]): T[] {
  const ung = ds.filter((b) => b.slug !== goc.slug);
  const idf = idfTu(ung.map((b) => b.vecto ?? {}));
  const diem = (b: T) => (goc.vecto && b.vecto ? doGiong(goc.vecto, b.vecto, idf) : 0) + (b.mang && b.mang === goc.mang ? 0.05 : 0);
  return ung.map((b) => ({ b, d: diem(b) })).sort((x, y) => y.d - x.d).map((x) => x.b);
}

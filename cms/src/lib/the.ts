// Tách / gộp danh sách chữ cho trường text hasMany (Thẻ, Từ khoá phụ) — dùng chung ô nhập NhapThe và test.
// Không import gì (chạy được cả trình duyệt lẫn `node --test`).

/** "a, b; c\nd" → ["a", "b", "c", "d"]: NFC, gộp khoảng trắng, bỏ mục rỗng. */
export function tachThe(s: string): string[] {
  return s.normalize("NFC").split(/[,;\n\r]+/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
}

const khoa = (s: string) => s.normalize("NFC").toLocaleLowerCase("vi");

/** Thêm `moi` vào sau `cu`: bỏ mục trùng (không phân biệt hoa thường), dừng ở `toiDa`. Trả cả phần bị bỏ để báo người viết. */
export function gopThe(cu: unknown, moi: string[], toiDa?: number): { ds: string[]; trung: string[]; vuot: string[] } {
  const ds = Array.isArray(cu) ? cu.filter((x): x is string => typeof x === "string") : [];
  const da = new Set(ds.map(khoa));
  const trung: string[] = [], vuot: string[] = [];
  for (const t of moi) {
    if (da.has(khoa(t))) trung.push(t);
    else if (toiDa && ds.length >= toiDa) vuot.push(t);
    else { ds.push(t); da.add(khoa(t)); }
  }
  return { ds, trung, vuot };
}

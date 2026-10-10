// QT-4 — tìm chữ trên TOÀN kho tri thức (mọi file), không dấu, cho trang quản trị. Thuần, không I/O.
// (Tìm theo nghĩa bằng pgvector để sau: cần bật extension + chi phí nhúng — docs/KIEN-TRUC-QUAN-TRI.md.)
export interface KetQuaTim { tep: string; duong: (string | number)[]; doan: string }

export const boDau = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

function duyet(o: unknown, d: (string | number)[], goi: (d: (string | number)[], s: string) => void) {
  if (typeof o === "string") goi(d, o);
  else if (Array.isArray(o)) o.forEach((x, i) => duyet(x, [...d, i], goi));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) duyet(v, [...d, k], goi);
}

/** Đoạn trích quanh chỗ khớp (±80 ký tự). Vị trí trên chuỗi bỏ dấu khớp vị trí chuỗi gốc khi chuỗi đã chuẩn NFC. */
function trich(s: string, i: number, n: number) {
  const a = Math.max(0, i - 80), b = Math.min(s.length, i + n + 80);
  return `${a > 0 ? "…" : ""}${s.slice(a, b).replace(/\s+/g, " ")}${b < s.length ? "…" : ""}`;
}

export function timToanKho(tep: Record<string, string>, q: string, toiDa = 100): KetQuaTim[] {
  const can = boDau(q.trim());
  if (can.length < 2) return [];
  const ra: KetQuaTim[] = [];
  for (const [ten, text] of Object.entries(tep)) {
    let goc: unknown;
    try { goc = JSON.parse(text); } catch { continue; }
    duyet(goc, [], (d, s) => {
      if (ra.length >= toiDa) return;
      const nfc = s.normalize("NFC"), i = boDau(nfc).indexOf(can);
      if (i >= 0) ra.push({ tep: ten, duong: d, doan: trich(nfc, i, can.length) });
      else if (boDau(d.join(".")).includes(can)) ra.push({ tep: ten, duong: d, doan: trich(nfc, 0, 0) });
    });
  }
  return ra;
}

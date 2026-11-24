// HG-1 — "hẹn quay lại": người dùng đang ở thẻ "Hỏi gì xem nấy", bấm đi đo hướng / khảo sát ở khối bên dưới; khối đó làm
// xong thì hiện nút "Xem câu trả lời" cuộn về thẻ. Chỉ là trạng thái trong bộ nhớ của trang (không lưu, không gửi đi đâu).
const NGHE = new Set<() => void>();
let neo: string | null = null;

/** Thẻ hỏi gọi trước khi cuộn người dùng xuống khối nhập liệu. `neoVe` = id phần tử để cuộn về (vd "hoi-gi"). */
export function henQuayLai(neoVe: string): void { neo = neoVe; NGHE.forEach((f) => f()); }
export function layQuayLai(): string | null { return neo; }
export function xoaQuayLai(): void { if (neo !== null) { neo = null; NGHE.forEach((f) => f()); } }
export function ngheQuayLai(f: () => void): () => void { NGHE.add(f); return () => { NGHE.delete(f); }; }

/** Cuộn về thẻ đã hẹn (tôn trọng "giảm chuyển động") rồi xoá hẹn. Trả false nếu không có hẹn / không thấy phần tử. */
export function veCauTraLoi(): boolean {
  const id = neo;
  xoaQuayLai();
  if (!id || typeof document === "undefined") return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const giam = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "start" });
  return true;
}

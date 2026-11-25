// TY-2 gói 1 — đường lùi khi web lên trước engine (deploy lệch): engine cũ từ chối trường `bo_cuc.so_do` (sơ đồ tỉ lệ)
// và chỗ "ban_cong" của "Đứng giữa nhà" (422). Hàm thuần: trả bản yêu cầu đã bỏ phần mới, hoặc null khi không có gì để bỏ
// (khi đó không gọi lại). Không import `@/` — nạp được trong Node test.

type Obj = Record<string, unknown>;
const laObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);

/** Bỏ `so_do` ở `bo_cuc` (trực tiếp hoặc trong `nha.bo_cuc`). */
export function boSoDo(yc: unknown): unknown | null {
  if (!laObj(yc)) return null;
  if (laObj(yc.bo_cuc) && "so_do" in yc.bo_cuc) {
    const { so_do: _b, ...bc } = yc.bo_cuc;
    void _b;
    return { ...yc, bo_cuc: bc };
  }
  if (laObj(yc.nha) && laObj(yc.nha.bo_cuc) && "so_do" in yc.nha.bo_cuc) {
    const { so_do: _b, ...bc } = yc.nha.bo_cuc;
    void _b;
    return { ...yc, nha: { ...yc.nha, bo_cuc: bc } };
  }
  return null;
}

/** Bỏ chỗ "ban_cong" khỏi các tầng của yêu cầu vi-tri-vat; tầng rỗng thì bỏ tầng. */
export function boBanCong(yc: unknown): unknown | null {
  if (!laObj(yc) || !Array.isArray(yc.tang)) return null;
  let co = false;
  const tang = (yc.tang as Obj[]).map((t) => {
    const vat = (t.vat as Obj[]).filter((v) => (v.loai === "ban_cong" ? ((co = true), false) : true));
    return { ...t, vat };
  }).filter((t) => t.vat.length);
  return co && tang.length ? { ...yc, tang } : null;
}

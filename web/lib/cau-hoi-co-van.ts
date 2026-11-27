// CV-4 — chuyển một câu hỏi từ nơi khác (trang chủ, khung hỏi đáp, trang công cụ) sang /co-van.
// Quy tắc riêng tư: chữ do NGƯỜI DÙNG GÕ không bao giờ lên URL (URL đi vào PostHog / GA4 / Meta Pixel / nhật ký CDN) → chuyển
// qua sessionStorage của đúng tab này, đọc một lần rồi xoá. Chỉ câu gợi ý CỐ ĐỊNH của danh mục dưới đây mới đi bằng ?cau=.
export const KHOA_CAU_CHO_CO_VAN = "hbt.cau_cho_co_van";
export const DO_DAI_CAU = 300;

/** Câu gợi ý cố định (danh mục): vừa là chip bấm một chạm, vừa là câu an toàn để đặt lên URL. Mỗi câu đọc ra đúng một việc. */
export const CAU_QUYET_DINH: readonly string[] = [
  "Năm sau tôi có nên mở shop kinh doanh không?",
  "Có nên mở quán cà phê vào đầu năm sau không?",
  "Năm sau tôi có nên nghỉ việc ra làm riêng không?",
  "Có nên mua nhà cuối năm sau không?",
  "Có nên góp vốn làm chung với bạn không?",
  "Năm sau tôi có nên kết hôn không?",
];

const chuanHoa = (c: string) => c.replace(/\s+/g, " ").trim().slice(0, DO_DAI_CAU);
type Kho = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const kho = (): Kho | null => { try { return globalThis.sessionStorage ?? null; } catch { return null; } };

/** Đặt câu do người dùng gõ cho trang /co-van đọc. Trả về false khi trình duyệt chặn sessionStorage (khi đó chỉ không điền sẵn). */
export function datCauChoCoVan(cau: string, k: Kho | null = kho()): boolean {
  const c = chuanHoa(cau);
  if (c.length < 3 || !k) return false;
  try { k.setItem(KHOA_CAU_CHO_CO_VAN, c); return true; } catch { return false; }
}

/** Đọc rồi xoá (một lần). Không có / lỗi → null. */
export function layCauChoCoVan(k: Kho | null = kho()): string | null {
  if (!k) return null;
  try {
    const c = k.getItem(KHOA_CAU_CHO_CO_VAN);
    k.removeItem(KHOA_CAU_CHO_CO_VAN);
    return c ? chuanHoa(c) : null;
  } catch { return null; }
}

/** Câu từ ?cau= — chỉ nhận câu thuộc danh mục cố định (không điền chữ lạ từ URL do người khác dựng). */
export function cauTuUrl(v: string | null): string | null {
  const c = v ? chuanHoa(v) : "";
  return CAU_QUYET_DINH.includes(c) ? c : null;
}

export const duongCoVan = (cauCoDinh?: string) => (cauCoDinh && CAU_QUYET_DINH.includes(cauCoDinh) ? `/co-van?cau=${encodeURIComponent(cauCoDinh)}` : "/co-van");

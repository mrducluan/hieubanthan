"use client";
// EN-ALL GĐ 1 việc 4 — hồ sơ bản Anh là CÙNG hồ sơ chung của site (`hbt.hoso.v1`, lib/hoso.ts) + cách tính Đường đời chung
// (`hbt.thanso_dd`, lib/quy-uoc-dd.ts): đổi ngôn ngữ không mất hồ sơ, người dùng không nhập lại. File này chỉ là lớp đổi
// tên trường cho các trang /en còn viết riêng — GĐ 7: /en/numerology, /en/tarot đã dùng thẳng component chung, chỉ còn
// phần chuyển hồ sơ cũ (trang Thần số, Tarot import file này để chạy chuyển trước lần render đầu).
//
// Hồ sơ cũ của bản Anh (`hbt.en.profile.v1`, QTE-3): đọc MỘT lần rồi chuyển sang hồ sơ chung — chỉ xoá khoá cũ sau khi đã
// ghi xong hồ sơ chung; máy đã có hồ sơ chung thì hồ sơ chung thắng (khoá cũ bỏ đi, không ghi đè người dùng bản Việt).
// Vẫn chỉ trên máy; "Clear" ở bản Anh = xoá hồ sơ trên máy như nút xoá của bản Việt.
import { HoSo, KHOA_HO_SO, luuHoSo } from "@/lib/hoso";
import { ghiQuyUocDD, type QuyUocDD } from "@/lib/quy-uoc-dd";

const KHOA_QUY_UOC = "hbt.thanso_dd";   // cùng khoá với lib/quy-uoc-dd.ts

/** Khoá hồ sơ cũ của bản Anh (QTE-3) — chỉ còn để chuyển một lần. */
export const KHOA_CU = "hbt.en.profile.v1";
export interface ProfileEn { name: string; nickname?: string; day: number; month: number; year: number; method: QuyUocDD }

/** Chuyển hồ sơ cũ `hbt.en.profile.v1` → hồ sơ chung. Gọi được nhiều lần (chạy thật một lần). Trả true khi vừa chuyển.
 *  Chỉ xoá khoá cũ khi hồ sơ chung ĐÃ nằm trong localStorage (luuHoSo nuốt lỗi ghi — bộ nhớ đầy / chế độ riêng tư — nên
 *  đọc lại để chắc), hoặc khi hồ sơ cũ hỏng không chuyển được. */
export function chuyenHoSoCu(): boolean {
  try {
    const raw = localStorage.getItem(KHOA_CU);
    if (!raw) return false;
    const x = JSON.parse(raw) as Partial<ProfileEn> | null;
    const daCo = () => HoSo.safeParse(JSON.parse(localStorage.getItem(KHOA_HO_SO) ?? "null")).success;
    const hopLe = x && typeof x.name === "string" && x.name.trim() && Number.isInteger(x.day) && Number.isInteger(x.month) && Number.isInteger(x.year);
    // Cách tính Đường đời: máy chưa chọn bao giờ → lấy lựa chọn của bản Anh (kể cả khi hồ sơ chung đã có).
    let coQuyUoc = true;
    try { coQuyUoc = localStorage.getItem(KHOA_QUY_UOC) !== null; } catch { /* bỏ qua */ }
    if (hopLe && !coQuyUoc && (x.method === "tong_het" || x.method === "tung_phan")) ghiQuyUocDD(x.method);
    let chuyen = false;
    if (!daCo() && hopLe) {
      luuHoSo({ ho_ten: x.name!.trim().slice(0, 80), ...(x.nickname?.trim() ? { ten_khac: x.nickname.trim().slice(0, 80) } : {}),
        ngay: x.day!, thang: x.month!, nam: x.year! });
      if (!daCo()) return false;   // ghi không xuống được → giữ khoá cũ, lần sau thử lại
      chuyen = true;
    }
    localStorage.removeItem(KHOA_CU);
    return chuyen;
  } catch {
    return false;   // dữ liệu cũ không hợp lệ cho hồ sơ chung (luuHoSo ném) / storage bị chặn → giữ nguyên khoá cũ
  }
}

// Chuyển ngay khi module nạp ở trình duyệt (trước lần render đầu) → trang không lóe form "chưa có hồ sơ" rồi mới hiện hồ sơ.
if (typeof window !== "undefined") chuyenHoSoCu();

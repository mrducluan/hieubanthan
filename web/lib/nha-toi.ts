// PT-NHA — hàm THUẦN của thẻ "Nhà của tôi" (không React, không localStorage) để kiểm bằng node --test.
// lib/ho-so-nha.ts xuất lại các hàm này.

/** Bốn khoảng năm xây = bốn vận gần nay (nhãn cố định; engine tự đổi vận ra năm lập bàn, lời luận nói "vận …"). Nhà trước
 *  1964 thì gõ năm. */
export const KHOANG_XAY = [
  { van: 6, tu: 1964, den: 1983 }, { van: 7, tu: 1984, den: 2003 }, { van: 8, tu: 2004, den: 2023 }, { van: 9, tu: 2024, den: 2043 },
] as const;

/** Năm xây gửi engine: năm cụ thể hoặc vận (chỉ nhớ khoảng) — không bao giờ cả hai. */
export function namXayGui(n: { nam_xay?: number; van_xay?: number } | null | undefined): { nam_xay: number } | { van_xay: number } | Record<string, never> {
  if (n?.nam_xay) return { nam_xay: n.nam_xay };
  if (n?.van_xay) return { van_xay: n.van_xay };
  return {};
}

export type VaiNha = "vo" | "chong" | "con" | "cha_me" | "khac";
const VAI: Record<string, VaiNha> = { con: "con", bo: "cha_me", me: "cha_me" };

/** "Lấy từ Nhà Tôi" (/gia-dinh): vai gia đình → vai người cùng ở của hồ sơ nhà. Chỉ chép năm sinh + giới tính (không tên,
 *  không ngày sinh). Người chưa có giới tính thì không chép được (mệnh quái cần giới tính) — đếm để nhắc. */
export function nguoiTuGiaDinh(ds: readonly { vai: string; nam_sinh: number; gioi_tinh?: "nam" | "nu" }[]):
  { them: { vai: VaiNha; nam: number; gioi_tinh: "nam" | "nu" }[]; thieu_gioi: number } {
  const them: { vai: VaiNha; nam: number; gioi_tinh: "nam" | "nu" }[] = [];
  let thieu = 0;
  for (const x of ds) {
    if (!x.gioi_tinh) { thieu++; continue; }
    const vai: VaiNha = x.vai === "vo_chong" ? (x.gioi_tinh === "nu" ? "vo" : "chong") : VAI[x.vai] ?? "khac";
    them.push({ vai, nam: x.nam_sinh, gioi_tinh: x.gioi_tinh });
  }
  return { them: them.slice(0, 6), thieu_gioi: thieu };
}

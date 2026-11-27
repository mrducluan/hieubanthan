// FOOTER-2 — trang trụ của 9 môn (8 môn huyền học + Chiêm tinh) + Hợp đôi + hub phải luôn có ở chân trang (liên kết nội bộ toàn site tới trang
// trụ). Sửa tay ở CMS từng làm rơi 5 môn khỏi chân trang → CMS không cho lưu khi thiếu (globals/DieuHuong.ts).
// Trùng TRU_CHAN_TRANG trong web/lib/menu-chan-trang.ts (e2e so-lieu-ngoai kiểm).
export const TRU_CHAN_TRANG = ["/than-so", "/tu-vi", "/bat-tu", "/kinh-dich", "/phong-thuy", "/nhan-tuong", "/tarot", "/ky-mon", "/chiem-tinh", "/hop-doi", "/huyen-hoc"] as const

type LienKet = { loai?: string | null; duong_dan?: string | null }

/** Trang trụ còn thiếu trong các cột. Cột trống = web dùng mặc định trong code → không thiếu gì. */
export function thieuTru(cot: unknown): string[] {
  if (!Array.isArray(cot) || !cot.length) return []
  const co = new Set<string>()
  for (const c of cot as { lien_ket?: LienKet[] | null }[]) {
    for (const l of c?.lien_ket ?? []) {
      if ((l?.loai ?? "duong_dan") === "duong_dan" && typeof l?.duong_dan === "string") co.add(l.duong_dan.split(/[?#]/)[0]!)
    }
  }
  return TRU_CHAN_TRANG.filter((d) => !co.has(d))
}

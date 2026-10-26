"use client";
// Trục 1 "Bài đọc dài dễ đi" (2026-10-26) — mốc "đọc xong" (reading_completed, Gate 1) khi bài có CHƯƠNG GẬP.
//
// Mốc `MocDocXong` nằm ngay dưới báo cáo Luận giải toàn bộ (Tử vi, Bát tự). Trước đây muốn tới mốc phải cuộn qua cả
// báo cáo dài (13 chương mở hết). Nay chương 2 trở đi gập sẵn → cuộn tới mốc rất nhanh, nên "đọc xong" được định nghĩa
// lại cho đúng nghĩa: KHI ĐÃ CÓ báo cáo trên trang, mốc chỉ tính khi người đọc ĐÃ MỞ chương cuối cùng được đọc (chương
// mở cuối, không tính chương khoá SAO-2) VÀ cuộn tới hết chương ấy. Chưa tải báo cáo → như cũ (cuộn tới mốc cuối trang).
// Báo cáo đăng ký "chặn" theo mã mảng; mốc nghe và tự thử lại khi được mở chặn. Chỉ là cờ trong bộ nhớ trang.
const chan = new Set<string>();
const nghe = new Set<() => void>();

export function datChanDocXong(moDun: string, dangChan: boolean): void {
  const truoc = chan.has(moDun);
  if (dangChan) chan.add(moDun); else chan.delete(moDun);
  if (truoc !== dangChan) nghe.forEach((f) => f());
}

export function dangChanDocXong(moDun: string): boolean {
  return chan.has(moDun);
}

export function ngheChanDocXong(f: () => void): () => void {
  nghe.add(f);
  return () => { nghe.delete(f); };
}

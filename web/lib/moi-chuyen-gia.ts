// GĐ 2 (#348) — khi nào khung hỏi đáp được mời "Hỏi chuyên gia". Hàm thuần (test: lib/moi-chuyen-gia.test.mjs).
/** Một lượt trong khung hỏi đáp (rút gọn từ `Tin` của KhungChat). */
export interface LuotChat { ai: "ban" | "he"; van?: string; loi?: string; dacBiet?: boolean; hoTro?: string; hoiLai?: unknown }

/** Mời khi: không đang chờ trả lời; trong phiên KHÔNG có câu khủng hoảng / từ chối / dẫn hướng / đoạn hỗ trợ (không bao
 *  giờ bán sau những câu đó); và đã có ≥ 2 câu trả lời thường (câu lỗi, hết lượt không tính) hoặc máy chưa chắc hiểu câu. */
export function nenMoiChuyenGia(tin: LuotChat[], dang: boolean): boolean {
  if (dang) return false;
  const he = tin.filter((t) => t.ai === "he");
  if (he.some((t) => t.dacBiet || Boolean(t.hoTro))) return false;
  return he.filter((t) => t.van && !t.loi).length >= 2 || he.some((t) => Boolean(t.hoiLai));
}

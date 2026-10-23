// UI-KD — quy đổi HIỂN THỊ giữa ba đồng xu và giá trị hào 6/7/8/9 (phép gieo đồng xu cổ điển: ngửa = 3, sấp = 2,
// cộng ba đồng → 6 Âm động · 7 Dương tĩnh · 8 Âm tĩnh · 9 Dương động). Đây chỉ là cách trình bày / nhập liệu —
// quẻ, hào động, quẻ biến, tên quẻ vẫn do engine (`calc/kinhdich.py`) tính từ 6 giá trị; web không tự luận gì.

export type GiaTriHao = 6 | 7 | 8 | 9;
/** Ba đồng xu, true = ngửa. */
export type BaXu = [boolean, boolean, boolean];

export const GIA_TRI_HAO: readonly GiaTriHao[] = [6, 7, 8, 9];

export const NHAN_HAO: Record<GiaTriHao, { ten: string; ngan: string; mo_ta: string }> = {
  6: { ten: "Âm động", ngan: "Âm động", mo_ta: "ba đồng sấp — vạch đứt, sẽ biến thành vạch liền" },
  7: { ten: "Dương", ngan: "Dương", mo_ta: "một ngửa hai sấp — vạch liền, không đổi" },
  8: { ten: "Âm", ngan: "Âm", mo_ta: "hai ngửa một sấp — vạch đứt, không đổi" },
  9: { ten: "Dương động", ngan: "Dương động", mo_ta: "ba đồng ngửa — vạch liền, sẽ biến thành vạch đứt" },
};

export const laGiaTriHao = (v: unknown): v is GiaTriHao => v === 6 || v === 7 || v === 8 || v === 9;

/** Ba đồng xu → giá trị hào (ngửa 3 + sấp 2). */
export function giaTriTuXu(xu: readonly boolean[]): GiaTriHao {
  const tong = xu.slice(0, 3).reduce<number>((s, ngua) => s + (ngua ? 3 : 2), 0);
  return (tong >= 6 && tong <= 9 ? tong : 8) as GiaTriHao;
}

/** Giá trị hào → một cách bày ba đồng xu (chuẩn hoá: đồng ngửa đứng trước). */
export function xuTuGiaTri(v: GiaTriHao): BaXu {
  switch (v) {
    case 9: return [true, true, true];
    case 8: return [true, true, false];
    case 7: return [true, false, false];
    default: return [false, false, false];
  }
}

/** Vạch liền (dương) hay đứt (âm) — chỉ để vẽ. */
export const laDuong = (v: GiaTriHao): boolean => v === 7 || v === 9;
/** Hào động (sẽ biến) — chỉ để tô màu. */
export const laDong = (v: GiaTriHao): boolean => v === 6 || v === 9;

/** Gõ nhanh "7 7 8 7 7 9" → 6 giá trị (hoặc null khi chưa đủ / sai). */
export function docGoNhanh(chuoi: string): GiaTriHao[] | null {
  const sach = chuoi.trim();
  const vals = /^[6-9]{6}$/.test(sach) ? sach.split("").map(Number) : sach.split(/[^6-9]+/).filter(Boolean).map(Number);
  return vals.length === 6 && vals.every(laGiaTriHao) ? (vals as GiaTriHao[]) : null;
}

/** 6 giá trị hào engine trả kèm quẻ (`gia_tri_hao_1_den_6`, mọi cách ra quẻ). Web KHÔNG tự suy từ âm dương / hào động — một bộ tính. */
export function giaTriTuQue(que: { gia_tri_hao_1_den_6?: number[] }): GiaTriHao[] | null {
  const co = que.gia_tri_hao_1_den_6;
  return co && co.length === 6 && co.every(laGiaTriHao) ? (co as GiaTriHao[]) : null;
}

"use client";
// KC-4 GĐ2 — "Hôm qua việc X — đúng không?": ý định người dùng chọn ở Hôm nay được nhớ TRÊN MÁY (IndexedDB, không gửi
// đi) để sáng hôm sau hỏi lại một chạm — trong thông báo (sw.js đọc cùng kho, nút ngay trên thông báo) hoặc ngay trên
// trang Hôm nay. Câu trả lời đi vào phiếu kiểm chứng ẩn danh có sẵn (/api/kiem-chung, loại doi_song, mã ds.hn.*):
// chỉ MÃ ý định + nhịp đã gợi ý + số ngày cá nhân, không chữ, không ngày sinh.
// Kho IndexedDB "hbt" / bảng "kv" / khoá "y_dinh" — sw.js dùng ĐÚNG tên này.

export interface YDinhNgay { ngay: string; so_ngay: number; ds: { ma: string; ten: string; nhip: string }[];
  da_hoi?: boolean; da_tra_loi?: "dung" | "chua_dung" | null }

const DB = "hbt", BANG = "kv", KHOA = "y_dinh";
const MA = /^[a-z_]{2,30}$/, NHIP = /^(thuan|trung_tinh|can_nhac)$/;

function moKho(): Promise<IDBDatabase> {
  return new Promise((ok, loi) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore(BANG); };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => loi(r.error);
  });
}
async function lam<T>(che: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await moKho();
    return await new Promise<T | undefined>((ok) => {
      const req = f(db.transaction(BANG, che).objectStore(BANG));
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ok(undefined);
    });
  } catch { return undefined; }   // trình duyệt chặn IndexedDB (chế độ riêng tư) → tính năng tự ẩn
}

export const docYDinh = async (): Promise<YDinhNgay | null> => ((await lam("readonly", (s) => s.get(KHOA))) as YDinhNgay | undefined) ?? null;
export const ghiYDinh = (v: YDinhNgay) => lam("readwrite", (s) => s.put(v, KHOA));

/** Hôm nay chọn ý định → nhớ để mai hỏi lại. Chỉ giữ mã hợp lệ (tối đa 3). */
export function nhoYDinhHomNay(ngay: string, soNgay: number, ds: { ma: string; ten: string; nhip: string }[]) {
  const sach = ds.filter((x) => MA.test(x.ma) && NHIP.test(x.nhip)).slice(0, 3).map((x) => ({ ma: x.ma, ten: x.ten.slice(0, 40), nhip: x.nhip }));
  if (!sach.length) return Promise.resolve(undefined);
  return ghiYDinh({ ngay, so_ngay: soNgay, ds: sach, da_hoi: false, da_tra_loi: null });
}

/** Ngày hôm qua theo giờ VN (yyyy-mm-dd), từ ngày hôm nay yyyy-mm-dd. */
export function homQuaCua(homNay: string): string {
  return new Date(Date.parse(`${homNay}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

/** Mã phiếu kiểm chứng (khớp MA_DOI_SONG + kiem_chung_ma_hop_le của 0017): ds.hn.<ý định>.<nhịp>.n<số ngày>. */
export const maHomQua = (y: YDinhNgay) => `ds.hn.${y.ds[0]!.ma}.${y.ds[0]!.nhip}.n${y.so_ngay}`;

export async function traLoiHomQua(y: YDinhNgay, kq: "dung" | "chua_dung"): Promise<void> {
  await ghiYDinh({ ...y, da_hoi: true, da_tra_loi: kq });
  await fetch("/api/kiem-chung", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ loai: "doi_song", mau: maHomQua(y), phai: "pitago", ket_qua: kq }),
  }).catch(() => null);
}

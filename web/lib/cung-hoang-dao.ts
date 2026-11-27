// CHT-1 — 12 cung hoàng đạo: bảng giờ Mặt Trời vào / rời từng cung của năm nay (engine `/v1/chiem-tinh/cung-hoang-dao/nam`,
// năm theo ngày giờ Việt Nam do engine chọn). Web chỉ hiển thị, không tự tính mốc nào.
import { duongTheoLuot } from "@/lib/engine-ngon-ngu";

export interface OCung { ma: string; slug: string; ten: string; ky_hieu: string; khoang_thuong: string }
export interface DongCungNam extends OCung {
  bat_dau: string; ket_thuc: string; bat_dau_chu: string; ket_thuc_chu: string; utc_lech: number;
}
export interface BangCungNam { nam: number; cung: DongCungNam[]; tra_loi: string }
/** Kết quả tra theo ngày sinh (POST /api/chiem-tinh/cung-hoang-dao). */
export interface KetQuaTraCung {
  ngay: string; utc_lech: number; giap_ranh: boolean; sat_moc: boolean; cau: string;
  cung: OCung | null; cung_truoc: OCung; cung_sau: OCung; moc: { gio: string; utc: string } | null;
}

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

/** Bảng năm nay; engine lỗi → null (trang vẫn có danh sách 12 cung từ mục lục). */
export async function bangCungNamNay(): Promise<BangCungNam | null> {
  try {
    const nn = await duongTheoLuot("/v1/chiem-tinh/cung-hoang-dao/nam");
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 60 * 60 * 6 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) return (await r.json()) as BangCungNam;
  } catch { /* engine bận / bản cũ */ }
  return null;
}

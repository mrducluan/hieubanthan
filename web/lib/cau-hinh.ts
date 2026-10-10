// QT-2 — cài đặt site trong bảng cau_hinh (migration 0010/0011). Chỉ chạy ở MÁY CHỦ.
// Không bao giờ chứa bí mật: khoá bí mật vẫn ở env. Web đọc bằng khoá anon qua hàm cau_hinh_cong_khai(),
// cache 60 giây (tag "cau-hinh" — trang quản trị xoá cache ngay khi lưu). Thiếu Supabase / chưa chạy 0011 → {} →
// mọi thứ chạy theo mặc định (hoặc env cũ), không vỡ trang.
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type CaiDat =
  | { khoa: string; ten: string; moTa: string; nhom: string; loai: "so"; min: number; max: number; macDinh: number }
  | { khoa: string; ten: string; moTa: string; nhom: string; loai: "bat_tat"; macDinh: boolean; env?: string }
  | { khoa: string; ten: string; moTa: string; nhom: string; loai: "chu"; toiDa: number; macDinh: string }
  | { khoa: string; ten: string; moTa: string; nhom: string; loai: "duong_dan"; macDinh: string };

/** Danh mục DUY NHẤT các khoá được sửa trên giao diện. Thêm khoá = thêm ở đây (SQL chỉ nhận tiền tố site./sao./luan_giai.). */
export const CAI_DAT: readonly CaiDat[] = [
  { khoa: "site.thong_bao", nhom: "Toàn site", loai: "chu", toiDa: 160, macDinh: "",
    ten: "Dải thông báo đầu trang", moTa: "Hiện trên mọi trang (vd \"Tuần này mời bạn được 40 Sao\"). Để trống = tắt." },
  { khoa: "site.thong_bao_link", nhom: "Toàn site", loai: "duong_dan", macDinh: "",
    ten: "Link của dải thông báo", moTa: "Đường dẫn trong site, bắt đầu bằng / (vd /tai-khoan). Để trống = không có link." },
  { khoa: "sao.thuong.moi_ban", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 20,
    ten: "Thưởng người mời", moTa: "Sao cộng cho người gửi link khi bạn bè tạo tài khoản + lưu hồ sơ." },
  { khoa: "sao.thuong.duoc_moi", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 20,
    ten: "Thưởng người được mời", moTa: "Sao cộng cho người mới đến từ link mời." },
  { khoa: "sao.thuong.chao_mung", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 10,
    ten: "Thưởng chào mừng", moTa: "Sao cộng một lần khi lưu hồ sơ vào tài khoản." },
  { khoa: "sao.tran_moi_30_ngay", nhom: "Sao & lời mời", loai: "so", min: 0, max: 200, macDinh: 20,
    ten: "Trần lượt thưởng người mời / 30 ngày", moTa: "Chống lạm dụng. Quá trần: người được mời vẫn nhận, người mời không." },
  { khoa: "luan_giai.thu_sao", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false, env: "LUAN_GIAI_THU_SAO",
    ten: "Thu Sao cho Luận giải toàn bộ", moTa: "Tắt = miễn phí thử nghiệm. Chưa đặt ở đây thì theo env LUAN_GIAI_THU_SAO." },
  { khoa: "luan_giai.gia_sao", nhom: "Luận giải toàn bộ", loai: "so", min: 1, max: 100, macDinh: 10,
    ten: "Giá Luận giải toàn bộ (Sao/báo cáo)", moTa: "Chỉ áp dụng khi đang thu Sao." },
];

export const caiDat = (khoa: string) => CAI_DAT.find((c) => c.khoa === khoa);

/** Kiểm + chuẩn hoá giá trị người quản trị nhập. Trả lỗi (chuỗi) nếu sai. */
export function chuanHoa(c: CaiDat, v: unknown): { ok: true; giaTri: unknown } | { ok: false; loi: string } {
  switch (c.loai) {
    case "so": {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isInteger(n) || n < c.min || n > c.max) return { ok: false, loi: `Cần số nguyên từ ${c.min} đến ${c.max}.` };
      return { ok: true, giaTri: n };
    }
    case "bat_tat":
      return typeof v === "boolean" ? { ok: true, giaTri: v } : { ok: false, loi: "Cần bật hoặc tắt." };
    case "chu": {
      const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
      if (s.length > c.toiDa) return { ok: false, loi: `Tối đa ${c.toiDa} ký tự.` };
      return { ok: true, giaTri: s };
    }
    case "duong_dan": {
      const s = typeof v === "string" ? v.trim() : "";
      if (s && !/^\/(?![/\\])[\w\-./?=&#%]*$/.test(s)) return { ok: false, loi: "Chỉ nhận đường dẫn trong site, bắt đầu bằng /." };
      return { ok: true, giaTri: s };
    }
  }
}

async function docTho(): Promise<Record<string, unknown>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return {};
  try {
    // Dải thông báo nằm trong layout mọi trang → Supabase chậm thì bỏ qua sau 3 giây (dùng mặc định), không treo trang.
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (u, i) => fetch(u, { ...i, signal: AbortSignal.timeout(3_000) }) },
    });
    const { data, error } = await sb.rpc("cau_hinh_cong_khai");
    return !error && data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const TAG_CAU_HINH = "cau-hinh";
const docCache = unstable_cache(docTho, ["cau-hinh-cong-khai"], { revalidate: 60, tags: [TAG_CAU_HINH] });

/** Giá trị thô đang lưu (chưa áp mặc định) — trang quản trị dùng để biết khoá nào đã đặt. */
export async function cauHinhDaLuu(): Promise<Record<string, unknown>> {
  return docCache().catch(() => ({}));
}

/** Giá trị có hiệu lực của một khoá: cau_hinh hợp lệ → env (nếu khai) → mặc định. */
export function giaTriHieuLuc(c: CaiDat, luu: Record<string, unknown>): unknown {
  if (c.khoa in luu) {
    const r = chuanHoa(c, luu[c.khoa]);
    if (r.ok) return r.giaTri;
  }
  if (c.loai === "bat_tat" && c.env && process.env[c.env] !== undefined) return process.env[c.env] === "1";
  return c.macDinh;
}

export async function layCauHinh<T = unknown>(khoa: string): Promise<T> {
  const c = caiDat(khoa);
  if (!c) throw new Error(`Không có cài đặt ${khoa}`);
  return giaTriHieuLuc(c, await cauHinhDaLuu()) as T;
}

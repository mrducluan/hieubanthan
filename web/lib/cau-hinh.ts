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

/** Danh mục DUY NHẤT các khoá được sửa trên giao diện. Chữ/banner hiển thị (dải thông báo…) thuộc CMS (Trang chủ & banner),
 *  ở đây chỉ còn số + công tắc ảnh hưởng tiền/Sao/AI. Thêm khoá = thêm ở đây (SQL chỉ nhận tiền tố site./sao./luan_giai.). */
export const CAI_DAT: readonly CaiDat[] = [
  { khoa: "sao.thuong.moi_ban", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 20,
    ten: "Thưởng người mời", moTa: "Sao cộng cho người gửi link khi bạn bè tạo tài khoản + lưu hồ sơ." },
  { khoa: "sao.thuong.duoc_moi", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 20,
    ten: "Thưởng người được mời", moTa: "Sao cộng cho người mới đến từ link mời." },
  { khoa: "sao.thuong.chao_mung", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 10,
    ten: "Thưởng chào mừng", moTa: "Sao cộng một lần khi lưu hồ sơ vào tài khoản." },
  { khoa: "sao.tran_moi_30_ngay", nhom: "Sao & lời mời", loai: "so", min: 0, max: 200, macDinh: 20,
    ten: "Trần lượt thưởng người mời / 30 ngày", moTa: "Chống lạm dụng. Quá trần: người được mời vẫn nhận, người mời không." },
  // SAO-3 (migration 0014): SQL đọc cùng các khoá này (nv_bat, nv_muc — kẹp 0–50).
  { khoa: "sao.nhiem_vu.bat", nhom: "Nhiệm vụ kiếm Sao", loai: "bat_tat", macDinh: false,
    ten: "Thưởng Sao cho nhiệm vụ", moTa: "Tắt = hộp nhiệm vụ chỉ hiện tiến độ cho người đã đăng nhập (khách không thấy), chưa nhận Sao được. Bật = làm xong bấm \"Nhận Sao\"." },
  { khoa: "sao.nhiem_vu.luu_ho_so", nhom: "Nhiệm vụ kiếm Sao", loai: "so", min: 0, max: 50, macDinh: 5,
    ten: "Nhiệm vụ: Lưu hồ sơ", moTa: "Cộng thêm, ngoài Sao chào mừng. 0 = tạm dừng nhiệm vụ này." },
  { khoa: "sao.nhiem_vu.hoi_3_cau", nhom: "Nhiệm vụ kiếm Sao", loai: "so", min: 0, max: 50, macDinh: 5,
    ten: "Nhiệm vụ: Hỏi 3 câu", moTa: "Đếm câu hỏi đáp trả lời được khi đã đăng nhập (mọi mảng, cộng dồn). 0 = tạm dừng." },
  { khoa: "sao.nhiem_vu.moi_1_ban", nhom: "Nhiệm vụ kiếm Sao", loai: "so", min: 0, max: 50, macDinh: 5,
    ten: "Nhiệm vụ: Mời 1 bạn", moTa: "Cộng thêm, ngoài thưởng mời (người mời / được mời ở trên). 0 = tạm dừng." },
  { khoa: "luan_giai.thu_sao", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false, env: "LUAN_GIAI_THU_SAO",
    ten: "Thu Sao cho Luận giải toàn bộ", moTa: "Tắt = miễn phí thử nghiệm. Chưa đặt ở đây thì theo env LUAN_GIAI_THU_SAO." },
  { khoa: "luan_giai.gia_sao", nhom: "Luận giải toàn bộ", loai: "so", min: 1, max: 100, macDinh: 10,
    ten: "Giá Luận giải toàn bộ (Sao/báo cáo)", moTa: "Chỉ áp dụng khi đang thu Sao." },
  { khoa: "luan_giai.chuong_mien_phi", nhom: "Luận giải toàn bộ", loai: "so", min: 0, max: 3, macDinh: 1,
    ten: "Số chương xem miễn phí", moTa: "Khi đang thu Sao: ai cũng đọc trọn N chương đầu; chương sau hiện tiêu đề + điểm nhấn + câu hỏi, mở bằng Sao." },
  { khoa: "sao.hoi.thu", nhom: "Hỏi đáp", loai: "bat_tat", macDinh: false,
    ten: "Giới hạn hỏi đáp miễn phí mỗi ngày", moTa: "Tắt = hỏi không giới hạn (vẫn có trần chống lạm dụng ở engine). Bật = quá lượt miễn phí thì mỗi câu tốn Sao." },
  { khoa: "sao.hoi.mien_phi_khach", nhom: "Hỏi đáp", loai: "so", min: 0, max: 50, macDinh: 3,
    ten: "Câu miễn phí/ngày — khách chưa đăng nhập", moTa: "Hết lượt → mời đăng nhập (nhận Sao chào mừng) để hỏi tiếp." },
  { khoa: "sao.hoi.mien_phi_tk", nhom: "Hỏi đáp", loai: "so", min: 0, max: 100, macDinh: 10,
    ten: "Câu miễn phí/ngày — có tài khoản", moTa: "Tính chung mọi mảng. Hết lượt → mỗi câu tốn Sao (người dùng bấm đồng ý từng câu)." },
  { khoa: "sao.hoi.gia", nhom: "Hỏi đáp", loai: "so", min: 1, max: 10, macDinh: 1,
    ten: "Giá mỗi câu vượt lượt (Sao)", moTa: "Chỉ áp dụng khi bật giới hạn hỏi đáp." },
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
    // Đọc trên đường đi của trang/hỏi đáp → Supabase chậm thì bỏ qua sau 3 giây (dùng mặc định), không treo.
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

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
    ten: "Thưởng người mời", moTa: "Sao cộng cho người gửi link khi bạn bè (tài khoản mới hay cũ, chưa từng nhận lời mời ai) lưu hồ sơ vào tài khoản." },
  { khoa: "sao.thuong.duoc_moi", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 20,
    ten: "Thưởng người được mời", moTa: "Sao cộng cho người mới đến từ link mời." },
  { khoa: "sao.thuong.chao_mung", nhom: "Sao & lời mời", loai: "so", min: 0, max: 100, macDinh: 10,
    ten: "Thưởng chào mừng", moTa: "Sao cộng một lần khi lưu hồ sơ vào tài khoản." },
  { khoa: "sao.tran_moi_30_ngay", nhom: "Sao & lời mời", loai: "so", min: 0, max: 200, macDinh: 20,
    ten: "Trần lượt thưởng người mời / 30 ngày", moTa: "Chống lạm dụng. Quá trần: người được mời vẫn nhận, người mời không." },
  // SAO-V (migration 0025): hoa hồng nạp Sao — affiliate MỘT tầng, trả bằng Sao tặng (hạn 365 ngày), SQL đọc cùng khoá (kẹp).
  { khoa: "sao.hoa_hong.bat", nhom: "Hoa hồng nạp Sao", loai: "bat_tat", macDinh: false,
    ten: "Hoa hồng khi bạn bè nạp Sao", moTa: "Bật = người mời nhận % số Sao của các đơn nạp đầu của bạn bè mình mời (chỉ người mời trực tiếp). Đơn hoàn tiền → tự thu hồi." },
  { khoa: "sao.hoa_hong.phan_tram", nhom: "Hoa hồng nạp Sao", loai: "so", min: 0, max: 50, macDinh: 20,
    ten: "Tỉ lệ hoa hồng (%)", moTa: "Tính trên số Sao của đơn (làm tròn xuống), trả bằng Sao tặng." },
  { khoa: "sao.hoa_hong.so_don", nhom: "Hoa hồng nạp Sao", loai: "so", min: 1, max: 12, macDinh: 1,
    ten: "Số đơn đầu được tính", moTa: "1 = chỉ lần nạp đầu tiên của bạn bè." },
  { khoa: "sao.hoa_hong.thang", nhom: "Hoa hồng nạp Sao", loai: "so", min: 1, max: 36, macDinh: 12,
    ten: "Thời hạn tính hoa hồng (tháng)", moTa: "Tính từ lúc bạn bè nhận lời mời." },
  { khoa: "sao.hoa_hong.tran_30_ngay", nhom: "Hoa hồng nạp Sao", loai: "so", min: 0, max: 10000, macDinh: 1000,
    ten: "Trần hoa hồng mỗi người mời / 30 ngày (Sao)", moTa: "Chống lạm dụng. Quá trần: đơn vẫn ghi nhận, không cộng thêm Sao." },
  // SAO-GL (0026): chống gian lận thưởng mời + hoa hồng theo mã băm thiết bị (HMAC IP + user-agent, không lưu IP).
  { khoa: "sao.gian_lan.bat", nhom: "Hoa hồng nạp Sao", loai: "bat_tat", macDinh: true,
    ten: "Chống gian lận lời mời", moTa: "Bật (mặc định) = một máy nhận lời mời cho quá nhiều tài khoản, hoặc người mời và người được mời cùng máy → người mời không được thưởng / hoa hồng, ghi cờ ở Doanh thu. Người được mời vẫn nhận thưởng của mình." },
  { khoa: "sao.gian_lan.thiet_bi_30_ngay", nhom: "Hoa hồng nạp Sao", loai: "so", min: 2, max: 50, macDinh: 3,
    ten: "Số tài khoản / một máy / 30 ngày thì gắn cờ", moTa: "Tài khoản thứ N nhận lời mời trên cùng một máy trong 30 ngày → người mời không được thưởng. Gia đình dùng chung máy: tăng số này." },
  // SAO-V (0025): chuỗi ngày ghé — chỉ lưu ngày ghé cuối + độ dài chuỗi, mất chuỗi chỉ đếm lại.
  { khoa: "sao.chuoi.bat", nhom: "Chuỗi ngày ghé", loai: "bat_tat", macDinh: false,
    ten: "Thưởng chuỗi ngày ghé", moTa: "Tắt = vẫn đếm chuỗi cho người đăng nhập, không cộng Sao." },
  { khoa: "sao.chuoi.moc", nhom: "Chuỗi ngày ghé", loai: "so", min: 2, max: 30, macDinh: 7,
    ten: "Mốc thưởng (ngày liên tiếp)", moTa: "Cứ đủ bội số mốc này thì thưởng một lần." },
  { khoa: "sao.chuoi.sao", nhom: "Chuỗi ngày ghé", loai: "so", min: 0, max: 20, macDinh: 2,
    ten: "Sao mỗi mốc", moTa: "0 = tạm dừng thưởng." },
  { khoa: "sao.chuoi.tran_30_ngay", nhom: "Chuỗi ngày ghé", loai: "so", min: 0, max: 60, macDinh: 6,
    ten: "Trần Sao chuỗi / 30 ngày", moTa: "Chống lạm dụng." },
  // SAO-V (0025): tặng một chương — quà là NỘI DUNG (thêm 1 chương miễn phí trong 30 ngày), không phải Sao.
  { khoa: "sao.qua.bat", nhom: "Tặng một chương", loai: "bat_tat", macDinh: false,
    ten: "Cho phép tặng một chương", moTa: "Người đã mở Luận giải toàn bộ bằng Sao gửi link quà; bạn bè (có tài khoản + hồ sơ của chính họ) đọc thêm 1 chương của báo cáo của họ trong 30 ngày." },
  { khoa: "sao.qua.tran_30_ngay", nhom: "Tặng một chương", loai: "so", min: 0, max: 10, macDinh: 3,
    ten: "Số quà mỗi người / 30 ngày", moTa: "0 = tạm dừng tặng." },
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
  // SAO-V: bật thu Sao TỪNG mảng (chạy thử Bản đồ con số trước). Mảng thu khi công tắc chung HOẶC công tắc mảng bật.
  { khoa: "luan_giai.thu_sao.thanso", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false,
    ten: "Thu Sao riêng: Bản đồ con số (Thần số)", moTa: "Bật = chỉ mảng này thu Sao, kể cả khi công tắc chung đang tắt." },
  { khoa: "luan_giai.thu_sao.tuvi", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false,
    ten: "Thu Sao riêng: Luận giải Tử vi", moTa: "Bật = mảng này thu Sao, kể cả khi công tắc chung đang tắt." },
  { khoa: "luan_giai.thu_sao.battu", nhom: "Luận giải toàn bộ", loai: "bat_tat", macDinh: false,
    ten: "Thu Sao riêng: Luận giải Bát tự", moTa: "Bật = mảng này thu Sao, kể cả khi công tắc chung đang tắt." },
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

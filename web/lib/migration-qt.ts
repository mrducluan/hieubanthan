// Trang quản trị tự biết migration nào đã chạy trên Supabase — để chủ dự án không bật một công tắc mà bảng / hàm SQL của
// nó chưa có (bật được nhưng tính năng hỏng). CHỈ ĐỌC: một lượt GET mô tả API của PostgREST (`/rest/v1/`, OpenAPI) bằng
// khoá service role ở máy chủ — không gọi hàm, không đọc dòng dữ liệu nào. Dấu hiệu từng migration khớp
// supabase/kiem_thu/da_chay_chua.sql (bản SQL đầy đủ, chạy trong SQL Editor). Chỉ dùng ở MÁY CHỦ (đọc khoá service role).

type DauHieu = { bang: string; cot?: string } | { ham: string };
export interface Migration { so: string; ten: string; dau: DauHieu }

/** Migration có dấu hiệu nhìn thấy qua API (bảng / cột / hàm mới). Migration chỉ đổi ràng buộc (0015, 0021, 0023) không
 *  có ở đây — kiểm bằng da_chay_chua.sql. */
export const MIGRATION: readonly Migration[] = [
  { so: "0006", ten: "Hồ sơ tài khoản", dau: { bang: "ho_so" } },
  { so: "0007", ten: "Nơi sinh trong hồ sơ", dau: { bang: "ho_so", cot: "noi_sinh" } },
  { so: "0008", ten: "Ví Sao + mời bạn", dau: { bang: "so_cai_sao" } },
  { so: "0010", ten: "Quản trị", dau: { bang: "vai_tro_quan_tri" } },
  { so: "0011", ten: "Quản trị 2 (cài đặt)", dau: { ham: "dat_cau_hinh" } },
  { so: "0012", ten: "Thanh toán nạp Sao", dau: { bang: "don_nap" } },
  { so: "0013", ten: "Hạn mức hỏi đáp", dau: { bang: "luot_hoi" } },
  { so: "0014", ten: "Nhiệm vụ kiếm Sao", dau: { bang: "nhiem_vu_sao" } },
  { so: "0016", ten: "Tầng HỌC thần số", dau: { bang: "thanso_phan_hoi" } },
  { so: "0017", ten: "Tầng HỌC Tử vi (kiểm chứng, bài đã lưu)", dau: { bang: "cau_hoi_vec" } },
  { so: "0018", ten: "Hồ sơ nhà + nhắc việc", dau: { bang: "nhac_viec" } },
  { so: "0019", ten: "Web Push (thiết bị)", dau: { bang: "push_dang_ky" } },
  { so: "0020", ten: "Web Push (sáng nay, mốc lịch)", dau: { bang: "push_tuy_chon" } },
  { so: "0022", ten: "Phiếu sau 30 ngày + đề xuất luật", dau: { bang: "de_xuat_luat" } },
  { so: "0024", ten: "Hoàn Sao hỏi đáp + mốc ghi chú", dau: { bang: "thanso_cum_bat_thuong", cot: "ghi_chu_luc" } },
  { so: "0025", ten: "Sao viral: số dư theo lô, hoa hồng, chuỗi ngày, tặng chương", dau: { bang: "hoa_hong" } },
  { so: "0026", ten: "Chống gian lận lời mời", dau: { bang: "gian_lan_co" } },
  { so: "0027", ten: "Gói khởi đầu + tặng lần nạp đầu", dau: { ham: "nap_dau_thong_tin" } },
  { so: "0028", ten: "Hội viên năm (hai hạng)", dau: { bang: "hoi_vien", cot: "hang" } },
  { so: "0029", ten: "Hỏi chuyên gia", dau: { ham: "cg_han_gio_cho" } },
  { so: "0030", ten: "Ngày nghỉ chuỗi + huy hiệu", dau: { ham: "huy_hieu_cua_toi" } },
  { so: "0031", ten: "Nhật ký hỏi đáp dùng khoá riêng", dau: { ham: "ghi_nhat_ky_hoi" } },
  { so: "0032", ten: "Nhật ký ngày ghé (Tháng của tôi)", dau: { bang: "nhat_ky_ghe" } },
];

/** Công tắc / số ở /quan-tri/cai-dat chỉ có tác dụng khi các migration này đã chạy (tiền tố khoá → số migration). */
const CAN: [string, string[]][] = [
  ["sao.nhiem_vu.", ["0014"]],
  ["sao.hoa_hong.", ["0025", "0026"]],   // chạy 0026 (chống gian lận) TRƯỚC khi bật hoa hồng
  ["sao.chuoi.", ["0025"]],
  ["sao.qua.", ["0025"]],
  ["sao.gian_lan.", ["0026"]],
  ["sao.goi_khoi_dau.", ["0027"]],
  ["sao.nap_dau.", ["0027"]],
  ["sao.hoi_vien.", ["0028"]],
  ["sao.chuyen_gia.", ["0028", "0029"]],
];
export const canMigration = (khoa: string): string[] => CAN.find(([t]) => khoa.startsWith(t))?.[1] ?? [];

/** so → true (đã chạy) / false (chưa). null = không đọc được (chưa bật tài khoản, thiếu khoá service role, mạng lỗi). */
export type TinhTrang = Map<string, boolean> | null;

interface MoTaApi { paths?: Record<string, unknown>; definitions?: Record<string, { properties?: Record<string, unknown> }> }

export function docTinhTrang(api: MoTaApi): Map<string, boolean> {
  const p = api.paths ?? {}, d = api.definitions ?? {};
  return new Map(MIGRATION.map(({ so, dau }) => [so,
    "ham" in dau ? `/rpc/${dau.ham}` in p
      : `/${dau.bang}` in p && (!dau.cot || dau.cot in (d[dau.bang]?.properties ?? {}))]));
}

export async function tinhTrangMigration(): Promise<TinhTrang> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
      // Khoá dạng JWT (service_role cũ) đi cả hai header; khoá bí mật mới (sb_secret_…) chỉ đi `apikey`.
      headers: { apikey: key, ...(key.split(".").length === 3 ? { authorization: `Bearer ${key}` } : {}), accept: "application/openapi+json" },
      cache: "no-store", signal: AbortSignal.timeout(5_000),
    });
    if (!r.ok) return null;
    const api = (await r.json()) as MoTaApi;
    return api.paths ? docTinhTrang(api) : null;
  } catch {
    return null;
  }
}

/** Migration còn thiếu cho một khoá cài đặt (rỗng = đủ, hoặc không kiểm được → không chặn). */
export const thieuCho = (khoa: string, tt: TinhTrang): string[] =>
  tt ? canMigration(khoa).filter((so) => tt.get(so) === false) : [];

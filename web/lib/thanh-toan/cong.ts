// Thanh toán nạp Sao (TT-1/TT-2, migration 0012). Chỉ chạy ở MÁY CHỦ.
// Cổng đang bật: payOS khi có đủ 3 khoá env; "gia" (cổng giả, không thu tiền) chỉ khi THANH_TOAN_GIA=1 và KHÔNG phải
// production — để anh thử trọn luồng trên bản preview. Không cổng nào → trang /nap-sao báo "sắp mở".
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cauHinhPayos } from "@/lib/thanh-toan/payos";
import type { NapDau } from "@/lib/thanh-toan/nap-dau";
import { docHoiVien, type HoiVien } from "@/lib/thanh-toan/hoi-vien";

export type Cong = "payos" | "gia";

export const choPhepCongGia = () => process.env.THANH_TOAN_GIA === "1" && process.env.VERCEL_ENV !== "production";

export function congDangBat(): Cong | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  if (cauHinhPayos()) return "payos";
  return choPhepCongGia() ? "gia" : null;
}

const KHONG_LUU = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/** Client chạy bằng quyền CHÍNH người mua (RLS) từ access token trình duyệt gửi lên (header Authorization). */
export async function khachNguoiMua(req: Request): Promise<{ sb: SupabaseClient; uid: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anon || !token) return null;
  const sb = createClient(url, anon, { ...KHONG_LUU, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await sb.auth.getUser(token);
  return error || !data.user ? null : { sb, uid: data.user.id };
}

/** Service role — CHỈ cho webhook / đối soát / cổng giả (gọi nap_sao_tu_cong, gan_link_don). */
export function khachDichVu(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, KHONG_LUU) : null;
}

/** Gói hiển thị khi chưa đọc được bảng goi_sao (chưa bật tài khoản) — khớp dữ liệu mặc định migration 0012. */
export const GOI_MAC_DINH = [
  { ma: "thu", ten: "Thử", gia_vnd: 29000, sao: 30, nhan: null, mo_ta: "Gói nhỏ để thử" },
  { ma: "pho_bien", ten: "Phổ biến", gia_vnd: 99000, sao: 110, nhan: "Phổ biến", mo_ta: "Tặng thêm 10%" },
  { ma: "gia_dinh", ten: "Gia đình", gia_vnd: 199000, sao: 240, nhan: null, mo_ta: "Tặng thêm 20% — xem cho cả nhà, hợp đôi" },
] as const;
export type GoiSao = { ma: string; ten: string; gia_vnd: number; sao: number; nhan: string | null; mo_ta: string | null };

const COT_GOI = (g: GoiSao): GoiSao => ({ ma: g.ma, ten: g.ten, gia_vnd: g.gia_vnd, sao: g.sao, nhan: g.nhan, mo_ta: g.mo_ta });

/** Gói đang bán. SAO-ND (0027): đọc qua goi_sao_dang_ban() — cùng nguồn với tao_don_nap, nên gói "Khởi đầu" chỉ hiện khi
 *  công tắc sao.goi_khoi_dau.bat bật và máy chủ cũng nhận tạo đơn cho nó. Chưa chạy 0027 → đọc bảng như cũ (cột bat). */
export async function dsGoiSao(): Promise<GoiSao[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [...GOI_MAC_DINH];
  try {
    const sb = createClient(url, anon, KHONG_LUU);
    const rpc = await sb.rpc("goi_sao_dang_ban");
    if (!rpc.error && Array.isArray(rpc.data) && rpc.data.length) return (rpc.data as GoiSao[]).map(COT_GOI);
    const { data, error } = await sb.from("goi_sao")
      .select("ma,ten,gia_vnd,sao,nhan,mo_ta").eq("bat", true).order("thu_tu");
    return !error && data?.length ? (data as GoiSao[]) : [...GOI_MAC_DINH];
  } catch {
    return [...GOI_MAC_DINH];
  }
}

/** SAO-ND (0027): công tắc + tỉ lệ tặng lần nạp đầu, và người gọi (nếu gửi access token) đã từng nạp chưa. Đọc từ SQL
 *  (nap_dau_thong_tin) — cùng nguồn với hàm cộng Sao, nên chưa chạy 0027 thì null (không hứa điều máy chủ chưa làm). */
export async function napDauThongTin(req?: Request): Promise<NapDau | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const nm = req?.headers.get("authorization") ? await khachNguoiMua(req) : null;
    const sb = nm?.sb ?? createClient(url, anon, KHONG_LUU);
    const { data, error } = await sb.rpc("nap_dau_thong_tin");
    if (error || !data || typeof data !== "object") return null;
    const d = data as { bat?: unknown; phan_tram?: unknown; lan_dau?: unknown };
    return {
      bat: d.bat === true,
      phan_tram: typeof d.phan_tram === "number" ? d.phan_tram : 0,
      lan_dau: typeof d.lan_dau === "boolean" ? d.lan_dau : null,
    };
  } catch {
    return null;
  }
}

/** SAO-HV (0028): công tắc + giá hội viên năm, và (nếu gửi access token) người gọi đang là hội viên không — qua SQL
 *  hoi_vien_cua_toi (cùng nguồn với tao_don_hoi_vien). Chưa chạy 0028 / lỗi → null (không hứa điều máy chủ chưa làm). */
export async function hoiVienThongTin(req?: Request): Promise<HoiVien | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const nm = req?.headers.get("authorization") ? await khachNguoiMua(req) : null;
    const sb = nm?.sb ?? createClient(url, anon, KHONG_LUU);
    const { data, error } = await sb.rpc("hoi_vien_cua_toi");
    return error ? null : docHoiVien(data);
  } catch {
    return null;
  }
}

export const dinhDangVnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

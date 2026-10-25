// SAO-V "Tặng một chương" — phía MÁY CHỦ (migration 0025 phần 5). Quà là NỘI DUNG: người nhận đọc thêm một chương trong
// báo cáo của CHÍNH họ ở mảng đó, 30 ngày; không phải Sao, không chuyển nhượng Sao. Mọi quy tắc (ai được tặng, trần
// 30 ngày, mỗi người một quà / mảng, link 7 ngày dùng một lần) nằm trong hàm SQL — ở đây chỉ gọi bằng phiên người dùng
// (RLS chính chủ) hoặc khoá anon (xem quà: chỉ mảng + hạn, không lộ người gửi).
import { createClient } from "@supabase/supabase-js";
import { coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { MA_QUA, mangLuanGiai, type MangLuanGiai } from "@/lib/luan-giai-mang";

export interface QuaXem { mo_dun: MangLuanGiai; het_han: string; con_dung: boolean }
/** Trạng thái trang nhận quà. `qua` null = không có quà mang mã này. */
export interface TrangQua { qua: QuaXem | null; dang_nhap: boolean; co_ho_so: boolean }

const khachAnon = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (u, i) => fetch(u, { ...i, signal: AbortSignal.timeout(4_000) }) },
});

/** Đọc quà + người đang xem đã đăng nhập / đã lưu hồ sơ vào tài khoản chưa. Không đọc được (chưa bật tài khoản,
 *  chưa chạy 0025, Supabase lỗi) → null: trang để trình duyệt thử lại qua /api/qua/<mã>. */
export async function docQua(ma: string): Promise<TrangQua | null> {
  if (!MA_QUA.test(ma) || !coTaiKhoan()) return null;
  try {
    const phien = await phienNguoiDung();
    const sb = phien?.sb ?? khachAnon();
    const { data, error } = await sb.rpc("xem_qua_chuong", { p_ma: ma });
    if (error || !data || typeof data !== "object") return null;
    const d = data as { mo_dun?: string; het_han?: string; con_dung?: boolean; ket_qua?: string };
    const mang = mangLuanGiai(d.mo_dun);
    const qua = mang && d.het_han ? { mo_dun: mang, het_han: d.het_han, con_dung: Boolean(d.con_dung) } : null;
    let coHoSo = false;
    if (phien && qua?.con_dung) {
      const { data: hs } = await phien.sb.from("ho_so").select("user_id").eq("user_id", phien.user.id).limit(1);
      coHoSo = Boolean(hs?.length);
    }
    return { qua, dang_nhap: Boolean(phien), co_ho_so: coHoSo };
  } catch {
    return null;
  }
}

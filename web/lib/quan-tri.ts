// QT-0 — cổng trang quản trị (docs/KIEN-TRUC-QUAN-TRI.md). Chỉ dùng ở MÁY CHỦ (đọc cookie qua next/headers).
// Ba lớp: đăng nhập (Supabase) → có vai trò trong bảng vai_tro_quan_tri (migration 0010) → phiên đã qua MFA (aal2).
// Lớp thứ ba còn được chặn trong cơ sở dữ liệu (hàm vai_tro_hieu_luc) — web có sơ suất thì dữ liệu vẫn không lộ.
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseMayChu } from "@/lib/supabase/may-chu";

export type VaiTro = "chu_so_huu" | "bien_tap" | "tham_dinh" | "ho_tro" | "xem";

export const TEN_VAI_TRO: Record<VaiTro, string> = {
  chu_so_huu: "Chủ sở hữu", bien_tap: "Biên tập", tham_dinh: "Chuyên gia thẩm định", ho_tro: "Hỗ trợ", xem: "Chỉ xem",
};

export type PhienQuanTri =
  | { trang: "chua_bat" }                                   // chưa đặt khoá Supabase trên web
  | { trang: "chua_dang_nhap" }
  | { trang: "chua_migration"; email: string | null }       // chưa chạy 0010
  | { trang: "khong_quyen"; email: string | null }
  | { trang: "can_mfa"; user: User; vaiTro: VaiTro; factorId: string | null }   // null = chưa đăng ký TOTP
  | { trang: "ok"; user: User; vaiTro: VaiTro; sb: SupabaseClient };

export async function phienQuanTri(): Promise<PhienQuanTri> {
  const sb = await supabaseMayChu();
  if (!sb) return { trang: "chua_bat" };
  const { data: { user } } = await sb.auth.getUser();      // getUser() hỏi lại Supabase — không tin cookie suông
  if (!user) return { trang: "chua_dang_nhap" };
  const email = user.email ?? null;

  const { data: vai, error } = await sb.rpc("vai_tro_cua_toi");
  if (error) return { trang: "chua_migration", email };
  if (!vai) return { trang: "khong_quyen", email };
  const vaiTro = vai as VaiTro;

  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  // Đã đăng ký TOTP chưa: lấy từ user của getUser() (bản mới từ máy chủ) — nextLevel đọc user trong cookie, có thể cũ.
  const factorId = (user.factors ?? []).find((f) => f.factor_type === "totp" && f.status === "verified")?.id ?? null;
  if (aal?.currentLevel !== "aal2") return { trang: "can_mfa", user, vaiTro, factorId };
  return { trang: "ok", user, vaiTro, sb };
}

/** Trang quản trị gọi đầu tiên. Chưa đăng nhập → trang đăng nhập; chưa MFA → bước xác thực.
 *  Trả về phiên ok, hoặc trạng thái để trang hiện lời báo (chưa bật / chưa chạy migration / không có quyền). */
export async function congQuanTri(): Promise<Extract<PhienQuanTri, { trang: "ok" | "chua_bat" | "chua_migration" | "khong_quyen" }>> {
  const p = await phienQuanTri();
  if (p.trang === "chua_dang_nhap") redirect("/dang-nhap?tiep=/quan-tri");
  if (p.trang === "can_mfa") redirect("/quan-tri/xac-thuc");
  return p;
}

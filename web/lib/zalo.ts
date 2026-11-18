// DN-2 — đăng nhập bằng Zalo (Zalo Login / Social API v4, OAuth 2 + PKCE). Supabase Auth KHÔNG có sẵn Zalo nên máy chủ
// web tự làm phần OAuth rồi cấp phiên Supabase cho một tài khoản "đại diện" (email không thật, xem emailZalo).
// Không thêm thư viện: chỉ fetch + node:crypto. Chỉ chạy ở máy chủ (route /auth/zalo*). Hướng dẫn: docs/DANG-NHAP.md mục 6.
import { createHash, randomBytes } from "node:crypto";
export { MIEN_EMAIL_ZALO, emailZalo, laEmailZalo } from "@/lib/zalo-email";

export const ZALO_XIN_QUYEN = "https://oauth.zaloapp.com/v4/permission";
export const ZALO_DOI_MA = "https://oauth.zaloapp.com/v4/access_token";
export const ZALO_NGUOI_DUNG = "https://graph.zalo.me/v2.0/me";
export const COOKIE_ZALO = "hbt-zalo";

export type CauHinhZalo = { appId: string; bimat: string };
export function cauHinhZalo(env: Record<string, string | undefined> = process.env): CauHinhZalo | null {
  const appId = env.ZALO_APP_ID?.trim(), bimat = env.ZALO_APP_SECRET?.trim();
  return appId && bimat && /^\d{5,25}$/.test(appId) ? { appId, bimat } : null;
}

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** PKCE (RFC 7636): verifier 43 ký tự base64url, challenge = base64url(SHA-256(verifier)). */
export function taoPkce(): { verifier: string; challenge: string; state: string } {
  const verifier = b64url(randomBytes(32));
  return { verifier, challenge: thachThuc(verifier), state: b64url(randomBytes(16)) };
}
export const thachThuc = (verifier: string) => b64url(createHash("sha256").update(verifier, "ascii").digest());

export function urlXinQuyen(appId: string, veLai: string, challenge: string, state: string): string {
  const u = new URL(ZALO_XIN_QUYEN);
  u.searchParams.set("app_id", appId);
  u.searchParams.set("redirect_uri", veLai);
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("state", state);
  return u.toString();
}

/** Chỉ đường dẫn nội bộ (cùng luật ?tiep= của trang đăng nhập — SEC-2). */
export function tiepAnToan(tiep: string | null | undefined): string {
  return tiep && /^\/(?![/\\])[^\s\\]*$/.test(tiep) ? tiep : "/tai-khoan";
}

const CHO_MS = 8000;
async function goi(url: string, init: RequestInit): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(CHO_MS) });
    const j = (await r.json()) as unknown;
    return j && typeof j === "object" ? (j as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Lỗi Zalo trả về — chỉ mã + tên lỗi (không token, không bí mật) để ghi nhật ký máy chủ khi chẩn đoán. */
export type LoiZalo = { buoc: "doi_ma" | "nguoi_dung"; ma?: unknown; ten?: unknown };
const loiCua = (buoc: LoiZalo["buoc"], j: Record<string, unknown> | null): LoiZalo =>
  ({ buoc, ma: j?.error ?? (j ? "khong_ro" : "khong_goi_duoc"), ten: j?.error_name ?? j?.message });

/** Đổi mã xác nhận lấy access token (header secret_key, thân x-www-form-urlencoded). */
export async function doiMa(cfg: CauHinhZalo, code: string, verifier: string): Promise<{ token: string } | LoiZalo> {
  const j = await goi(ZALO_DOI_MA, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", secret_key: cfg.bimat },
    body: new URLSearchParams({ app_id: cfg.appId, code, code_verifier: verifier, grant_type: "authorization_code" }),
  });
  return typeof j?.access_token === "string" && j.access_token ? { token: j.access_token } : loiCua("doi_ma", j);
}

/** Chỉ lấy mã người dùng (id). Không xin tên, ảnh, số điện thoại — không lưu thứ không cần. */
export async function layMaNguoiDung(accessToken: string): Promise<{ id: string } | LoiZalo> {
  const j = await goi(`${ZALO_NGUOI_DUNG}?fields=id`, { headers: { access_token: accessToken } });
  const id = j?.id;
  if (typeof id === "string" && /^\d{1,30}$/.test(id)) return { id };
  if (typeof id === "number" && Number.isSafeInteger(id)) return { id: String(id) };
  return loiCua("nguoi_dung", j);
}

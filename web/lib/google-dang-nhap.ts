// DN-3 — đăng nhập Google qua chính hieuban.com (không lộ tên miền Supabase trên màn hình chọn tài khoản Google).
// Luồng chuẩn của Supabase gửi Google về <dự án>.supabase.co/auth/v1/callback → Google hiện "to continue to
// <dự án>.supabase.co". Ở đây máy chủ web tự làm OAuth 2 + PKCE với Google, redirect_uri là hieuban.com/auth/google/callback,
// lấy id_token rồi đổi sang phiên Supabase bằng signInWithIdToken (Supabase vẫn kiểm chữ ký + audience của token).
// Không thêm thư viện. Thiếu env GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET → trang đăng nhập dùng luồng Supabase cũ.
import { createHash, randomBytes } from "node:crypto";

export const GOOGLE_XIN_QUYEN = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_DOI_MA = "https://oauth2.googleapis.com/token";
export const COOKIE_GOOGLE = "hbt-google";

export type CauHinhGoogle = { clientId: string; bimat: string };
export function cauHinhGoogle(env: Record<string, string | undefined> = process.env): CauHinhGoogle | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim(), bimat = env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && bimat && /\.apps\.googleusercontent\.com$/.test(clientId) ? { clientId, bimat } : null;
}

const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** Nonce gửi Google = sha256(hex) của nonce thô; Supabase nhận nonce thô rồi tự băm để so (cách Supabase hướng dẫn). */
export const bamNonce = (tho: string) => createHash("sha256").update(tho).digest("hex");

export function taoPhienGoogle(): { verifier: string; challenge: string; state: string; nonce: string } {
  const verifier = b64url(randomBytes(32));
  return {
    verifier,
    challenge: b64url(createHash("sha256").update(verifier, "ascii").digest()),
    state: b64url(randomBytes(16)),
    nonce: b64url(randomBytes(16)),
  };
}

export function urlXinQuyenGoogle(clientId: string, veLai: string, challenge: string, state: string, nonceTho: string): string {
  const u = new URL(GOOGLE_XIN_QUYEN);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", veLai);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("nonce", bamNonce(nonceTho));
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

/** Đổi mã lấy id_token. Lỗi → null. */
export async function doiMaGoogle(cfg: CauHinhGoogle, code: string, verifier: string, veLai: string): Promise<string | null> {
  try {
    const r = await fetch(GOOGLE_DOI_MA, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: cfg.clientId, client_secret: cfg.bimat, redirect_uri: veLai,
        grant_type: "authorization_code", code_verifier: verifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const j = (await r.json()) as { id_token?: unknown };
    return typeof j.id_token === "string" && j.id_token ? j.id_token : null;
  } catch {
    return null;
  }
}

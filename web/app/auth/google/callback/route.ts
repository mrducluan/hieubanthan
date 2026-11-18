// GET /auth/google/callback — DN-3: Google trả mã → kiểm state → đổi mã (PKCE) lấy id_token → phiên Supabase bằng
// signInWithIdToken (nonce thô; Supabase tự băm để so). Mọi lỗi → /dang-nhap?loi=1 (không lộ chi tiết).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { COOKIE_GOOGLE, cauHinhGoogle, doiMaGoogle } from "@/lib/google-dang-nhap";
import { tiepAnToan } from "@/lib/zalo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const loi = () => {
    const r = NextResponse.redirect(new URL("/dang-nhap?loi=1", url.origin));
    r.cookies.delete({ name: COOKIE_GOOGLE, path: "/auth/google" });
    return r;
  };
  const cfg = cauHinhGoogle();
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!cfg || !sbUrl || !anon) return loi();

  const kho = await cookies();
  let luu: { v?: unknown; s?: unknown; n?: unknown; t?: unknown } = {};
  try { luu = JSON.parse(kho.get(COOKIE_GOOGLE)?.value ?? "{}"); } catch { /* bỏ */ }
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  if (!code || !state || typeof luu.v !== "string" || typeof luu.n !== "string" || state !== luu.s) return loi();

  const idToken = await doiMaGoogle(cfg, code, luu.v, `${url.origin}/auth/google/callback`);
  if (!idToken) return loi();

  const sb = createServerClient(sbUrl, anon, {
    cookies: {
      getAll: () => kho.getAll(),
      setAll: (ds) => ds.forEach(({ name, value, options }) => kho.set(name, value, options)),
    },
  });
  const { error } = await sb.auth.signInWithIdToken({ provider: "google", token: idToken, nonce: luu.n });
  if (error) return loi();
  kho.delete({ name: COOKIE_GOOGLE, path: "/auth/google" });
  return NextResponse.redirect(new URL(tiepAnToan(typeof luu.t === "string" ? luu.t : null), url.origin));
}

// GET /auth/google?tiep=… — DN-3: bắt đầu đăng nhập Google qua hieuban.com (không lộ tên miền Supabase).
import { NextResponse } from "next/server";
import { COOKIE_GOOGLE, cauHinhGoogle, taoPhienGoogle, urlXinQuyenGoogle } from "@/lib/google-dang-nhap";
import { tiepAnToan } from "@/lib/zalo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cfg = cauHinhGoogle();
  if (!cfg) return NextResponse.redirect(new URL("/dang-nhap?loi=1", url.origin));
  const { verifier, challenge, state, nonce } = taoPhienGoogle();
  const tiep = tiepAnToan(url.searchParams.get("tiep"));
  const res = NextResponse.redirect(urlXinQuyenGoogle(cfg.clientId, `${url.origin}/auth/google/callback`, challenge, state, nonce));
  res.cookies.set(COOKIE_GOOGLE, JSON.stringify({ v: verifier, s: state, n: nonce, t: tiep }), {
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/auth/google", maxAge: 600,
  });
  return res;
}

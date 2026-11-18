// GET /auth/zalo?tiep=… — DN-2: bắt đầu đăng nhập Zalo. Tạo PKCE + state, giữ trong cookie httpOnly 10 phút, chuyển sang Zalo.
import { NextResponse } from "next/server";
import { COOKIE_ZALO, cauHinhZalo, taoPkce, tiepAnToan, urlXinQuyen } from "@/lib/zalo";
import { cachDangNhap } from "@/lib/dang-nhap";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cfg = cauHinhZalo();
  if (!cfg || !cachDangNhap().oauth.includes("zalo")) return NextResponse.redirect(new URL("/dang-nhap?loi=1", url.origin));
  const { verifier, challenge, state } = taoPkce();
  const tiep = tiepAnToan(url.searchParams.get("tiep"));
  const res = NextResponse.redirect(urlXinQuyen(cfg.appId, `${url.origin}/auth/zalo/callback`, challenge, state));
  res.cookies.set(COOKIE_ZALO, JSON.stringify({ v: verifier, s: state, t: tiep }), {
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/auth/zalo", maxAge: 600,
  });
  return res;
}

// CSP-2: mỗi lượt tải trang một nonce mới → header Content-Security-Policy (lib/csp.ts). Next đọc nonce từ header CSP
// của request để gắn vào script của chính nó; layout đọc `x-nonce` để gắn cho script GTM.
// SEO: bản chạy thật chỉ có MỘT địa chỉ. Ai vào tên miền *.vercel.app của production → chuyển hẳn (308) sang
// hieuban.com, giữ nguyên đường dẫn — tránh Google index hai bản trùng nhau. Preview deploy (VERCEL_ENV=preview)
// và chạy máy không bị ảnh hưởng.
import { NextRequest, NextResponse } from "next/server";
import { SITE_CHINH } from "@/lib/seo";
import { taoCsp, taoNonce } from "@/lib/csp";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(req: NextRequest): NextResponse {
  const host = req.headers.get("host") ?? "";
  if (process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app")) {
    const dich = new URL(req.nextUrl.pathname + req.nextUrl.search, process.env.NEXT_PUBLIC_SITE_URL || SITE_CHINH);
    return NextResponse.redirect(dich, 308);
  }
  const nonce = taoNonce();
  const csp = taoCsp(nonce);
  const dau = new Headers(req.headers);
  dau.set("x-nonce", nonce);
  dau.set("content-security-policy", csp);
  const res = NextResponse.next({ request: { headers: dau } });
  res.headers.set("content-security-policy", csp);
  return res;
}

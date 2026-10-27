// Next 16: middleware.ts đổi tên thành proxy.ts (hàm `proxy`, chạy Node runtime).
// CSP-2: mỗi lượt tải trang một nonce mới → header Content-Security-Policy (lib/csp.ts). Next đọc nonce từ header CSP
// của request để gắn vào script của chính nó; layout đọc `x-nonce` để gắn cho script GTM.
// SEO: bản chạy thật chỉ có MỘT địa chỉ. Ai vào tên miền *.vercel.app của production → chuyển hẳn (308) sang
// hieuban.com, giữ nguyên đường dẫn — tránh Google index hai bản trùng nhau. Preview deploy (VERCEL_ENV=preview)
// và chạy máy không bị ảnh hưởng.
// QT-0: riêng /quan-tri (+ /api/quan-tri) — làm mới phiên Supabase (Server Component không ghi được cookie) + header noindex.
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SITE_CHINH } from "@/lib/seo";
import { taoCsp, taoNonce } from "@/lib/csp";

type CookieMoi = { name: string; value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] };

/** Làm mới phiên đăng nhập: token hết hạn → Supabase cấp token mới. Ghi vào request (để trang đọc ngay bản mới)
 *  và trả danh sách để ghi vào response (trình duyệt lưu). Lỗi mạng → bỏ qua, trang tự báo chưa đăng nhập. */
async function lamMoiPhien(req: NextRequest): Promise<CookieMoi[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const moi: CookieMoi[] = [];
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (ds) => ds.forEach((c) => { req.cookies.set(c.name, c.value); moi.push(c); }),
    },
  });
  try { await sb.auth.getUser(); } catch { /* giữ nguyên */ }
  return moi;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const host = req.headers.get("host") ?? "";
  if (process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app")) {
    const dich = new URL(req.nextUrl.pathname + req.nextUrl.search, process.env.NEXT_PUBLIC_SITE_URL || SITE_CHINH);
    return NextResponse.redirect(dich, 308);
  }
  const { pathname } = req.nextUrl;
  const quanTri = pathname === "/quan-tri" || pathname.startsWith("/quan-tri/") || pathname.startsWith("/api/quan-tri/");
  const cookieMoi = quanTri ? await lamMoiPhien(req) : [];
  // DH-PC2: khung bản đồ vệ tinh tự gắn CSP riêng (Google Maps cần 'unsafe-eval') — không chồng CSP chung lên (hai CSP = giao nhau).
  if (pathname === "/khung/ve-tinh") return NextResponse.next();
  const nonce = taoNonce();
  const csp = taoCsp(nonce);
  const dau = new Headers(req.headers);   // chép SAU khi làm mới phiên → cookie mới đi kèm request
  dau.set("x-nonce", nonce);
  dau.set("content-security-policy", csp);
  const res = NextResponse.next({ request: { headers: dau } });
  res.headers.set("content-security-policy", csp);
  cookieMoi.forEach((c) => res.cookies.set(c.name, c.value, c.options));
  if (quanTri) {
    res.headers.set("x-robots-tag", "noindex, nofollow");
    res.headers.set("cache-control", "private, no-store");
  }
  return res;
}

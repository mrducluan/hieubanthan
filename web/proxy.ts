// Next 16: middleware.ts đổi tên thành proxy.ts (hàm `proxy`, chạy Node runtime).
// CSP-2: mỗi lượt tải trang một nonce mới → header Content-Security-Policy (lib/csp.ts). Next đọc nonce từ header CSP
// của request để gắn vào script của chính nó; layout đọc `x-nonce` để gắn cho script GTM.
// SEO: bản chạy thật chỉ có MỘT địa chỉ. Ai vào tên miền *.vercel.app của production → chuyển hẳn (308) sang
// hieuban.com, giữ nguyên đường dẫn — tránh Google index hai bản trùng nhau. Preview deploy (VERCEL_ENV=preview)
// và chạy máy không bị ảnh hưởng.
// QT-0: riêng /quan-tri (+ /api/quan-tri) — làm mới phiên Supabase (Server Component không ghi được cookie) + header noindex.
import { NextRequest, NextResponse } from "next/server";
import { langHtml, maNgonNguEn } from "@/lib/ngon-ngu";
import { dichRewrite, suaDuongLac } from "@/lib/duong-en";
import { createServerClient } from "@supabase/ssr";
import { SITE_CHINH } from "@/lib/seo";
import { taoCsp, taoCspTinh, taoNonce } from "@/lib/csp";
import { CDN_CACHE_SEO, duocCacheSeo } from "@/lib/cache-seo";

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

// SỰ CỐ-VERCEL (2026-11-02): proxy chạy Node trên Vercel = MỘT lần chạy hàm mỗi yêu cầu khớp. Chỉ trang HTML / điều
// hướng mới cần nonce CSP; ảnh, tệp tĩnh có đuôi, ảnh /og và API JSON thì không (header bảo mật nền vẫn có từ
// next.config.mjs). Giữ: /api/quan-tri (làm mới phiên), .js (sw.js cần CSP của chính nó), .md (bản Markdown trang).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|mediapipe/|og(?:/|$)|api/(?!quan-tri)|.*\\.(?:png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|otf|txt|xml|json|webmanifest|ics|pdf|map)$).*)",
  ],
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
  // EN-ALL mục 3.1: "/en/<slug-việt>" gõ lạc hoặc slug Anh đã đổi → 308 một bước về URL Anh đúng (chỉ trang đã mở).
  const tiengAnh = pathname === "/en" || pathname.startsWith("/en/");
  if (tiengAnh) {
    const dung = suaDuongLac(pathname);
    if (dung) return NextResponse.redirect(new URL(dung + req.nextUrl.search, req.url), 308);
  }
  // URL Anh đã mở mà KHÔNG có trang riêng dưới app/en → hiển thị chính trang Việt tương ứng (một cây component), ngôn ngữ đi
  // theo header. Bảng `lib/duong-en.json` là nguồn duy nhất; trang chưa mở không rewrite (404 tiếng Anh).
  const dichVi = tiengAnh ? dichRewrite(pathname) : null;
  // Q-I3: trang SEO công khai tiếng Việt (allowlist trong lib/cache-seo.ts, không nháp CMS, không query string, không preview)
  // dùng CSP tĩnh (không nonce động) + CDN-Cache-Control để Vercel Edge cache HTML, kéo TTFB Googlebot xuống < 0,2s.
  // Trang công cụ, tài khoản, thanh toán, quản trị, /en/* giữ nguyên CSP-2 (nonce mỗi lượt + 'strict-dynamic').
  const coCookieNhap = Boolean(
    req.cookies.get("__prerender_bypass") ||
    req.cookies.get("__next_preview_data") ||
    req.cookies.get("hbt-xem-truoc"),
  );
  const cacheSeo = !tiengAnh && !quanTri && duocCacheSeo({
    method: req.method,
    pathname,
    search: req.nextUrl.search,
    coCookieNhap,
    vercelEnv: process.env.VERCEL_ENV,
    tatCache: process.env.Q_I3_CACHE_SEO === "0",
  });
  const nonce = cacheSeo ? null : taoNonce();
  const csp = nonce ? taoCsp(nonce) : taoCspTinh();
  const dau = new Headers(req.headers);   // chép SAU khi làm mới phiên → cookie mới đi kèm request
  if (nonce) {
    dau.set("x-nonce", nonce);
    dau.delete("x-cache-seo");
  } else {
    dau.delete("x-nonce");
    dau.set("x-cache-seo", "1");
  }
  dau.set("content-security-policy", csp);
  // QTE: bản tiếng Anh ở /en — layout đọc `x-ngon-ngu` để dựng khung tiếng Anh; route API chuyển tiếp header này tới engine.
  // Ý7: biến thể thị trường (en-us) theo Accept-Language — chỉ khi engine có bản phủ; còn lại "en".
  const maEn = tiengAnh ? maNgonNguEn(req.headers.get("accept-language")) : "vi";
  dau.set("x-ngon-ngu", maEn);
  dau.set("x-duong-dan", pathname);   // HTT-1: layout biết trang đang mở (dải gợi ý bản tiếng Anh chỉ ở trang có bản Anh)
  dau.set("x-duong-hien-thi", pathname);   // EN-ALL: URL người dùng thấy (trước rewrite) → canonical, hreflang, nút đổi ngôn ngữ
  let res: NextResponse;
  if (dichVi) {
    const u = req.nextUrl.clone();
    u.pathname = dichVi;
    res = NextResponse.rewrite(u, { request: { headers: dau } });
  } else {
    res = NextResponse.next({ request: { headers: dau } });
  }
  res.headers.set("content-security-policy", csp);
  if (cacheSeo) {
    res.headers.set("cdn-cache-control", CDN_CACHE_SEO);
    res.headers.set("vercel-cdn-cache-control", CDN_CACHE_SEO);
  }
  if (tiengAnh) { res.headers.set("content-language", langHtml(maEn)); res.headers.append("vary", "Accept-Language"); }
  cookieMoi.forEach((c) => res.cookies.set(c.name, c.value, c.options));
  if (quanTri) {
    res.headers.set("x-robots-tag", "noindex, nofollow");
    res.headers.set("cache-control", "private, no-store");
  }
  return res;
}

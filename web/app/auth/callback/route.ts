// GET /auth/callback — nhận code (link email / Google OAuth, luồng PKCE) → đổi lấy phiên, ghi cookie.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tiep = url.searchParams.get("tiep") ?? "/tai-khoan";
  // SEC-1: chống chuyển hướng mở — "/\\evil.com" trình duyệt hiểu thành "//evil.com". Chỉ nhận đích CÙNG origin.
  let dich = new URL("/tai-khoan", url.origin);
  try {
    const d = new URL(tiep, url.origin);
    if (d.origin === url.origin && tiep.startsWith("/")) dich = d;
  } catch { /* giữ mặc định */ }
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!code || !sbUrl || !key) return NextResponse.redirect(new URL("/dang-nhap?loi=1", url.origin));

  const kho = await cookies();
  const sb = createServerClient(sbUrl, key, {
    cookies: {
      getAll: () => kho.getAll(),
      setAll: (ds) => ds.forEach(({ name, value, options }) => kho.set(name, value, options)),
    },
  });
  const { error } = await sb.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(error ? new URL("/dang-nhap?loi=1", url.origin) : dich);
}

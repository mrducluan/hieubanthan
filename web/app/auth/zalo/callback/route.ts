// GET /auth/zalo/callback?code=…&state=… — DN-2: Zalo trả mã về. Kiểm state → đổi mã (PKCE) → lấy mã người dùng Zalo →
// tạo (lần đầu) tài khoản Supabase có email đại diện → cấp phiên bằng liên kết đăng nhập một lần do máy chủ tự xác nhận.
// Không lưu tên, ảnh, số điện thoại Zalo. Mọi lỗi → /dang-nhap?loi=1 (không lộ chi tiết).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { COOKIE_ZALO, cauHinhZalo, doiMa, emailZalo, layMaNguoiDung, tiepAnToan } from "@/lib/zalo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const loi = () => {
    const r = NextResponse.redirect(new URL("/dang-nhap?loi=1", url.origin));
    r.cookies.delete({ name: COOKIE_ZALO, path: "/auth/zalo" });
    return r;
  };
  const cfg = cauHinhZalo();
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cfg || !sbUrl || !anon || !service) return loi();

  const kho = await cookies();
  let luu: { v?: unknown; s?: unknown; t?: unknown } = {};
  try { luu = JSON.parse(kho.get(COOKIE_ZALO)?.value ?? "{}"); } catch { /* bỏ */ }
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  if (!code || typeof luu.v !== "string" || typeof luu.s !== "string" || !state || state !== luu.s) return loi();

  const token = await doiMa(cfg, code, luu.v);
  const id = token ? await layMaNguoiDung(token) : null;
  const email = id ? emailZalo(id) : null;
  if (!email) return loi();

  // Lần đầu: tạo tài khoản (email đã xác nhận, không mật khẩu). Đã có → lỗi "đã tồn tại", bỏ qua.
  const admin = createClient(sbUrl, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const tao = await admin.auth.admin.createUser({ email, email_confirm: true, app_metadata: { dang_nhap: "zalo" } });
  if (tao.error && !/already|exists|registered/i.test(tao.error.message)) return loi();
  // Liên kết đăng nhập một lần: KHÔNG gửi thư (generateLink chỉ trả mã), máy chủ tự xác nhận ngay → phiên ghi vào cookie.
  const lk = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hash = lk.data?.properties?.hashed_token;
  if (lk.error || !hash) return loi();

  const sb = createServerClient(sbUrl, anon, {
    cookies: {
      getAll: () => kho.getAll(),
      setAll: (ds) => ds.forEach(({ name, value, options }) => kho.set(name, value, options)),
    },
  });
  const { error } = await sb.auth.verifyOtp({ token_hash: hash, type: "email" });
  if (error) return loi();
  kho.delete({ name: COOKIE_ZALO, path: "/auth/zalo" });
  return NextResponse.redirect(new URL(tiepAnToan(typeof luu.t === "string" ? luu.t : null), url.origin));
}

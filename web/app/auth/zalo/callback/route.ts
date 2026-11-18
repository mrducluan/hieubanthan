// GET /auth/zalo/callback?code=…&state=… — DN-2: Zalo trả mã về. Kiểm state → đổi mã (PKCE) → lấy mã người dùng Zalo →
// tạo (lần đầu) tài khoản Supabase có email đại diện → cấp phiên bằng liên kết đăng nhập một lần do máy chủ tự xác nhận.
// Không lưu tên, ảnh, số điện thoại Zalo. Lỗi → /dang-nhap?loi=zalo&b=<bước> (chỉ tên bước, không chi tiết) + một dòng
// nhật ký máy chủ `[zalo] <bước>` kèm mã lỗi Zalo / Supabase (không token, không bí mật, không email) để chẩn đoán.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { COOKIE_ZALO, cauHinhZalo, doiMa, emailZalo, layMaNguoiDung, tiepAnToan } from "@/lib/zalo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const loi = (buoc: string, chiTiet?: unknown) => {
    console.error(`[zalo] ${buoc}`, chiTiet ?? "");
    const r = NextResponse.redirect(new URL(`/dang-nhap?loi=zalo&b=${buoc}`, url.origin));
    r.cookies.delete({ name: COOKIE_ZALO, path: "/auth/zalo" });
    return r;
  };
  const cfg = cauHinhZalo();
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cfg || !sbUrl || !anon || !service) return loi("cau_hinh", { zalo: !!cfg, supabase: !!(sbUrl && anon), service: !!service });
  // Người dùng bấm Từ chối / Zalo báo lỗi ngay trên đường về.
  if (url.searchParams.get("error")) return loi("zalo_tu_choi", { error: url.searchParams.get("error") });

  const kho = await cookies();
  let luu: { v?: unknown; s?: unknown; t?: unknown } = {};
  try { luu = JSON.parse(kho.get(COOKIE_ZALO)?.value ?? "{}"); } catch { /* bỏ */ }
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  if (!code) return loi("khong_ma");
  // Cookie mất (thường do Zalo mở trang quay về trong trình duyệt khác / trình duyệt trong app) hoặc state lệch.
  if (typeof luu.v !== "string" || typeof luu.s !== "string") return loi("mat_cookie");
  if (!state || state !== luu.s) return loi("state");

  const dm = await doiMa(cfg, code, luu.v);
  if (!("token" in dm)) return loi(dm.buoc, { ma: dm.ma, ten: dm.ten });
  const nd = await layMaNguoiDung(dm.token, cfg.bimat);
  if (!("id" in nd)) return loi(nd.buoc, { ma: nd.ma, ten: nd.ten });
  const email = emailZalo(nd.id);
  if (!email) return loi("email");

  // Lần đầu: tạo tài khoản (email đã xác nhận, không mật khẩu). Đã có → lỗi "đã tồn tại", bỏ qua.
  const admin = createClient(sbUrl, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const tao = await admin.auth.admin.createUser({ email, email_confirm: true, app_metadata: { dang_nhap: "zalo" } });
  if (tao.error && !/already|exists|registered/i.test(tao.error.message)) return loi("tao_tk", { ma: tao.error.code ?? tao.error.status, ten: tao.error.message });
  // Liên kết đăng nhập một lần: KHÔNG gửi thư (generateLink chỉ trả mã), máy chủ tự xác nhận ngay → phiên ghi vào cookie.
  const lk = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hash = lk.data?.properties?.hashed_token;
  if (lk.error || !hash) return loi("lien_ket", { ma: lk.error?.code ?? lk.error?.status, ten: lk.error?.message });

  const sb = createServerClient(sbUrl, anon, {
    cookies: {
      getAll: () => kho.getAll(),
      setAll: (ds) => ds.forEach(({ name, value, options }) => kho.set(name, value, options)),
    },
  });
  const { error } = await sb.auth.verifyOtp({ token_hash: hash, type: "email" });
  if (error) return loi("phien", { ma: error.code ?? error.status, ten: error.message });
  kho.delete({ name: COOKIE_ZALO, path: "/auth/zalo" });
  return NextResponse.redirect(new URL(tiepAnToan(typeof luu.t === "string" ? luu.t : null), url.origin));
}

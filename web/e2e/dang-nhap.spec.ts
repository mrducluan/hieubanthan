// DN-1 — cách đăng nhập bật bằng env NEXT_PUBLIC_DANG_NHAP (lib/dang-nhap.ts). Số điện thoại tắt mặc định (SMS tốn phí).
import { test, expect } from "@playwright/test";
import { docCachDangNhap } from "../lib/dang-nhap";

test("thuần: chưa đặt env: Google + email; đã đặt: email chỉ khi ghi rõ; không số điện thoại; thứ tự cố định; bỏ giá trị lạ", () => {
  expect(docCachDangNhap(undefined)).toEqual({ oauth: ["google"], sdt: false, email: true });
  expect(docCachDangNhap("facebook, Apple,google")).toEqual({ oauth: ["google", "apple", "facebook"], sdt: false, email: false });
  expect(docCachDangNhap("google,sdt,twitter")).toEqual({ oauth: ["google"], sdt: true, email: false });
  expect(docCachDangNhap("")).toEqual({ oauth: [], sdt: false, email: false });
  expect(docCachDangNhap("facebook,zalo,google")).toEqual({ oauth: ["google", "zalo", "facebook"], sdt: false, email: false });
  expect(docCachDangNhap("google,EMAIL")).toEqual({ oauth: ["google"], sdt: false, email: true });
});

import { emailZalo, laEmailZalo, thachThuc, tiepAnToan, urlXinQuyen, cauHinhZalo } from "../lib/zalo";

test("thuần: Zalo — PKCE đúng RFC 7636, URL xin quyền, email đại diện, ?tiep= chỉ nội bộ", () => {
  // Ví dụ của RFC 7636 phụ lục B.
  expect(thachThuc("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  const u = new URL(urlXinQuyen("123456", "https://hieuban.com/auth/zalo/callback", "abc", "xyz"));
  expect(u.origin + u.pathname).toBe("https://oauth.zaloapp.com/v4/permission");
  expect(u.searchParams.get("redirect_uri")).toBe("https://hieuban.com/auth/zalo/callback");
  expect(u.searchParams.get("code_challenge")).toBe("abc");
  expect(emailZalo("8812345")).toBe("zalo-8812345@hieuban.com");
  expect(emailZalo("a@b")).toBeNull();
  expect(laEmailZalo("ZALO-1@hieuban.com")).toBe(true);
  expect(laEmailZalo("ban@gmail.com")).toBe(false);
  expect(laEmailZalo("contact@hieuban.com")).toBe(false);
  expect(tiepAnToan("//evil.com")).toBe("/tai-khoan");
  expect(tiepAnToan("/\t/evil.com")).toBe("/tai-khoan");
  expect(tiepAnToan("/hom-nay")).toBe("/hom-nay");
  expect(cauHinhZalo({ ZALO_APP_ID: "123456", ZALO_APP_SECRET: "s" })).toEqual({ appId: "123456", bimat: "s" });
  expect(cauHinhZalo({ ZALO_APP_ID: "abc", ZALO_APP_SECRET: "s" })).toBeNull();
});

import { bamNonce, cauHinhGoogle, urlXinQuyenGoogle } from "../lib/google-dang-nhap";

test("thuần: Google qua hieuban.com — redirect về site, nonce gửi Google là sha256 hex của nonce thô, cấu hình chặt", () => {
  const u = new URL(urlXinQuyenGoogle("123-abc.apps.googleusercontent.com", "https://hieuban.com/auth/google/callback", "ch", "st", "tho"));
  expect(u.origin + u.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
  expect(u.searchParams.get("redirect_uri")).toBe("https://hieuban.com/auth/google/callback");
  expect(u.searchParams.get("scope")).toBe("openid email profile");
  expect(u.searchParams.get("code_challenge_method")).toBe("S256");
  expect(u.searchParams.get("nonce")).toBe(bamNonce("tho"));
  expect(bamNonce("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  expect(cauHinhGoogle({ GOOGLE_CLIENT_ID: "x.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "s" })).not.toBeNull();
  expect(cauHinhGoogle({ GOOGLE_CLIENT_ID: "x", GOOGLE_CLIENT_SECRET: "s" })).toBeNull();
  expect(cauHinhGoogle({})).toBeNull();
});

test("thuần: Zalo — lỗi đổi mã / lấy mã người dùng trả về bước + mã lỗi Zalo, không token", async () => {
  const { doiMa, layMaNguoiDung } = await import("../lib/zalo");
  const goc = globalThis.fetch;
  const tra = (j: unknown) => { globalThis.fetch = (async () => new Response(JSON.stringify(j))) as typeof fetch; };
  try {
    tra({ error: -14019, error_name: "Invalid code verifier" });
    expect(await doiMa({ appId: "123456", bimat: "x" }, "c", "v")).toEqual({ buoc: "doi_ma", ma: -14019, ten: "Invalid code verifier" });
    tra({ access_token: "tok" });
    expect(await doiMa({ appId: "123456", bimat: "x" }, "c", "v")).toEqual({ token: "tok" });
    tra({ id: "1234567890", error: 0, message: "Success" });
    expect(await layMaNguoiDung("tok")).toEqual({ id: "1234567890" });
    tra({ error: 452, message: "Session key invalid" });
    expect(await layMaNguoiDung("tok")).toEqual({ buoc: "nguoi_dung", ma: 452, ten: "Session key invalid" });
  } finally {
    globalThis.fetch = goc;
  }
});

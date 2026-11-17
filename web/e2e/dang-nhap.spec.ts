// DN-1 — cách đăng nhập bật bằng env NEXT_PUBLIC_DANG_NHAP (lib/dang-nhap.ts). Số điện thoại tắt mặc định (SMS tốn phí).
import { test, expect } from "@playwright/test";
import { docCachDangNhap } from "../lib/dang-nhap";

test("thuần: mặc định chỉ Google, không số điện thoại; thứ tự cố định; bỏ giá trị lạ", () => {
  expect(docCachDangNhap(undefined)).toEqual({ oauth: ["google"], sdt: false });
  expect(docCachDangNhap("facebook, Apple,google")).toEqual({ oauth: ["google", "apple", "facebook"], sdt: false });
  expect(docCachDangNhap("google,sdt,twitter")).toEqual({ oauth: ["google"], sdt: true });
  expect(docCachDangNhap("")).toEqual({ oauth: [], sdt: false });
});

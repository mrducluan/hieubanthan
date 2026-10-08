"use client";
// Supabase phía trình duyệt — CHỈ dùng cho tài khoản + bảng ho_so (RLS chủ sở hữu, migration 0006).
// Thiếu env → null: mọi tính năng tài khoản ẩn đi, phần còn lại vẫn chạy (hồ sơ trên máy).
// PERF-1: nạp thư viện bằng import() — ~70 KB (nén) chỉ tải khi thật sự cần tài khoản, không nằm trong gói trang.
import type { SupabaseClient } from "@supabase/supabase-js";

let khach: Promise<SupabaseClient | null> | undefined;

export function supabase(): Promise<SupabaseClient | null> {
  if (khach) return khach;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  khach = url && key
    ? import("@supabase/ssr").then(({ createBrowserClient }) => createBrowserClient(url, key))
    : Promise.resolve(null);
  return khach;
}

export const coTaiKhoan = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

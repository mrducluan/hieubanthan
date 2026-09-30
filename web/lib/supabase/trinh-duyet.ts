"use client";
// Supabase phía trình duyệt — CHỈ dùng cho tài khoản + bảng ho_so (RLS chủ sở hữu, migration 0006).
// Thiếu env → null: mọi tính năng tài khoản ẩn đi, phần còn lại vẫn chạy (hồ sơ trên máy).
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let khach: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (khach !== undefined) return khach;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  khach = url && key ? createBrowserClient(url, key) : null;
  return khach;
}

export const coTaiKhoan = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

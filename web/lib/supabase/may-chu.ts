// Supabase phía MÁY CHỦ (Server Component / route handler) — đọc phiên đăng nhập từ cookie, chạy với quyền của
// chính người dùng (RLS). Không dùng service role ở đây. Server Component không ghi được cookie → phiên được làm mới
// ở middleware (chỉ các đường dẫn cần phiên, vd /quan-tri).
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function supabaseMayChu(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const kho = await cookies();
  return createServerClient(url, key, {
    cookies: { getAll: () => kho.getAll(), setAll: () => { /* chỉ đọc — middleware làm mới phiên */ } },
  });
}

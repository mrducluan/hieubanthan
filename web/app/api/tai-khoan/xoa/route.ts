// POST /api/tai-khoan/xoa — xoá hẳn tài khoản của CHÍNH người gọi (xác minh bằng access token),
// bảng ho_so xoá theo (on delete cascade). Service role key chỉ ở server.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return NextResponse.json({ error: "Tài khoản chưa được bật." }, { status: 503 });
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Thiếu phiên đăng nhập." }, { status: 401 });

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "Phiên không hợp lệ." }, { status: 401 });
  const xoa = await admin.auth.admin.deleteUser(data.user.id);
  if (xoa.error) return NextResponse.json({ error: "Chưa xoá được." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

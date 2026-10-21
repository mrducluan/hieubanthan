// GET /api/push/khoa — khoá VAPID CÔNG KHAI cho trình duyệt đăng ký Web Push (KC-4 GĐ1). Chưa đặt khoá VAPID hoặc
// chưa bật tài khoản → 404, nút "Bật nhắc" tự ẩn. Khoá riêng tư không bao giờ rời máy chủ.
import { NextResponse } from "next/server";
import { khoaVapid } from "@/lib/web-push";

export const dynamic = "force-dynamic";

export function GET() {
  const k = khoaVapid();
  if (!k || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Nhắc qua thông báo chưa bật." }, { status: 404 });
  }
  return NextResponse.json({ khoa: k.congKhai }, { headers: { "cache-control": "public, max-age=3600" } });
}

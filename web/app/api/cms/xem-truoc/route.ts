// Nút "Xem trước" trong CMS → /api/cms/xem-truoc?slug=…&ma=HMAC(slug). Mã đúng → bật draft mode (cookie phiên,
// chỉ trình duyệt này) rồi mở bài; trang bài đọc bản NHÁP mới nhất bằng khoá API Máy đọc (CMS_API_KEY).
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { maXemTruoc, soKhop } from "@/lib/cms";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const slug = u.searchParams.get("slug") ?? "";
  if (!/^[a-z0-9-]{1,120}$/.test(slug) || !soKhop(u.searchParams.get("ma"), maXemTruoc(slug))) {
    return NextResponse.json({ loi: "Link xem trước không hợp lệ hoặc đã đổi khoá." }, { status: 401 });
  }
  (await draftMode()).enable();
  redirect(`/blog/${slug}`);
}

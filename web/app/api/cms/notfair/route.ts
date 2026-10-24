// GET /api/cms/notfair[?slug=] — BLOG-3b: CMS (cms.hieuban.com) lấy bài trao đổi NotFair QUA web khi dự án CMS chưa đặt
// NOTFAIR_SEO_API_KEY. Web đã có khoá (để dựng /blog) → trả về đúng dạng API NotFair ({posts} / {post}) để CMS nhập bài thành
// nháp và Chủ biên sửa chữ, ảnh như bài tự viết. Chỉ nhận khi header x-cms-bi-mat khớp CMS_WEBHOOK_SECRET (cùng bí mật CMS
// dùng để báo web làm mới cache) — khoá NotFair không rời máy chủ web, không có NEXT_PUBLIC_.
import { NextResponse } from "next/server";
import { getSeoPost, getSeoPosts } from "notfair-nextjs-blog";
import { coNotFair } from "@/lib/blog";
import { soKhop } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const bi = process.env.CMS_WEBHOOK_SECRET;
  if (!bi || !soKhop(req.headers.get("x-cms-bi-mat"), bi)) {
    return NextResponse.json({ loi: "Không được phép." }, { status: 401 });
  }
  if (!coNotFair()) return NextResponse.json({ loi: "Web chưa đặt NOTFAIR_SEO_API_KEY." }, { status: 503 });
  const slug = new URL(req.url).searchParams.get("slug");
  try {
    if (slug === null) return NextResponse.json({ posts: await getSeoPosts({ revalidate: 60 }) });
    const s = slug.normalize("NFC").trim();
    if (!s || s.length > 200) return NextResponse.json({ loi: "Đường dẫn bài không hợp lệ." }, { status: 422 });
    const post = await getSeoPost(s, { revalidate: 60 });
    if (!post) return NextResponse.json({ loi: "Không có bài này." }, { status: 404 });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ loi: "NotFair không trả lời." }, { status: 502 });
  }
}

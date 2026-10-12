// CMS báo "bài/tính năng vừa đổi" → xoá cache thẻ "cms" (danh sách blog, bài, sitemap, llms.txt đọc lại CMS).
// Chỉ nhận khi header x-cms-bi-mat khớp CMS_WEBHOOK_SECRET (so thời gian hằng). Không nhận nội dung bài nào từ CMS.
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { soKhop, TAG_CMS } from "@/lib/cms";

export async function POST(req: Request) {
  const bi = process.env.CMS_WEBHOOK_SECRET;
  if (!bi || !soKhop(req.headers.get("x-cms-bi-mat"), bi)) {
    return NextResponse.json({ loi: "Không được phép." }, { status: 401 });
  }
  let slug: string | null = null;
  try {
    const b = (await req.json()) as { slug?: unknown };
    slug = typeof b.slug === "string" && /^[a-z0-9-]{1,120}$/.test(b.slug) ? b.slug : null;
  } catch { /* thân rỗng vẫn làm mới */ }
  revalidateTag(TAG_CMS, { expire: 0 });
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  if (slug) revalidatePath(`/blog/${slug}`);
  return NextResponse.json({ ok: true });
}

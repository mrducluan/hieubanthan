// CMS báo "bài/tính năng vừa đổi" → xoá cache thẻ "cms" (danh sách blog, bài, sitemap, llms.txt đọc lại CMS).
// Chỉ nhận khi header x-cms-bi-mat khớp CMS_WEBHOOK_SECRET (so thời gian hằng). Không nhận nội dung bài nào từ CMS.
// ND: kèm `duong` (trang website vừa đổi) → xoá thêm thẻ "trang:<duong>" (chỉ nhận đường dẫn trong site).
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { kiemBiMatCms, TAG_CMS } from "@/lib/cms";
import { duongHopLe, theTrang } from "@/lib/noi-dung-trang";

export async function POST(req: Request) {
  const chan = kiemBiMatCms(req);
  if (chan) return chan;
  let slug: string | null = null, duong: string | null = null;
  try {
    const b = (await req.json()) as { slug?: unknown; duong?: unknown };
    slug = typeof b.slug === "string" && /^[a-z0-9-]{1,120}$/.test(b.slug) ? b.slug : null;
    duong = duongHopLe(b.duong);
  } catch { /* thân rỗng vẫn làm mới */ }
  revalidateTag(TAG_CMS, { expire: 0 });
  if (duong) revalidateTag(theTrang(duong), { expire: 0 });
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  if (slug) revalidatePath(`/blog/${slug}`);
  return NextResponse.json({ ok: true });
}

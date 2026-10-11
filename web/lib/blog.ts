// Blog /blog/{slug} — bài của ban biên tập (CMS, lib/cms.ts) + bài trao đổi SEO từ NotFair (kéo phía máy chủ bằng khoá riêng NOTFAIR_SEO_API_KEY, không NEXT_PUBLIC_).
// Thư viện ném lỗi khi thiếu khoá → bọc lại: chưa đặt khoá hoặc NotFair lỗi thì /blog trống, sitemap vẫn dựng được.
import { getSeoPost, getSeoPosts, type SeoPost, type SeoPostSummary } from "notfair-nextjs-blog";
import { dsBaiCms } from "@/lib/cms";
import { gopBaiBlog, tuCms } from "@/lib/blog-gop";
export { gopBaiBlog, type BaiBlog } from "@/lib/blog-gop";

export function coNotFair(): boolean {
  return Boolean(process.env.NOTFAIR_SEO_API_KEY);
}

/** Danh sách bài (không có thân bài). Cache 1 giờ ở tầng fetch. */
export async function dsBaiBlog(): Promise<SeoPostSummary[]> {
  if (!coNotFair()) return [];
  try { return await getSeoPosts(); } catch { return []; }
}

/** Một bài đầy đủ, hoặc null nếu không có / chưa xuất bản. */
export async function baiBlog(slug: string): Promise<SeoPost | null> {
  if (!coNotFair()) return null;
  try { return await getSeoPost(slug); } catch { return null; }
}

export const duongBlog = (slug: string) => `/blog/${slug}`;

/** Danh sách cho /blog, sitemap: bài CMS + bài NotFair (bài CMS thắng khi trùng slug). */
export async function dsBaiTongHop() {
  const [cms, nf] = await Promise.all([dsBaiCms(), dsBaiBlog()]);
  return gopBaiBlog(cms.map(tuCms), nf);
}

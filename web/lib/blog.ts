// Blog /blog/{slug} — bài trao đổi SEO từ NotFair (kéo phía máy chủ bằng khoá riêng NOTFAIR_SEO_API_KEY, không NEXT_PUBLIC_).
// Thư viện ném lỗi khi thiếu khoá → bọc lại: chưa đặt khoá hoặc NotFair lỗi thì /blog trống, sitemap vẫn dựng được.
import { getSeoPost, getSeoPosts, type SeoPost, type SeoPostSummary } from "notfair-nextjs-blog";

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

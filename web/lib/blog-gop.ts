// Gộp nguồn blog (CMS + NotFair) — tách riêng khỏi lib/blog.ts để test được mà không nạp thư viện NotFair (ESM).
import type { SeoPostSummary } from "notfair-nextjs-blog";
import { anhCms, type BaiCmsTomTat } from "@/lib/cms";

export type BaiBlog = {
  slug: string; tieuDe: string; moTa: string | null; ngay: string | null; capNhat: string | null;
  anh: { src: string; w: number; h: number; alt: string } | null; phut: number | null; nguon: "cms" | "notfair";
  noindex?: boolean;
};

export const tuCms = (b: BaiCmsTomTat): BaiBlog => ({
  slug: b.slug, tieuDe: b.tieu_de, moTa: b.mo_ta_ngan || b.meta?.description || null,
  ngay: b.publishedAt ?? null, capNhat: b.updatedAt ?? null, anh: anhCms(b.anh_bia, "vua"), phut: null, nguon: "cms",
  noindex: Boolean(b.noindex),
});

export function gopBaiBlog(rieng: BaiBlog[], notfair: SeoPostSummary[]): BaiBlog[] {
  const co = new Set(rieng.map((b) => b.slug));
  const nf: BaiBlog[] = notfair.filter((p) => !co.has(p.slug)).map((p) => ({
    slug: p.slug, tieuDe: p.title, moTa: p.meta_description ?? null, ngay: p.published_at ?? null, capNhat: p.published_at ?? null,
    anh: p.image_url ? { src: p.image_url, w: 1600, h: 900, alt: p.title } : null, phut: p.reading_time_minutes ?? null, nguon: "notfair",
  }));
  return [...rieng, ...nf].sort((a, b) => (b.ngay ?? "").localeCompare(a.ngay ?? ""));
}

/** Next 15 trả params ĐÃ mã hoá phần trăm với ký tự ngoài ASCII (slug NotFair có "đ", dấu…) → giải mã trước khi tra,
 *  nếu không thư viện mã hoá lần nữa ("%25C4%2591") và bài thành 404. Chuỗi hỏng giữ nguyên. */
export function slugTuUrl(s: string): string {
  try { return decodeURIComponent(s).normalize("NFC"); } catch { return s.normalize("NFC"); }
}

/** Đường dẫn bài, slug mã hoá phần trăm (canonical, sitemap, JSON-LD hợp chuẩn URL kể cả slug có dấu). */
export const duongBlog = (slug: string) => `/blog/${encodeURIComponent(slug)}`;

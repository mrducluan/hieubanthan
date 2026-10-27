// Gộp nguồn blog (CMS + NotFair) — tách riêng khỏi lib/blog.ts để test được mà không nạp thư viện NotFair (ESM).
import type { SeoPostSummary } from "notfair-nextjs-blog";
import { anhCms, cacChuyenMuc, type BaiCmsTomTat, type ChuyenMucCms, type LoaiBai } from "@/lib/cms";

export type BaiBlog = {
  slug: string; tieuDe: string; moTa: string | null; ngay: string | null; capNhat: string | null;
  anh: { src: string; w: number; h: number; alt: string } | null; phut: number | null; nguon: "cms" | "notfair";
  noindex?: boolean;
  /** Bài CMS: đường dẫn cũ (đã đổi) → bài NotFair cùng đường dẫn cũ không hiện trùng trong danh sách. */
  slugCu?: string[];
  loai?: LoaiBai; mang?: string | null; chuyenMuc?: ChuyenMucCms[];
};

export const tuCms = (b: BaiCmsTomTat): BaiBlog => ({
  slug: b.slug, tieuDe: b.tieu_de, moTa: b.mo_ta_ngan || b.meta?.description || null,
  ngay: b.publishedAt ?? null, capNhat: b.updatedAt ?? null, anh: anhCms(b.anh_bia, "vua"), phut: null, nguon: "cms",
  noindex: Boolean(b.noindex), slugCu: b.slug_cu ?? [], loai: b.loai_bai ?? "bai_viet", mang: b.mang ?? null, chuyenMuc: cacChuyenMuc(b),
});

export function gopBaiBlog(rieng: BaiBlog[], notfair: SeoPostSummary[]): BaiBlog[] {
  // BLOG-7: bài NotFair hiện ở đường dẫn CHUẨN (không dấu); bài CMS cùng slug, hoặc đã nhập rồi đổi slug (slug cũ trong
  // slug_cu), thắng — không hiện hai lần.
  const co = new Set(rieng.flatMap((b) => [b.slug, ...(b.slugCu ?? [])]));
  const nf: BaiBlog[] = notfair.filter((p) => !co.has(p.slug) && !co.has(slugChuan(p.slug))).map((p) => ({
    slug: slugChuan(p.slug), tieuDe: p.title, moTa: p.meta_description ?? null, ngay: p.published_at ?? null, capNhat: p.published_at ?? null,
    anh: p.image_url ? { src: p.image_url, w: 1600, h: 900, alt: p.title } : null, phut: p.reading_time_minutes ?? null, nguon: "notfair",
  }));
  return [...rieng, ...nf].sort((a, b) => (b.ngay ?? "").localeCompare(a.ngay ?? ""));
}

/** Slug chuẩn của blog (BLOG-7): không dấu, chữ thường, gạch ngang, ≤ 75 ký tự cắt ở ranh giới từ. NotFair để sót "đ"
 *  ("…-va-đoc-ho-so…") → đường dẫn có dấu, xấu khi chia sẻ và lệch chuẩn. GIỐNG HỆT cms/src/lib/chuan-hoa-bai.ts slugChuan. */
export function slugChuan(s: string): string {
  const d = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (d.length <= 75) return d;
  const c = d.slice(0, 76);
  return c.slice(0, c.lastIndexOf("-") > 0 ? c.lastIndexOf("-") : 75);
}

/** Next 15 trả params ĐÃ mã hoá phần trăm với ký tự ngoài ASCII (slug NotFair có "đ", dấu…) → giải mã trước khi tra,
 *  nếu không thư viện mã hoá lần nữa ("%25C4%2591") và bài thành 404. Chuỗi hỏng giữ nguyên. */
export function slugTuUrl(s: string): string {
  try { return decodeURIComponent(s).normalize("NFC"); } catch { return s.normalize("NFC"); }
}

/** Đường dẫn bài, slug mã hoá phần trăm (canonical, sitemap, JSON-LD hợp chuẩn URL kể cả slug có dấu). */
export const duongBlog = (slug: string) => `/blog/${encodeURIComponent(slug)}`;

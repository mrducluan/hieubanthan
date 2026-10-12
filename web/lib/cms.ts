// CMS (Payload, cms.hieuban.com) → web. Web chỉ ĐỌC qua REST; mọi lời gọi chạy ở máy chủ.
//   CMS_URL             địa chỉ CMS (vd https://cms.hieuban.com). Chưa đặt → web như chưa có CMS (blog chỉ NotFair).
//   CMS_API_KEY         khoá API của tài khoản "Máy đọc" — CHỈ dùng khi xem trước bản nháp (draft mode).
//   CMS_PREVIEW_SECRET  ký link xem trước (CMS tạo, web kiểm)       CMS_WEBHOOK_SECRET  CMS báo web xoá cache
// Cache: thẻ "cms", 5 phút; CMS báo đổi → /api/cms/lam-moi xoá ngay. CMS chậm/lỗi → coi như không có bài (không vỡ trang).
import { createHmac, timingSafeEqual } from "node:crypto";

export const TAG_CMS = "cms";

export type AnhCms = {
  url: string; alt: string; width?: number | null; height?: number | null;
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null } | undefined>;
};
export type NguoiCms = { id: number; ten: string; slug?: string | null; chuc_danh?: string | null; trang_ho_so?: string | null;
  gioi_thieu?: string | null; lien_ket?: { url: string }[] | null };
export type BaiCmsTomTat = {
  id: number; tieu_de: string; slug: string; mo_ta_ngan?: string | null; anh_bia?: AnhCms | null;
  publishedAt?: string | null; updatedAt: string; mang?: string | null; the?: string[] | null;
  noindex?: boolean | null; dua_vao_llms?: boolean | null; tra_loi_nhanh?: string | null;
  meta?: { title?: string | null; description?: string | null; image?: AnhCms | null } | null;
};
export type BaiCms = BaiCmsTomTat & {
  noi_dung_html?: string | null;
  hoi_dap?: { cau_hoi: string; tra_loi: string }[] | null;
  nguon?: { ten: string; url?: string | null }[] | null;
  tu_khoa_chinh?: string | null; tu_khoa_phu?: string[] | null; canonical?: string | null;
  ky_ten?: "ban_bien_tap" | "tac_gia" | "tham_dinh" | null;
  tac_gia?: NguoiCms | null; nguoi_tham_dinh?: NguoiCms | null; ngay_tham_dinh?: string | null;
  chuyen_muc?: { ten: string; slug: string }[] | null;
  bai_lien_quan?: BaiCmsTomTat[] | null; slug_cu?: string[] | null;
  _status?: "draft" | "published";
};
export type TinhNangCms = {
  blog_bat: boolean; muc_luc: boolean; bai_lien_quan: boolean; keu_goi_cong_cu: boolean; llms_txt: boolean; ban_markdown: boolean;
};
export const TINH_NANG_MAC_DINH: TinhNangCms = {
  blog_bat: true, muc_luc: true, bai_lien_quan: true, keu_goi_cong_cu: true, llms_txt: true, ban_markdown: true,
};

export const cmsUrl = () => (process.env.CMS_URL || "").replace(/\/+$/, "");
export const coCms = () => Boolean(cmsUrl());

type Goi = { nhap?: boolean };

async function goiCms<T>(duong: string, { nhap = false }: Goi = {}): Promise<T | null> {
  const goc = cmsUrl();
  if (!goc) return null;
  const headers: Record<string, string> = { accept: "application/json" };
  if (nhap && process.env.CMS_API_KEY) headers.authorization = `bien-tap-vien API-Key ${process.env.CMS_API_KEY}`;
  try {
    const r = await fetch(`${goc}${duong}`, {
      headers,
      signal: AbortSignal.timeout(4_000),
      ...(nhap ? { cache: "no-store" as const } : { next: { revalidate: 300, tags: [TAG_CMS] } }),
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** Mã hoá where/select kiểu qs của Payload: { where: { slug: { equals: "x" } } } → where[slug][equals]=x */
export function chuoiTruyVan(o: Record<string, unknown>, tien = ""): string[] {
  const ra: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    const khoa = tien ? `${tien}[${k}]` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) ra.push(...chuoiTruyVan(v as Record<string, unknown>, khoa));
    else if (Array.isArray(v)) v.forEach((x, i) => ra.push(...(x && typeof x === "object"
      ? chuoiTruyVan(x as Record<string, unknown>, `${khoa}[${i}]`) : [`${encodeURIComponent(`${khoa}[${i}]`)}=${encodeURIComponent(String(x))}`])));
    else if (v !== undefined) ra.push(`${encodeURIComponent(khoa)}=${encodeURIComponent(String(v))}`);
  }
  return ra;
}
const tv = (o: Record<string, unknown>) => chuoiTruyVan(o).join("&");

const CHON_TOM_TAT = {
  tieu_de: true, slug: true, mo_ta_ngan: true, anh_bia: true, publishedAt: true, updatedAt: true, mang: true,
  the: true, noindex: true, dua_vao_llms: true, tra_loi_nhanh: true, meta: true,
};

export async function tinhNangCms(): Promise<TinhNangCms> {
  const g = await goiCms<Partial<TinhNangCms>>("/api/globals/tinh-nang?depth=0");
  const ra = { ...TINH_NANG_MAC_DINH };
  if (g) for (const k of Object.keys(ra) as (keyof TinhNangCms)[]) if (typeof g[k] === "boolean") ra[k] = g[k]!;
  return ra;
}

/** Bài đã xuất bản, mới nhất trước (tối đa 500). Công tắc blog_bat tắt → []. */
export async function dsBaiCms(): Promise<BaiCmsTomTat[]> {
  if (!coCms()) return [];
  const [tn, r] = await Promise.all([
    tinhNangCms(),
    goiCms<{ docs: BaiCmsTomTat[] }>(`/api/bai-viet?${tv({
      where: { _status: { equals: "published" } }, sort: "-publishedAt", limit: 500, depth: 1, select: CHON_TOM_TAT,
    })}`),
  ]);
  if (!tn.blog_bat || !r?.docs) return [];
  return r.docs.filter((b) => b.slug && b.tieu_de);
}

/** Một bài theo slug (bản xuất bản; `nhap` = bản nháp mới nhất, cần CMS_API_KEY). Không có → tra slug cũ để chuyển hướng. */
export async function baiCms(slug: string, nhap = false): Promise<{ bai: BaiCms } | { chuyen: string } | null> {
  if (!coCms() || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  if (!nhap && !(await tinhNangCms()).blog_bat) return null;
  const r = await goiCms<{ docs: BaiCms[] }>(`/api/bai-viet?${tv({
    where: { slug: { equals: slug } }, limit: 1, depth: 2, ...(nhap ? { draft: "true" } : {}),
  })}`, { nhap });
  const bai = r?.docs?.[0];
  if (bai && (nhap || bai._status !== "draft")) return { bai };
  if (nhap) return null;
  const cu = await goiCms<{ docs: { slug: string }[] }>(`/api/bai-viet?${tv({
    where: { slug_cu: { in: slug } }, limit: 1, depth: 0, select: { slug: true },
  })}`);
  const moi = cu?.docs?.[0]?.slug;
  return moi && moi !== slug ? { chuyen: moi } : null;
}

/** Bài liên quan: chọn tay trong CMS, thiếu thì lấy bài cùng mảng mới nhất. */
export async function baiLienQuan(bai: BaiCms, toiDa = 3): Promise<BaiCmsTomTat[]> {
  const chon = (bai.bai_lien_quan ?? []).filter((b) => b && typeof b === "object" && b.slug);
  if (chon.length >= toiDa) return chon.slice(0, toiDa);
  const ds = await dsBaiCms();
  const them = ds.filter((b) => b.slug !== bai.slug && !chon.some((c) => c.slug === b.slug))
    .sort((a, b) => Number(b.mang === bai.mang) - Number(a.mang === bai.mang));
  return [...chon, ...them].slice(0, toiDa);
}

// ---------------------------------------------------------------- xem trước (draft mode)

/** Cùng công thức với cms/src/lib/web.ts `maXemTruoc`. */
export function maXemTruoc(slug: string, bi = process.env.CMS_PREVIEW_SECRET): string | null {
  if (!bi) return null;
  return createHmac("sha256", bi).update(`xem-truoc:${slug}`).digest("base64url");
}

export function soKhop(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// ---------------------------------------------------------------- tiện ích hiển thị

export const anhCms = (a: AnhCms | null | undefined, co: "og" | "vua" | "nho" = "vua") =>
  a && typeof a === "object" && a.url ? { src: a.sizes?.[co]?.url || a.url, w: a.sizes?.[co]?.width || a.width || 1200,
    h: a.sizes?.[co]?.height || a.height || 675, alt: a.alt || "" } : null;

/** Thời gian đọc ước tính (200 chữ/phút) từ HTML. */
export function phutDoc(html: string | null | undefined): number {
  const chu = (html ?? "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(chu / 200));
}

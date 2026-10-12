// CMS (Payload, cms.hieuban.com) → web. Web chỉ ĐỌC qua REST; mọi lời gọi chạy ở máy chủ.
//   CMS_URL             địa chỉ CMS (vd https://cms.hieuban.com). Chưa đặt → web như chưa có CMS (blog chỉ NotFair).
//   CMS_API_KEY         khoá API của tài khoản "Máy đọc" — CHỈ dùng khi xem trước bản nháp (draft mode).
//   CMS_PREVIEW_SECRET  ký link xem trước (CMS tạo, web kiểm)       CMS_WEBHOOK_SECRET  CMS báo web xoá cache
// Cache: thẻ "cms", 5 phút; CMS báo đổi → /api/cms/lam-moi xoá ngay. CMS chậm/lỗi → coi như không có bài (không vỡ trang).
import { xepLienQuan } from "@/lib/lien-quan";
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
  loai_bai?: LoaiBai | null;
  chuyen_muc?: ChuyenMucCms[] | null;
  /** CMS-4: vectơ từ khoá CMS tính khi lưu (bài liên quan theo nghĩa). */
  vecto?: Record<string, number> | null;
};
export type LoaiBai = "bai_viet" | "tin_tuc" | "huong_dan";
export type ChuyenMucCms = { id?: number; ten: string; slug: string; mo_ta?: string | null };
/** Kiểu schema.org theo loại bài: tin tức → NewsArticle (Google News/Discover), hướng dẫn → Article, còn lại BlogPosting. */
export const KIEU_LD: Record<LoaiBai, string> = { bai_viet: "BlogPosting", tin_tuc: "NewsArticle", huong_dan: "Article" };
export const NHAN_LOAI: Record<LoaiBai, string> = { bai_viet: "Bài viết", tin_tuc: "Tin tức", huong_dan: "Hướng dẫn" };
export type BaiCms = BaiCmsTomTat & {
  noi_dung_html?: string | null;
  hoi_dap?: { cau_hoi: string; tra_loi: string }[] | null;
  nguon?: { ten: string; url?: string | null }[] | null;
  tu_khoa_chinh?: string | null; tu_khoa_phu?: string[] | null; canonical?: string | null;
  ky_ten?: "ban_bien_tap" | "tac_gia" | "tham_dinh" | null;
  tac_gia?: NguoiCms | null; nguoi_tham_dinh?: NguoiCms | null; ngay_tham_dinh?: string | null;
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

type Goi = { nhap?: boolean; hanMs?: number };

async function goiCms<T>(duong: string, { nhap = false, hanMs = 4_000 }: Goi = {}): Promise<T | null> {
  const goc = cmsUrl();
  if (!goc) return null;
  const headers: Record<string, string> = { accept: "application/json" };
  if (nhap && process.env.CMS_API_KEY) headers.authorization = `bien-tap-vien API-Key ${process.env.CMS_API_KEY}`;
  try {
    const r = await fetch(`${goc}${duong}`, {
      headers,
      signal: AbortSignal.timeout(hanMs),
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
  the: true, noindex: true, dua_vao_llms: true, tra_loi_nhanh: true, meta: true, loai_bai: true, chuyen_muc: true, vecto: true,
};

/** Chuyên mục chỉ hợp lệ khi đã populate (object có ten + slug). */
export const cacChuyenMuc = (b: Pick<BaiCmsTomTat, "chuyen_muc">): ChuyenMucCms[] =>
  (b.chuyen_muc ?? []).filter((c): c is ChuyenMucCms => Boolean(c && typeof c === "object" && c.slug && c.ten));

/** Mọi chuyên mục (cho trang /blog/chuyen-muc/{slug}). */
export async function dsChuyenMucCms(): Promise<ChuyenMucCms[]> {
  if (!coCms()) return [];
  const r = await goiCms<{ docs: ChuyenMucCms[] }>(`/api/chuyen-muc?${tv({ limit: 100, depth: 0, sort: "ten", select: { ten: true, slug: true, mo_ta: true } })}`);
  return (r?.docs ?? []).filter((c) => c.slug && c.ten);
}

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

/** Bài liên quan: chọn tay trong CMS, thiếu thì lấy bài GẦN NGHĨA nhất (CMS-4: vectơ từ khoá), ưu tiên cùng mảng. */
export async function baiLienQuan(bai: BaiCms, toiDa = 3): Promise<BaiCmsTomTat[]> {
  const chon = (bai.bai_lien_quan ?? []).filter((b) => b && typeof b === "object" && b.slug);
  if (chon.length >= toiDa) return chon.slice(0, toiDa);
  const ds = await dsBaiCms();
  const them = xepLienQuan(bai, ds.filter((b) => !chon.some((c) => c.slug === b.slug)));
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

// ---------------------------------------------------------------- giao diện website (globals CMS)
// "Điều hướng chân trang" + "Trang chủ & banner". CMS chưa đặt / lỗi → null → web dùng mặc định trong code.

export type LienKetCms = { nhan: string; loai?: "duong_dan" | "bai" | "chuyen_muc" | null; duong_dan?: string | null;
  bai?: { slug?: string | null; _status?: string | null } | number | null; chuyen_muc?: { slug?: string | null } | number | null };
export type CotCms = { ten: string; lien_ket?: LienKetCms[] | null };
export type LichCms = { tu_ngay?: string | null; den_ngay?: string | null };
export type TrangChuCms = {
  thong_bao?: ({ bat?: boolean | null; chu?: string | null; link?: string | null } & LichCms) | null;
  banner?: ({ bat?: boolean | null; nhan?: string | null; tieu_de?: string | null; mo_ta?: string | null; anh?: AnhCms | null;
    nut_chu?: string | null; nut_link?: string | null } & LichCms) | null;
  bai_viet?: { bat?: boolean | null; tieu_de?: string | null; so_bai?: number | null; ghim?: (BaiCmsTomTat | number)[] | null } | null;
  bai_theo_mang?: { bat?: boolean | null; so_bai?: number | null } | null;
};

const TRONG_SITE = /^\/(?![/\\])[^\s\\]*$/;   // chặn //x và /\x (trình duyệt hiểu là link ngoài)

/** Liên kết CMS → đường dẫn web. Sai / trỏ bài chưa xuất bản → null (bỏ qua, không hiện link chết). */
export function duongLienKet(l: LienKetCms): string | null {
  if (l.loai === "bai") {
    const b = l.bai;
    return b && typeof b === "object" && b.slug && b._status !== "draft" ? `/blog/${encodeURIComponent(b.slug)}` : null;
  }
  if (l.loai === "chuyen_muc") {
    const c = l.chuyen_muc;
    return c && typeof c === "object" && c.slug ? `/blog/chuyen-muc/${encodeURIComponent(c.slug)}` : null;
  }
  return l.duong_dan && TRONG_SITE.test(l.duong_dan) ? l.duong_dan : null;
}

export async function dieuHuongCms(): Promise<{ ten: string; ds: [string, string][] }[] | null> {
  if (!coCms()) return null;
  const [g, tn] = await Promise.all([goiCms<{ cot?: CotCms[] | null }>("/api/globals/dieu-huong?depth=1", { hanMs: HAN_KHUNG }), tinhNangCms()]);
  // Blog tắt ở CMS → bỏ link tới bài / chuyên mục / /blog (không để link chết ở chân trang).
  const laBlog = (d: string) => d === "/blog" || d.startsWith("/blog/");
  const cot = (g?.cot ?? []).slice(0, 4).map((c) => ({
    ten: c.ten,
    ds: (c.lien_ket ?? []).flatMap((l): [string, string][] => {
      const d = duongLienKet(l);
      return d && l.nhan && (tn.blog_bat || !laBlog(d)) ? [[d, l.nhan]] : [];
    }),
  })).filter((c) => c.ten && c.ds.length);
  return cot.length ? cot : null;
}

/** Trong khung thời gian đặt ở CMS (giờ máy chủ, so ISO). */
export const dangHien = (l: LichCms, now = Date.now()) =>
  (!l.tu_ngay || Date.parse(l.tu_ngay) <= now) && (!l.den_ngay || Date.parse(l.den_ngay) > now);

/** Nội dung khung trang (dải thông báo, chân trang, banner) chờ CMS tối đa 1,5 giây rồi bỏ qua — không giữ cả trang. */
const HAN_KHUNG = 1_500;

export async function trangChuCms(): Promise<TrangChuCms | null> {
  if (!coCms()) return null;
  return goiCms<TrangChuCms>("/api/globals/trang-chu?depth=2", { hanMs: HAN_KHUNG });
}

/** Bài mới nhất đã xuất bản, lọc ngay ở CMS (không tải cả danh sách 500 bài — giữ phản hồi nhỏ để cache được). */
export async function baiMoiCms(mang: string | null, n: number): Promise<BaiCmsTomTat[]> {
  const where: Record<string, unknown> = { _status: { equals: "published" }, noindex: { not_equals: true } };
  if (mang) where.mang = { equals: mang };
  const [tn, r] = await Promise.all([
    tinhNangCms(),
    goiCms<{ docs: BaiCmsTomTat[] }>(`/api/bai-viet?${tv({ where, sort: "-publishedAt", limit: n, depth: 1, select: CHON_TOM_TAT })}`, { hanMs: HAN_KHUNG }),
  ]);
  return tn.blog_bat ? (r?.docs ?? []).filter((b) => b.slug && b.tieu_de) : [];
}

/** Bài CMS cùng mảng (trang công cụ / Khám phá / Kiến thức). mang = null → mới nhất mọi mảng. Tắt ở CMS → []. */
export async function baiTheoMang(mang: string | null, soBai?: number): Promise<BaiCmsTomTat[]> {
  const tc = await trangChuCms();
  if (tc?.bai_theo_mang?.bat === false) return [];
  return baiMoiCms(mang, Math.max(1, Math.min(6, soBai ?? tc?.bai_theo_mang?.so_bai ?? 3)));
}

/** Khối "Bài viết mới" trang chủ: bài ghim (đúng thứ tự, bỏ bài đã gỡ) rồi bù bài mới nhất cho đủ so_bai. Tắt → null. */
export async function baiTrangChu(): Promise<{ tieuDe: string; ds: BaiCmsTomTat[] } | null> {
  const tc = await trangChuCms();
  const k = tc?.bai_viet;
  if (k?.bat === false) return null;
  const n = Math.max(2, Math.min(6, k?.so_bai ?? 3));
  const moi = await baiMoiCms(null, n + 6);
  if (!moi.length && !(await tinhNangCms()).blog_bat) return null;
  // Bài ghim: CMS chỉ populate bài khách đọc được (đã xuất bản) — bài đã gỡ trả về id số → bị bỏ.
  const ghim = (k?.ghim ?? []).filter((b): b is BaiCmsTomTat => typeof b === "object" && !!b?.slug && !!b.tieu_de && b.noindex !== true);
  const da = new Set(ghim.map((b) => b.slug));
  const gop = [...ghim, ...moi.filter((b) => !da.has(b.slug))].slice(0, n);
  return gop.length ? { tieuDe: k?.tieu_de?.trim() || "Bài viết mới", ds: gop } : null;
}

// ---------------------------------------------------------------- CMS-3: trang đích /su-kien/{slug}
export type KhoiTrangDich =
  | { blockType: "dau_trang"; id?: string; nhan?: string | null; tieu_de: string; mo_ta?: string | null; anh?: AnhCms | null; nut_chu?: string | null; nut_link?: string | null }
  | { blockType: "cong_cu"; id?: string; tieu_de?: string | null; ds: string[] }
  | { blockType: "bai_viet"; id?: string; tieu_de?: string | null; bai?: (BaiCmsTomTat | number)[] | null; mang?: string | null; so_bai?: number | null }
  | { blockType: "hoi_dap"; id?: string; tieu_de?: string | null; ds: { cau_hoi: string; tra_loi: string }[] }
  | { blockType: "loi_moi"; id?: string; tieu_de: string; mo_ta?: string | null; nut_chu?: string | null }
  | { blockType: "van_ban"; id?: string; tieu_de?: string | null; noi_dung: string };
export type TrangDichCms = {
  id: number; tieu_de: string; slug: string; mo_ta_seo?: string | null; anh_chia_se?: AnhCms | null;
  khoi?: KhoiTrangDich[] | null; het_han?: string | null; noindex?: boolean | null; updatedAt: string; createdAt: string;
};

export const daHetHan = (t: Pick<TrangDichCms, "het_han">, now = Date.now()) => Boolean(t.het_han && Date.parse(t.het_han) <= now);

export async function trangDichCms(slug: string): Promise<TrangDichCms | null> {
  if (!coCms() || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const r = await goiCms<{ docs: TrangDichCms[] }>(`/api/trang-dich?${tv({
    where: { slug: { equals: slug }, _status: { equals: "published" } }, limit: 1, depth: 2,
  })}`);
  return r?.docs?.[0] ?? null;
}

export async function dsTrangDichCms(): Promise<Pick<TrangDichCms, "slug" | "updatedAt" | "het_han" | "noindex">[]> {
  if (!coCms()) return [];
  const r = await goiCms<{ docs: TrangDichCms[] }>(`/api/trang-dich?${tv({
    where: { _status: { equals: "published" } }, limit: 200, depth: 0, select: { slug: true, updatedAt: true, het_han: true, noindex: true },
  })}`);
  return (r?.docs ?? []).filter((t) => t.slug);
}

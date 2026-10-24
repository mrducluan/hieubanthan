// BLOG-3 — nhập bài trao đổi NotFair vào CMS để Chủ biên sửa chữ, ảnh như bài tự viết.
// Kéo bằng REST (cùng API thư viện notfair-nextjs-blog dùng ở web, không thêm dependency), khoá NOTFAIR_SEO_API_KEY chỉ ở
// máy chủ. Bản nhập là NHÁP cùng slug: khi Chủ biên xuất bản, web lấy bài CMS (bài CMS thắng bài NotFair khi trùng slug).
import type { Payload, PayloadRequest } from "payload";
import { htmlSangKhoi, linkNgoai, thayAnh, type ChoAnh } from "./html-lexical";
import { cauHinhGoi, nguonNotFair } from "./notfair-nguon";
export { cauHinhGoi, nguonNotFair, type NguonNotFair } from "./notfair-nguon";

export type BaiNotFair = {
  id: number; title: string; slug: string; meta_description: string | null; tags: string[]; image_url: string;
  reading_time_minutes: number | null; published_at: string | null; created_at: string; content_html?: string;
};

export const coKhoaNotFair = () => nguonNotFair() !== null;

async function goi(duong: string): Promise<unknown> {
  const { url, headers } = cauHinhGoi(duong);
  const r = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (r.status === 503 && nguonNotFair() === "qua_web") throw new Error("Web hieuban.com chưa đặt NOTFAIR_SEO_API_KEY.");
  if (r.status === 401 && nguonNotFair() === "qua_web") throw new Error("Web từ chối: CMS_WEBHOOK_SECRET hai bên chưa khớp.");
  if (!r.ok) throw new Error(`NotFair trả HTTP ${r.status}`);
  return r.json();
}

export async function dsNotFair(): Promise<BaiNotFair[]> {
  const d = (await goi("")) as { posts?: BaiNotFair[] } | null;
  return Array.isArray(d?.posts) ? d.posts : [];
}

export async function baiNotFair(slug: string): Promise<BaiNotFair | null> {
  const d = (await goi(`?slug=${encodeURIComponent(slug)}`).catch((e: Error) => {
    if (/HTTP 404/.test(e.message)) return null;
    throw e;
  })) as { post?: BaiNotFair } | null;
  return d?.post ?? null;
}

// Ảnh chỉ tải từ máy chủ NotFair (+ miền thêm qua env NOTFAIR_ANH_MIEN, cách nhau dấu phẩy) — không cho bài từ xa
// khiến CMS gọi tới địa chỉ tuỳ ý.
const MIEN_ANH = () => ["notfair.co", ...(process.env.NOTFAIR_ANH_MIEN ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)];
export function anhDuocTai(src: string): boolean {
  try {
    const u = new URL(src);
    const host = u.hostname.toLowerCase();
    return u.protocol === "https:" && MIEN_ANH().some((m) => host === m || host.endsWith(`.${m}`));
  } catch { return false; }
}

const LOAI_ANH: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const TOI_DA = 5 * 1024 * 1024;

async function taiAnh(src: string): Promise<{ data: Buffer; mimetype: string; name: string; size: number } | null> {
  // SEC-2: tự đi theo chuyển hướng, mỗi bước kiểm lại miền (redirect "follow" từng cho đi ra địa chỉ tuỳ ý).
  let url = src, r: Response | null = null;
  for (let buoc = 0; buoc < 4; buoc++) {
    if (!anhDuocTai(url)) return null;
    r = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: "manual" }).catch(() => null);
    const toi = r && r.status >= 300 && r.status < 400 ? r.headers.get("location") : null;
    if (!toi) break;
    url = new URL(toi, url).toString();
    r = null;
  }
  if (!r?.ok) return null;
  const mimetype = (r.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (!LOAI_ANH[mimetype]) return null;
  if (Number(r.headers.get("content-length") ?? 0) > TOI_DA) return null;   // không đọc thân quá lớn vào bộ nhớ
  const buf = Buffer.from(await r.arrayBuffer());
  if (!buf.length || buf.length > TOI_DA) return null;
  const goc = new URL(src).pathname.split("/").filter(Boolean).pop()?.replace(/\.[a-z0-9]+$/i, "") || "anh";
  return { data: buf, mimetype, name: `notfair-${goc.replace(/[^a-z0-9-]+/gi, "-").slice(0, 60)}-${Date.now().toString(36)}.${LOAI_ANH[mimetype]}`, size: buf.length };
}

/** Một lượt nhập: kho ảnh hỏng ở ảnh đầu (khoá S3 sai, bucket thiếu…) thì các ảnh sau cũng hỏng → bỏ qua, chữ vẫn nhập. */
type PhienAnh = { loiKho: string | null };

async function taoAnh(payload: Payload, req: PayloadRequest, phien: PhienAnh, src: string, alt: string, chuThich = ""): Promise<number | string | null> {
  if (phien.loiKho) return null;
  const f = await taiAnh(src);
  if (!f) return null;
  try {
    // KHÔNG truyền `req`: ảnh tạo trong giao dịch RIÊNG — lỗi kho làm Payload huỷ giao dịch, nếu dùng chung thì mất cả bài.
    const m = await payload.create({
      collection: "media", user: req.user, overrideAccess: false, file: f,
      data: { alt: alt.slice(0, 160), chu_thich: chuThich.slice(0, 200) || undefined, nguon_anh: "Ảnh đi kèm bài trao đổi NotFair" },
    });
    return m.id;
  } catch (e) {
    const x = e as { name?: string; Code?: string; message?: string; $metadata?: unknown };
    // Lỗi kho (S3 / ổ đĩa) → dừng tải ảnh cho cả lượt; lỗi riêng của một ảnh (ảnh hỏng, sai định dạng) → chỉ bỏ ảnh đó.
    if (x?.$metadata !== undefined || /kho ảnh|FileUploadError|EROFS|ENOENT|EACCES/i.test(`${x?.name} ${x?.message}`)) {
      phien.loiKho = `${x?.Code || x?.name || "Lỗi kho"}${x?.message ? ` — ${x.message}` : ""}`.slice(0, 300);
    }
    return null;
  }
}

/** `loi_kho`: kho ảnh từ chối ghi (vd SignatureDoesNotMatch) — chữ đã nhập, ảnh để chỗ đánh dấu "[Ảnh chưa nhập …]". */
export type KetQuaNhap = { id: number | string; da_co: boolean; anh_loi: string[]; loi_kho?: string };

/** Nhập một bài NotFair thành NHÁP trong CMS (cùng slug). Đã có bài CMS cùng slug → trả bài đó, không tạo trùng. */
export async function nhapBaiNotFair(payload: Payload, req: PayloadRequest, slug: string): Promise<KetQuaNhap> {
  const co = await payload.find({ collection: "bai-viet", where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true,
    overrideAccess: true, select: { slug: true } });
  if (co.docs[0]) return { id: co.docs[0].id, da_co: true, anh_loi: [] };

  const p = await baiNotFair(slug);
  if (!p) throw new Error("Không tìm thấy bài này trên NotFair (có thể đã gỡ).");
  const html = p.content_html ?? "";
  const anhLoi: string[] = [];
  const phien: PhienAnh = { loiKho: null };

  const bia = p.image_url ? await taoAnh(payload, req, phien, p.image_url, p.title) : null;
  if (p.image_url && bia == null) anhLoi.push(p.image_url);

  const khoi = htmlSangKhoi(html);
  const idAnh = new Map<ChoAnh, number | string | null>();
  for (const k of khoi) {
    if (k.type !== "__anh") continue;
    const a = k as ChoAnh;
    const id = await taoAnh(payload, req, phien, a.src, a.alt || p.title, a.chu_thich);
    if (id == null) anhLoi.push(a.src);
    idAnh.set(a, id);
  }

  const moTa = (p.meta_description ?? "").trim();
  const bai = await payload.create({
    collection: "bai-viet", req, overrideAccess: false, draft: true, context: { giuSlugGoc: true },
    data: {
      _status: "draft",
      tieu_de: p.title.slice(0, 120),
      slug: p.slug,
      generateSlug: false,             // giữ đúng slug NotFair (đối tác kiểm tra link ở /blog/{slug})
      mo_ta_ngan: moTa.slice(0, 300) || undefined,
      meta: { title: p.title.slice(0, 120), description: moTa.slice(0, 300) || undefined, image: bia ?? undefined },
      anh_bia: bia ?? undefined,
      noi_dung: thayAnh(khoi, (a) => idAnh.get(a) ?? null, true),
      the: (p.tags ?? []).filter((t) => typeof t === "string" && t.trim()).slice(0, 12),
      publishedAt: p.published_at ?? undefined,
      nguon_goc: "notfair",
      notfair_lien_ket: linkNgoai(html),
    } as never,
  });
  return { id: bai.id, da_co: false, anh_loi: anhLoi, ...(phien.loiKho ? { loi_kho: phien.loiKho } : {}) };
}

// RY-1 — nhận bài RankYak vào CMS (chủ dự án kết nối RankYak 2026-11-21).
// Hai đường, cùng một hàm nhập:
//   1. Webhook "Next.js connection" của RankYak → POST {CMS_URL}/api/bai-viet/rankyak. RankYak gửi bí mật
//      RANKYAK_WEBHOOK_SECRET trong MỘT header (tài liệu không nêu tên header) → so với mọi header, hằng thời gian.
//      Thân: { event: "article.published" | "article.updated", status, article: {...} } (bản Developer zone gửi thẳng
//      bài, không bọc — nhận cả hai). Lượt thử khi bấm Save ở RankYak: không có bài → trả 200.
//   2. Cron ngày của web → POST /api/bai-viet/tu-dong-rankyak: kéo danh sách bằng REST (X-Api-Key = RANKYAK_API_KEY),
//      nhập bài đã xuất bản mà CMS còn thiếu (webhook lỡ / RankYak tắt webhook sau 3 ngày lỗi).
// Bài vào CMS như bài NotFair: NHÁP → chuẩn hoá SEO (BLOG-7) → tự xuất bản khi đạt điểm (BLOG-10). Chữ ký mặc định
// "Ban biên tập" (EEAT-1: chuyên gia không đứng tên bài máy viết mà chưa đọc) — Chủ biên đổi tay nếu muốn.
// Bài cập nhật (`article.updated`): ghi BẢN NHÁP mới, bài Chủ biên đã duyệt thì không tự xuất bản lại (giữ chữ đã sửa).
// Xuất bản xong → báo địa chỉ thật về RankYak (POST /articles/{id}/external-url) để RankYak hiện link sống.
import type { Payload, PayloadRequest } from "payload";
import { chuanHoaMotBai } from "./chuan-hoa-notfair";
import { slugChuan } from "./chuan-hoa-bai";
import { htmlSangKhoi, thayAnh, type ChoAnh } from "./html-lexical";
import { taoAnh, type PhienAnh } from "./notfair";
import { DA_THU, tuXuatBanNeuDat } from "./tu-dong-notfair";
import { webUrl } from "./web";
import { boH1Dau, daToiNgay, type BaiRankYak } from "./rankyak-thuan";

export * from "./rankyak-thuan";

export const NGUON_ANH_RANKYAK = "Ảnh đi kèm bài RankYak";
const API = "https://rankyak.com/api/v1";


// ─── REST API ──────────────────────────────────────────────────────────────────────────────────────────────────────

export const coKhoaRankYak = () => Boolean(process.env.RANKYAK_API_KEY?.trim());

async function goi(duong: string, init: RequestInit = {}): Promise<unknown> {
  const khoa = process.env.RANKYAK_API_KEY?.trim();
  if (!khoa) throw new Error("CMS chưa đặt RANKYAK_API_KEY.");
  const r = await fetch(`${API}${duong}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(20_000),
    headers: { "X-Api-Key": khoa, Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}) } });
  if (!r.ok) throw new Error(`RankYak trả HTTP ${r.status}`);
  return r.json();
}

/** Mọi bài (≤ 10 trang × 100), bỏ H1 tiêu đề khỏi thân. */
export async function dsRankYak(): Promise<BaiRankYak[]> {
  const kq: BaiRankYak[] = [];
  for (let trang = 1; trang <= 10; trang++) {
    const d = (await goi(`/articles?per_page=100&exclude_h1=true&page=${trang}`)) as { data?: BaiRankYak[]; links?: { next?: string | null } };
    kq.push(...(Array.isArray(d?.data) ? d.data : []));
    if (!d?.links?.next) break;
  }
  return kq;
}


/** Báo địa chỉ thật về RankYak. Không có khoá → bỏ qua (RankYak vẫn dựng link từ "Blog URL" nếu đặt). */
export async function baoDiaChi(idRankYak: number | string, url: string): Promise<boolean> {
  if (!coKhoaRankYak()) return false;
  try {
    await goi(`/articles/${encodeURIComponent(String(idRankYak))}/external-url`, { method: "POST", body: JSON.stringify({ external_url: url }) });
    return true;
  } catch { return false; }
}

// ─── Nhập vào CMS ──────────────────────────────────────────────────────────────────────────────────────────────────


type DocCms = { id: number | string; slug?: string | null; trang_thai_duyet?: string | null; _status?: string | null; ghi_chu_duyet?: string | null };

async function timTheoId(payload: Payload, req: PayloadRequest | undefined, id: number | string): Promise<DocCms | null> {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  const d = await payload.find({ collection: "bai-viet", where: { rankyak_id: { equals: n } } as never, limit: 1, depth: 0, draft: true,
    overrideAccess: true, req, select: { slug: true, trang_thai_duyet: true, _status: true, ghi_chu_duyet: true } as never });
  return (d.docs[0] as unknown as DocCms) ?? null;
}

/** Slug chưa ai dùng (bài khác cùng slug / slug_cu → thêm "-<id RankYak>"). */
async function slugTrong(payload: Payload, req: PayloadRequest | undefined, slug: string, idRy: number | string): Promise<string> {
  const d = await payload.find({ collection: "bai-viet", where: { or: [{ slug: { equals: slug } }, { slug_cu: { in: [slug] } }] },
    limit: 1, depth: 0, draft: true, overrideAccess: true, req, select: { slug: true } as never });
  return d.docs.length ? `${slug.slice(0, 64)}-${idRy}` : slug;
}

export type KetQuaNhapRy = { id: number | string; moi: boolean; slug: string; da_duyet: boolean; anh_loi: string[]; loi_kho?: string };

/** Tạo hoặc cập nhật bản NHÁP từ một bài RankYak. Không xuất bản ở đây. */
export async function nhapBaiRankYak(payload: Payload, req: PayloadRequest, a: BaiRankYak): Promise<KetQuaNhapRy> {
  const tieuDe = String(a.title ?? "").normalize("NFC").trim();
  if (!tieuDe) throw new Error("Bài RankYak thiếu tiêu đề.");
  const html = boH1Dau(String(a.html ?? ""));
  if (!html.trim()) throw new Error("Bài RankYak không có nội dung HTML.");
  const co = await timTheoId(payload, req, a.id);
  const anhLoi: string[] = [];
  const phien: PhienAnh = { loiKho: null, heThong: true, nguonAnh: NGUON_ANH_RANKYAK, tienTo: "rankyak" };

  const bia = a.header_image_url ? await taoAnh(payload, req, phien, a.header_image_url, tieuDe) : null;
  if (a.header_image_url && bia == null) anhLoi.push(a.header_image_url);
  const khoi = htmlSangKhoi(html);
  const idAnh = new Map<ChoAnh, number | string | null>();
  for (const k of khoi) {
    if (k.type !== "__anh") continue;
    const c = k as ChoAnh;
    const id = await taoAnh(payload, req, phien, c.src, c.alt || tieuDe, c.chu_thich);
    if (id == null) anhLoi.push(c.src);
    idAnh.set(c, id);
  }
  const moTa = String(a.meta_description || a.excerpt || "").normalize("NFC").trim();
  const chung = {
    tieu_de: tieuDe.slice(0, 120),
    mo_ta_ngan: String(a.excerpt || moTa).trim().slice(0, 300) || undefined,
    meta: { title: String(a.meta_title || tieuDe).slice(0, 120), description: moTa.slice(0, 300) || undefined, ...(bia != null ? { image: bia } : {}) },
    ...(bia != null ? { anh_bia: bia } : {}),
    // Không ghi `notfair_lien_ket`: đó là link ĐỐI TÁC phải giữ (BLOG-3); link trích nguồn của RankYak thì chuẩn hoá được
    // dùng làm "Nguồn tham khảo" (nguonTuThanBai bỏ qua link đối tác).
    noi_dung: thayAnh(khoi, (c) => idAnh.get(c) ?? null, true),
  };
  const ctx = { giuSlugGoc: true, boQuaLamMoi: true };

  if (co) {
    const daDuyet = co.trang_thai_duyet === "da_duyet";
    const ghi = [`RY-1: RankYak gửi bản cập nhật ${new Date().toISOString().slice(0, 10)}${a.updated_at ? ` (sửa lúc ${a.updated_at})` : ""}`
      + (daDuyet ? " — bài Chủ biên đã duyệt: bản đang xuất bản CHƯA đổi; đọc bản nháp này rồi bấm Xuất bản nếu muốn dùng." : "."),
    String(co.ghi_chu_duyet ?? "").replace(new RegExp(`^${DA_THU}[^\\n]*\\n?`), "")].filter(Boolean).join("\n").slice(0, 2000);
    await payload.update({ collection: "bai-viet", id: co.id, draft: true, overrideAccess: true, req, context: ctx,
      data: { ...chung, ghi_chu_duyet: ghi } as never });
    return { id: co.id, moi: false, slug: String(co.slug ?? ""), da_duyet: daDuyet, anh_loi: anhLoi, ...(phien.loiKho ? { loi_kho: phien.loiKho } : {}) };
  }

  const slug = await slugTrong(payload, req, slugChuan(String(a.slug || tieuDe)) || `rankyak-${a.id}`, a.id);
  const bai = await payload.create({
    collection: "bai-viet", req, overrideAccess: true, draft: true, context: ctx,
    data: {
      ...chung, _status: "draft", slug, generateSlug: false,
      the: [], publishedAt: a.published_at ?? a.publish_at ?? undefined,
      nguon_goc: "rankyak", rankyak_id: Number(a.id),
    } as never,
  });
  return { id: bai.id, moi: true, slug, da_duyet: false, anh_loi: anhLoi, ...(phien.loiKho ? { loi_kho: phien.loiKho } : {}) };
}

export type KetQuaXuLyRy = { id: number | string; slug: string; diem: number; xuat_ban: boolean; ly_do?: string; bao_rankyak?: boolean };

/** Chuẩn hoá SEO → tự xuất bản nếu đạt (bài Chủ biên đã duyệt: chỉ chuẩn hoá nháp, không xuất bản) → báo địa chỉ. */
export async function xuLyBaiRankYak(payload: Payload, req: PayloadRequest | undefined, n: KetQuaNhapRy, idRy: number | string): Promise<KetQuaXuLyRy> {
  const c = await chuanHoaMotBai(payload, req, n.id);
  const slug = (await payload.findByID({ collection: "bai-viet", id: n.id, draft: true, depth: 0, overrideAccess: true, req }) as { slug?: string }).slug ?? n.slug;
  if (n.da_duyet) return { id: n.id, slug, diem: c.diem_sau, xuat_ban: false, ly_do: "bài đã duyệt — chờ Chủ biên xuất bản bản cập nhật" };
  const xb = await tuXuatBanNeuDat(payload, req, n.id, { kho_loi: c.kho_loi ?? n.loi_kho });
  if (!xb.xuat_ban && xb.ly_do && xb.ly_do !== "tắt tự xuất bản" && !xb.ly_do.startsWith("kho ảnh lỗi")) {
    const b = await payload.findByID({ collection: "bai-viet", id: n.id, draft: true, depth: 0, overrideAccess: true, req }) as { ghi_chu_duyet?: string | null };
    const cu = String(b.ghi_chu_duyet ?? "");
    if (!cu.includes(`${DA_THU}: ${xb.ly_do}`)) {
      await payload.update({ collection: "bai-viet", id: n.id, draft: true, overrideAccess: true, req, context: { giuSlugGoc: true, boQuaLamMoi: true },
        data: { ghi_chu_duyet: [`${DA_THU}: ${xb.ly_do} — sửa rồi bấm Xuất bản tay.`, cu].filter(Boolean).join("\n").slice(0, 2000) } as never }).catch(() => {});
    }
  }
  const bao = xb.xuat_ban ? await baoDiaChi(idRy, `${webUrl()}/blog/${slug}`) : false;
  return { id: n.id, slug, diem: c.diem_sau, xuat_ban: xb.xuat_ban, ...(xb.ly_do ? { ly_do: xb.ly_do } : {}), bao_rankyak: bao };
}

export type KetQuaTuDongRy = { co_khoa: boolean; moi: (Partial<KetQuaXuLyRy> & { rankyak_id: number | string; loi?: string })[]; con_lai: number };

/** Cron ngày: nhập bài RankYak đã tới ngày đăng mà CMS chưa có. Giới hạn thời gian + số bài mỗi lượt. */
export async function tuDongRankYak(payload: Payload, req: PayloadRequest,
  { hanMs = 25_000, toiDa = 2, bayGio = () => Date.now() } = {}): Promise<KetQuaTuDongRy> {
  if (!coKhoaRankYak()) return { co_khoa: false, moi: [], con_lai: 0 };
  const bat = bayGio();
  const ds = (await dsRankYak()).filter((a) => daToiNgay(a, bat));
  const ids = ds.map((a) => Number(a.id)).filter(Number.isFinite);
  const da = !ids.length ? { docs: [] as unknown[] } : await payload.find({ collection: "bai-viet", draft: true, overrideAccess: true, depth: 0,
    pagination: false, req, where: { rankyak_id: { in: ids } } as never, select: { rankyak_id: true } as never });
  const co = new Set(da.docs.map((d) => String((d as { rankyak_id?: number }).rankyak_id)));
  const chua = ds.filter((a) => !co.has(String(a.id)));
  const moi: KetQuaTuDongRy["moi"] = [];
  for (const a of chua) {
    if (moi.length >= toiDa || bayGio() - bat > hanMs) break;
    try {
      const n = await nhapBaiRankYak(payload, req, a);
      moi.push({ rankyak_id: a.id, ...(await xuLyBaiRankYak(payload, req, n, a.id)) });
    } catch (e) {
      moi.push({ rankyak_id: a.id, loi: String((e as Error)?.message ?? e).slice(0, 200) });
    }
  }
  return { co_khoa: true, moi, con_lai: Math.max(0, chua.length - moi.length) };
}

// BLOG-7 — chạy chuẩn hoá SEO cho mọi bài nguồn NotFair trong CMS (nút "Chuẩn hoá SEO bài NotFair" + migration dữ liệu).
// Luôn ghi thành BẢN NHÁP mới (bản đang xuất bản không đổi cho tới khi Chủ biên bấm Xuất bản), trạng thái "Gửi duyệt",
// kèm danh sách thay đổi ở "Ghi chú của Chủ biên". Ảnh: ảnh bìa nền sáng khi bài chưa có bìa hoặc bìa quá tối (độ sáng
// trung bình < 0,42 — ảnh tối chìm vào nền Đêm sao của site); ảnh "Tóm tắt nhanh" khi thân bài < 2 ảnh và có ≥ 3 mục H2.
// Ảnh cũ vẫn nằm trong Thư viện ảnh (không xoá). Lỗi một bài không chặn bài khác.
// Thao tác trên bài đi cùng `req` (migration: cùng giao dịch với bài vừa nhập); ảnh tạo trong giao dịch riêng.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Payload, PayloadRequest } from "payload";
import { kiemDinhBai } from "../kiem-dinh/kiem-dinh";
import { veAnhBia, veAnhTomTat, type MangAnh } from "./anh-minh-hoa";
import { chuanHoaBai, type BaiChuanHoa } from "./chuan-hoa-bai";

export const NGUON_ANH_BLOG7 = "Ban biên tập Hiểu Bản Thân vẽ minh hoạ (BLOG-7, nền sáng)";
const NGUONG_TOI = 0.42;

type DocBai = BaiChuanHoa & {
  id: number | string; _status?: string; nguon_goc?: string | null; ghi_chu_duyet?: string | null;
  trang_thai_duyet?: string | null; notfair_lien_ket?: string[] | null; ky_ten?: string | null; slug_cu?: string[] | null;
};

export type KetQuaBai = { id: number | string; slug: string; tieu_de: string; thay_doi: string[]; diem_truoc: number; diem_sau: number; loi?: string };

const idCua = (v: unknown): number | string | null =>
  typeof v === "number" || typeof v === "string" ? v : v && typeof v === "object" && "id" in v ? (v as { id: number | string }).id : null;

/** Độ sáng trung bình 0–1 của ảnh (sharp, đã có trong CMS). Không đọc được → null (coi như không tối). */
async function doSang(payload: Payload, id: number | string): Promise<number | null> {
  try {
    const m = await payload.findByID({ collection: "media", id, depth: 0, overrideAccess: true }) as { url?: string | null; filename?: string | null; nguon_anh?: string | null };
    if (m.nguon_anh === NGUON_ANH_BLOG7) return 1;
    // Lưu trên ổ đĩa (chạy cục bộ, không S3) → đọc thẳng thư mục "media"; không có thì tải theo URL công khai (S3).
    let buf: Buffer | null = m.filename
      ? await readFile(path.join(process.cwd(), "media", path.basename(m.filename))).catch(() => null) : null;
    if (!buf && m.url && /^https?:\/\//.test(m.url)) {
      const r = await fetch(m.url, { signal: AbortSignal.timeout(15_000) }).catch(() => null);
      if (r?.ok) buf = Buffer.from(await r.arrayBuffer());
    }
    if (!buf) return null;
    const sharp = (await import("sharp")).default;
    const { channels } = await sharp(buf).resize(64, 64, { fit: "inside" }).stats();
    const [R, G, B] = channels.map((c) => c.mean / 255);
    return 0.2126 * (R ?? 0) + 0.7152 * (G ?? 0) + 0.0722 * (B ?? 0);
  } catch { return null; }
}

async function taiAnh(payload: Payload, req: PayloadRequest | undefined, ten: string, data: Buffer, alt: string, kho: { loi: string | null }) {
  if (kho.loi) return null;
  try {
    // Không truyền `req`: ảnh tạo trong giao dịch riêng (lỗi kho không huỷ cả lượt — như nhập bài NotFair).
    const m = await payload.create({
      collection: "media", overrideAccess: true, user: req?.user,
      file: { data, mimetype: "image/png", name: `${ten}-${Date.now().toString(36)}.png`, size: data.length },
      data: { alt: alt.slice(0, 160), nguon_anh: NGUON_ANH_BLOG7 },
    });
    return m.id;
  } catch (e) {
    kho.loi = (e as Error)?.message?.slice(0, 200) || "Lỗi kho ảnh";
    return null;
  }
}

function soAnhThanBai(nd: unknown): { so: number; ids: (number | string)[] } {
  const ids: (number | string)[] = [];
  const duyet = (n: unknown) => {
    if (!n || typeof n !== "object") return;
    const o = n as { type?: string; value?: unknown; children?: unknown[] };
    if (o.type === "upload") { const id = idCua(o.value); if (id != null) ids.push(id); }
    (o.children ?? []).forEach(duyet);
  };
  duyet((nd as { root?: unknown } | null)?.root);
  return { so: ids.length, ids };
}

/** Chuẩn hoá một bài (đọc bản nháp mới nhất). `ve`: false = không vẽ/tải ảnh (chạy thử, test). */
export async function chuanHoaMotBai(payload: Payload, req: PayloadRequest | undefined, id: number | string, { ve = true } = {}): Promise<KetQuaBai> {
  const bai = await payload.findByID({ collection: "bai-viet", id, draft: true, depth: 0, overrideAccess: true, req }) as unknown as DocBai;
  const tieuDe = String(bai.tieu_de ?? "");
  const truoc = kiemDinhBai(bai as never).diem;
  const kho = { loi: null as string | null };

  const thu = chuanHoaBai(bai, { slugDaDung: () => false });
  const mang = thu.mang as MangAnh;
  let anhBia: number | string | null = null, anhTomTat: number | string | null = null;
  if (ve) {
    const bia = idCua(bai.anh_bia);
    const sang = bia != null ? await doSang(payload, bia) : null;
    if (bia == null || (sang != null && sang < NGUONG_TOI)) {
      const png = await veAnhBia({ tieuDe, phu: bai.mo_ta_ngan || String(thu.data.mo_ta_ngan ?? ""), mang });
      anhBia = await taiAnh(payload, req, `bia-${String(thu.data.slug ?? bai.slug ?? "bai").slice(0, 50)}`, png, tieuDe, kho);
    }
    const than = soAnhThanBai(bai.noi_dung);
    let daCoTomTat = false;
    if (than.ids.length) {
      const r = await payload.count({ collection: "media", overrideAccess: true,
        where: { and: [{ id: { in: than.ids } }, { nguon_anh: { equals: NGUON_ANH_BLOG7 } }] } });
      daCoTomTat = r.totalDocs > 0;
    }
    if (!daCoTomTat && than.so < 2 && thu.muc.length >= 3) {
      const png = await veAnhTomTat({ tieuDe, y: thu.muc, mang });
      anhTomTat = await taiAnh(payload, req, `tom-tat-${String(thu.data.slug ?? bai.slug ?? "bai").slice(0, 44)}`, png,
        `Tóm tắt nhanh: ${tieuDe}`, kho);
    }
  }

  const kq = chuanHoaBai(bai, {
    anhBia, anhTomTat,
    slugDaDung: () => false,   // kiểm trùng ở dưới (cần truy vấn)
  });
  if (typeof kq.data.slug === "string") {
    const goc = kq.data.slug;
    for (let n = 2; n < 20; n++) {
      const trung = await payload.count({ collection: "bai-viet", overrideAccess: true, req,
        where: { and: [{ slug: { equals: kq.data.slug } }, { id: { not_equals: id } }] } });
      if (!trung.totalDocs) break;
      kq.data.slug = `${goc.slice(0, 72)}-${n}`;
    }
  }
  if (kho.loi) kq.thay_doi.push(`Chưa tải được ảnh minh hoạ (kho ảnh: ${kho.loi}) — bấm lại "Chuẩn hoá SEO" sau khi sửa kho.`);
  if (!kq.thay_doi.length) return { id, slug: String(bai.slug ?? ""), tieu_de: tieuDe, thay_doi: [], diem_truoc: truoc, diem_sau: truoc };

  const sau = kiemDinhBai({ ...bai, ...kq.data } as never);
  const ghiChu = [`BLOG-7 chuẩn hoá SEO (${new Date().toISOString().slice(0, 10)}) — điểm kiểm định ${truoc} → ${sau.diem}. `
    + "Bản nháp này CHƯA lên web: đọc lại rồi bấm Xuất bản.", ...kq.thay_doi.map((t) => `• ${t}`), bai.ghi_chu_duyet ?? ""]
    .filter(Boolean).join("\n").slice(0, 2000);
  await payload.update({
    collection: "bai-viet", id, draft: true, overrideAccess: true, req,
    context: { giuSlugGoc: true, boQuaLamMoi: true },
    data: {
      ...kq.data,
      // Đường dẫn cũ (đang sống trên web / NotFair) luôn vào slug_cu → web chuyển hướng 308 khi bản này được xuất bản,
      // kể cả bài NotFair không có ngày đăng (giuSlugCu chỉ giữ khi đã có publishedAt).
      ...(typeof kq.data.slug === "string" && bai.slug
        ? { generateSlug: false, slug_cu: [...new Set([...(bai.slug_cu ?? []), bai.slug])].filter((s) => s !== kq.data.slug) } : {}),
      ghi_chu_duyet: ghiChu,
      // Sạch lỗi chặn → "Gửi duyệt" (Chủ biên thấy ngay trong danh sách); còn lỗi chặn thì giữ trạng thái cũ.
      ...(sau.loi_chan.length ? {} : { trang_thai_duyet: "cho_duyet" }),
    } as never,
  });
  return { id, slug: String(kq.data.slug ?? bai.slug ?? ""), tieu_de: tieuDe, thay_doi: kq.thay_doi, diem_truoc: truoc, diem_sau: sau.diem };
}

/** Mọi bài nguồn NotFair (kể cả nháp). */
export async function chuanHoaTatCaNotFair(payload: Payload, req?: PayloadRequest, opt: { ve?: boolean } = {}): Promise<KetQuaBai[]> {
  const ds = await payload.find({ collection: "bai-viet", where: { nguon_goc: { equals: "notfair" } }, draft: true, depth: 0,
    limit: 500, overrideAccess: true, select: { slug: true }, req });
  const kq: KetQuaBai[] = [];
  for (const d of ds.docs) {
    try { kq.push(await chuanHoaMotBai(payload, req, d.id, opt)); }
    catch (e) { kq.push({ id: d.id, slug: "", tieu_de: "", thay_doi: [], diem_truoc: 0, diem_sau: 0, loi: (e as Error)?.message?.slice(0, 300) ?? "lỗi" }); }
  }
  return kq;
}

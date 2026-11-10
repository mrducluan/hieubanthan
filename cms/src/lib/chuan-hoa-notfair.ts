// BLOG-7 — chạy chuẩn hoá SEO cho mọi bài nguồn NotFair trong CMS (nút "Chuẩn hoá SEO bài NotFair" + migration dữ liệu).
// Luôn ghi thành BẢN NHÁP mới (bản đang xuất bản không đổi cho tới khi Chủ biên bấm Xuất bản), trạng thái "Gửi duyệt",
// kèm danh sách thay đổi ở "Ghi chú của Chủ biên". Ảnh: ảnh bìa nền sáng khi bài chưa có bìa hoặc bìa quá tối (độ sáng
// trung bình < 0,42 — ảnh tối chìm vào nền Đêm sao của site) hoặc bìa là ảnh NotFair (BLOG-9: chữ in sẵn hay sai dấu); ảnh "Tóm tắt nhanh" khi thân bài < 2 ảnh và có ≥ 3 mục H2.
// Ảnh cũ vẫn nằm trong Thư viện ảnh (không xoá). Lỗi một bài không chặn bài khác.
// Thao tác trên bài đi cùng `req` (migration: cùng giao dịch với bài vừa nhập); ảnh tạo trong giao dịch riêng.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Payload, PayloadRequest } from "payload";
import { kiemDinhBai } from "../kiem-dinh/kiem-dinh";
import { veAnhBia, veAnhCauHoi, veAnhLoTrinh, veAnhTomTat, type MangAnh } from "./anh-minh-hoa";
import { chuanHoaBai, type BaiChuanHoa } from "./chuan-hoa-bai";
import { NGUON_ANH_NOTFAIR } from "./notfair";

export const NGUON_ANH_BLOG7 = "Ban biên tập Hiểu Bản Thân vẽ minh hoạ (BLOG-7, nền sáng)";
const NGUONG_TOI = 0.42;

type DocBai = BaiChuanHoa & {
  id: number | string; _status?: string; nguon_goc?: string | null; ghi_chu_duyet?: string | null;
  trang_thai_duyet?: string | null; notfair_lien_ket?: string[] | null; ky_ten?: string | null; slug_cu?: string[] | null;
};

export type KetQuaBai = {
  id: number | string; slug: string; tieu_de: string; thay_doi: string[]; diem_truoc: number; diem_sau: number;
  /** Mục kiểm định CHƯA đạt sau chuẩn hoá — việc máy không tự làm được (nguồn, chuyên gia, độ dài…), người viết tự sửa. */
  con_lai: string[];
  /** false = chỉ audit (xem trước), chưa ghi gì vào bài. */
  da_ghi: boolean;
  /** Kho ảnh lỗi khi vẽ ảnh bìa / minh hoạ (bìa NotFair có chữ sai dấu có thể còn nguyên) — BLOG-10 không tự xuất bản. */
  kho_loi?: string;
  loi?: string;
};

const idCua = (v: unknown): number | string | null =>
  typeof v === "number" || typeof v === "string" ? v : v && typeof v === "object" && "id" in v ? (v as { id: number | string }).id : null;

/** Ảnh bìa tải từ NotFair? (BLOG-9: chữ tiếng Việt in sẵn trong ảnh hay sai dấu — sửa chữ không được, phải vẽ lại.) */
async function laBiaNotFair(payload: Payload, id: number | string): Promise<boolean> {
  try {
    const m = await payload.findByID({ collection: "media", id, depth: 0, overrideAccess: true }) as { nguon_anh?: string | null };
    return m.nguon_anh === NGUON_ANH_NOTFAIR;
  } catch { return false; }
}

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

/** BLOG-9c: bỏ các nút ảnh (upload) mà ảnh có nguồn NotFair khỏi `bai.noi_dung` (sửa tại chỗ). Trả số ảnh đã bỏ. */
async function boAnhNotFair(payload: Payload, bai: DocBai): Promise<number> {
  const than = soAnhThanBai(bai.noi_dung);
  if (!than.ids.length) return 0;
  const nf = await payload.find({ collection: "media", overrideAccess: true, depth: 0, limit: than.ids.length, pagination: false,
    where: { and: [{ id: { in: than.ids } }, { nguon_anh: { equals: NGUON_ANH_NOTFAIR } }] } });
  const bo = new Set(nf.docs.map((d) => String(d.id)));
  if (!bo.size) return 0;
  let dem = 0;
  type Nut = { type?: string; value?: unknown; children?: Nut[] };
  const loc = (ds: Nut[]): Nut[] => ds.flatMap((n) => {
    if (n.type === "upload") { const i = idCua(n.value); if (i != null && bo.has(String(i))) { dem++; return []; } }
    return [n.children ? { ...n, children: loc(n.children) } : n];
  });
  const goc = (bai.noi_dung as { root?: Nut } | null)?.root;
  if (!goc?.children) return 0;
  bai.noi_dung = { ...(bai.noi_dung as object), root: { ...goc, children: loc(goc.children) } } as never;
  return dem;
}

/** Chuẩn hoá một bài (đọc bản nháp mới nhất). `ghi`: false = AUDIT — chỉ báo sẽ đổi gì + điểm dự kiến, không vẽ ảnh,
 *  không ghi gì. `ve`: false = không vẽ/tải ảnh (test). */
export async function chuanHoaMotBai(payload: Payload, req: PayloadRequest | undefined, id: number | string,
  { ve = true, ghi = true } = {}): Promise<KetQuaBai> {
  const bai = await payload.findByID({ collection: "bai-viet", id, draft: true, depth: 0, overrideAccess: true, req }) as unknown as DocBai;
  const tieuDe = String(bai.tieu_de ?? "");
  const truoc = kiemDinhBai(bai as never).diem;
  // BLOG-9c: ảnh THÂN BÀI tải từ NotFair (sơ đồ "key concepts"… có chữ in sẵn, hay sai dấu) → bỏ khỏi thân bài; ảnh CMS
  // vẽ (Tóm tắt nhanh, Lộ trình, Câu hỏi) được bù ở dưới vì đếm ảnh chạy trên thân bài ĐÃ bỏ. Ảnh vẫn giữ trong Thư viện.
  const boAnhNf = await boAnhNotFair(payload, bai);
  const kho = { loi: null as string | null };

  const thu = chuanHoaBai(bai, { slugDaDung: () => false });
  // Link + QR in trong ảnh vẽ (bìa, tóm tắt) trỏ về đúng bài trên web — theo slug chuẩn không dấu.
  const slugAnh = String(thu.data.slug ?? bai.slug ?? "");
  const duongBai = /^[a-z0-9-]{1,80}$/.test(slugAnh) ? `/blog/${slugAnh}` : null;
  const mang = thu.mang as MangAnh;
  let anhBia: number | string | null = null, anhTomTat: number | string | null = null;
  let anhLoTrinh: number | string | null = null, anhHoiDap: number | string | null = null;
  const duKien: string[] = [];
  if (ve || !ghi) {
    const bia = idCua(bai.anh_bia);
    const sang = bia != null ? await doSang(payload, bia) : null;
    const biaNotFair = bia != null && await laBiaNotFair(payload, bia);
    const canBia = bia == null || biaNotFair || (sang != null && sang < NGUONG_TOI);
    const than = soAnhThanBai(bai.noi_dung);
    let daCoTomTat = false, daCoLoTrinh = false, daCoHoiDap = false;
    if (than.ids.length) {
      const dem = async (alt?: string) => (await payload.count({ collection: "media", overrideAccess: true,
        where: { and: [{ id: { in: than.ids } }, { nguon_anh: { equals: NGUON_ANH_BLOG7 } }, ...(alt ? [{ alt: { like: alt } }] : [])] } })).totalDocs > 0;
      daCoTomTat = await dem(); daCoLoTrinh = await dem("Lộ trình bài viết"); daCoHoiDap = await dem("Câu hỏi thường gặp");
    }
    const canTomTat = !daCoTomTat && than.so < 2 && thu.muc.length >= 3;
    // Đủ 4 ảnh/bài (bìa + tóm tắt + lộ trình + hỏi đáp): chỉ bù ảnh còn thiếu khi thân bài chưa có ≥ 4 ảnh.
    const soAnhThan = than.so + (canTomTat ? 1 : 0);
    const cauHoi = (thu.data.hoi_dap ?? bai.hoi_dap ?? []) as { cau_hoi?: string | null }[];
    const hoi = cauHoi.map((h) => String(h?.cau_hoi ?? "").trim()).filter(Boolean);
    const canLoTrinh = !daCoLoTrinh && soAnhThan < 4 && thu.muc.length >= 3;
    const canHoiDap = !daCoHoiDap && soAnhThan + (canLoTrinh ? 1 : 0) < 4 && hoi.length >= 2;
    if (!ghi) {
      // Audit: chỗ giữ id để chấm điểm dự kiến; lời báo ghi rõ "sẽ".
      if (canBia) { anhBia = "du-kien"; duKien.push(bia == null ? "Sẽ vẽ ảnh bìa nền sáng (bài chưa có ảnh bìa)."
        : biaNotFair ? "Sẽ thay ảnh bìa NotFair (chữ in trong ảnh) bằng ảnh bìa nền sáng, chữ đúng dấu."
        : `Sẽ thay ảnh bìa tối (độ sáng ${Math.round((sang ?? 0) * 100)}%) bằng ảnh bìa nền sáng.`); }
      if (canTomTat) { anhTomTat = "du-kien"; duKien.push(`Sẽ vẽ + chèn ảnh "Tóm tắt nhanh" (${Math.min(5, thu.muc.length)} ý).`); }
      if (canLoTrinh) { anhLoTrinh = "du-kien"; duKien.push(`Sẽ vẽ + chèn ảnh "Lộ trình bài viết" (${Math.min(6, thu.muc.length)} phần).`); }
      if (canHoiDap) { anhHoiDap = "du-kien"; duKien.push(`Sẽ vẽ + chèn ảnh "Câu hỏi thường gặp" (${Math.min(3, hoi.length)} câu).`); }
    } else {
      if (canBia) {
        const png = await veAnhBia({ tieuDe, phu: bai.mo_ta_ngan || String(thu.data.mo_ta_ngan ?? ""), mang, duong: duongBai });
        anhBia = await taiAnh(payload, req, `bia-${String(thu.data.slug ?? bai.slug ?? "bai").slice(0, 50)}`, png, tieuDe, kho);
      }
      if (canTomTat) {
        const png = await veAnhTomTat({ tieuDe, y: thu.muc, mang, duong: duongBai });
        anhTomTat = await taiAnh(payload, req, `tom-tat-${String(thu.data.slug ?? bai.slug ?? "bai").slice(0, 44)}`, png,
          `Tóm tắt nhanh: ${tieuDe}`, kho);
      }
      if (canLoTrinh) {
        const png = await veAnhLoTrinh({ tieuDe, muc: thu.muc, mang, duong: duongBai });
        anhLoTrinh = await taiAnh(payload, req, `lo-trinh-${String(thu.data.slug ?? bai.slug ?? "bai").slice(0, 44)}`, png,
          `Lộ trình bài viết: ${tieuDe}`, kho);
      }
      if (canHoiDap) {
        const png = await veAnhCauHoi({ tieuDe, hoi, mang, duong: duongBai });
        anhHoiDap = await taiAnh(payload, req, `hoi-dap-${String(thu.data.slug ?? bai.slug ?? "bai").slice(0, 44)}`, png,
          `Câu hỏi thường gặp: ${tieuDe}`, kho);
      }
    }
  }

  const kq = chuanHoaBai(bai, {
    anhBia, anhTomTat, anhPhu: [anhLoTrinh, anhHoiDap],
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
  if (boAnhNf) {
    if (kq.data.noi_dung === undefined) kq.data.noi_dung = bai.noi_dung;
    kq.thay_doi.unshift(`${ghi ? "Bỏ" : "Sẽ bỏ"} ${boAnhNf} ảnh NotFair trong thân bài (chữ in trong ảnh hay sai dấu) — ảnh vẫn trong Thư viện ảnh.`);
  }
  if (kho.loi) kq.thay_doi.push(`Chưa tải được ảnh minh hoạ (kho ảnh: ${kho.loi}) — bấm lại "Chuẩn hoá SEO" sau khi sửa kho.`);
  if (!ghi) kq.thay_doi = [...kq.thay_doi.filter((t) => !/ảnh bìa mới|Chèn ảnh "/.test(t)), ...duKien];
  const sau = kiemDinhBai({ ...bai, ...kq.data } as never);
  const con_lai = sau.muc.filter((m) => m.muc_do !== "dat").map((m) => m.thong_diep);
  const ketQua = { id, slug: String(kq.data.slug ?? bai.slug ?? ""), tieu_de: tieuDe, thay_doi: kq.thay_doi, diem_truoc: truoc,
    diem_sau: kq.thay_doi.length ? sau.diem : truoc, con_lai, da_ghi: false, ...(kho.loi ? { kho_loi: kho.loi } : {}) };
  if (!kq.thay_doi.length || !ghi) return ketQua;

  const ghiChu = [`BLOG-7 chuẩn hoá SEO (${new Date().toISOString().slice(0, 10)}) — điểm kiểm định ${truoc} → ${sau.diem}. `
    + "Bản nháp này CHƯA lên web: đọc lại rồi bấm Xuất bản.", ...kq.thay_doi.map((t) => `• ${t}`),
    ...(con_lai.length ? ["Còn lại cần người viết tự làm:", ...con_lai.map((t) => `◦ ${t}`)] : []), bai.ghi_chu_duyet ?? ""]
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
  return { ...ketQua, da_ghi: true };
}

/** Danh sách bài nguồn NotFair trong CMS (bản nháp mới nhất) + điểm kiểm định hiện tại — cho khung "Chuẩn hoá SEO". */
export async function dsBaiNotFairCms(payload: Payload, req?: PayloadRequest) {
  const ds = await payload.find({ collection: "bai-viet", where: { nguon_goc: { equals: "notfair" } }, draft: true, depth: 0,
    limit: 500, overrideAccess: true, sort: "-updatedAt", req });
  return ds.docs.map((d) => {
    const b = d as unknown as DocBai & { _status?: string; trang_thai_duyet?: string | null };
    return { id: b.id, tieu_de: String(b.tieu_de ?? ""), slug: String(b.slug ?? ""), trang_thai: b._status ?? "draft",
      duyet: b.trang_thai_duyet ?? "dang_viet", diem: kiemDinhBai(b as never).diem };
  });
}

/** Mọi bài nguồn NotFair (kể cả nháp). */
export async function chuanHoaTatCaNotFair(payload: Payload, req?: PayloadRequest, opt: { ve?: boolean; ghi?: boolean } = {}): Promise<KetQuaBai[]> {
  const ds = await payload.find({ collection: "bai-viet", where: { nguon_goc: { equals: "notfair" } }, draft: true, depth: 0,
    limit: 500, overrideAccess: true, select: { slug: true }, req });
  const kq: KetQuaBai[] = [];
  for (const d of ds.docs) {
    try { kq.push(await chuanHoaMotBai(payload, req, d.id, opt)); }
    catch (e) { kq.push({ id: d.id, slug: "", tieu_de: "", thay_doi: [], diem_truoc: 0, diem_sau: 0, con_lai: [], da_ghi: false,
      loi: (e as Error)?.message?.slice(0, 300) ?? "lỗi" }); }
  }
  return kq;
}

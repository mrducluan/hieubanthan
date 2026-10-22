// ND-6 — thẻ quản trị "Trang có nội dung CMS" (/quan-tri/tang-truong): URL nào đang có nội dung CMS đã xuất bản, sửa phần
// nào, lần sửa gần nhất, số lượt bấm nút CMS (PostHog `cms_khoi_bam`) và Search Console TRƯỚC / SAU lần sửa đó (28 ngày mỗi
// bên — đo ND theo docs/KIEN-TRUC-NOI-DUNG-TRANG.md: "GSC CTR theo URL trước/sau khi sửa"). Chỉ máy chủ, chỉ đọc.
// Phần thuần (tomTatSua, chiaTruocSau, regexGsc) tách riêng để kiểm thử không cần CMS / Google.
import { goiCms, chuoiTruyVan } from "@/lib/cms";
import { regexMau } from "@/lib/so-trang";
import { SITE_CHINH } from "@/lib/seo";
import { anToan, ChuaKetNoi, gscTheoNgay, hogql, ngayChotGsc } from "@/lib/so-lieu-ngoai";
import type { TrangCms } from "@/lib/noi-dung-trang";

export type TrangCmsQt = {
  loai: "trang" | "mau";
  id: number | string;
  /** URL cụ thể (trang) hoặc mẫu đường dẫn (mẫu cụm, vd /kinh-dich/que/{slug}). */
  duong: string;
  ten: string | null;
  sua: string[];
  capNhat: string;
};

type DocQt = TrangCms & { id: number | string; mau_duong?: string; ten?: string | null; updatedAt?: string; tren_web?: boolean | null };

const coChu = (v: unknown) => typeof v === "string" && v.trim() !== "";
const coMang = (v: unknown) => Array.isArray(v) && v.length > 0;
const soKhoa = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).length : 0);

/** Phần nào của trang đang có nội dung CMS (ô trống = trang dùng chữ trong code). */
export function tomTatSua(d: Partial<DocQt>): string[] {
  const ra: string[] = [];
  if (coChu(d.tieu_de_seo) || coChu(d.mo_ta_seo) || d.anh_chia_se) ra.push("SEO");
  if (coChu(d.h1) || coChu(d.loi_dan)) ra.push("Đầu trang");
  if ((d.doan ?? []).some((x) => coChu(x?.chu)) || coMang(d.hoi_dap) || coMang(d.lien_ket)) ra.push("Giới thiệu");
  if ((d.muc ?? []).some((x) => coChu(x?.noi_dung_html))) ra.push("Mục");
  if (coChu(d.ngay_hieu_luc)) ra.push("Ngày hiệu lực");
  const khoi = [d.khoi_tren, d.khoi_duoi, d.khoi_cuoi].reduce((n, k) => n + (k?.length ?? 0), 0);
  if (khoi) ra.push(`${khoi} khối`);
  const chu = soKhoa(d.chu), hinh = soKhoa(d.hinh);
  if (chu) ra.push(`${chu} chữ`);
  if (hinh) ra.push(`${hinh} hình`);
  return ra;
}

const SELECT = ["tieu_de_seo", "mo_ta_seo", "anh_chia_se", "h1", "loi_dan", "doan", "hoi_dap", "lien_ket", "muc", "ngay_hieu_luc",
  "khoi_tren", "khoi_duoi", "khoi_cuoi", "chu", "hinh", "ten", "updatedAt", "tren_web"];

/** Mọi trang + mẫu cụm đang có nội dung CMS ĐÃ XUẤT BẢN, mới sửa trước. CMS chưa nối / lỗi → null. */
export async function dsTrangCmsQt(): Promise<TrangCmsQt[] | null> {
  const truyVan = (o: string) => chuoiTruyVan({
    where: { _status: { equals: "published" } }, limit: 500, depth: 0, sort: "-updatedAt",
    select: Object.fromEntries([...SELECT, o].map((k) => [k, true])),
  }).join("&");
  const [t, m] = await Promise.all([
    goiCms<{ docs?: DocQt[] }>(`/api/noi-dung-trang?${truyVan("duong")}`, { hanMs: 8_000 }),
    goiCms<{ docs?: DocQt[] }>(`/api/mau-cum?${truyVan("mau_duong")}`, { hanMs: 8_000 }),
  ]);
  if (!t && !m) return null;
  const ra: TrangCmsQt[] = [];
  for (const [loai, ds] of [["trang", t?.docs], ["mau", m?.docs]] as const) {
    for (const d of ds ?? []) {
      const duong = loai === "trang" ? d.duong : d.mau_duong;
      const sua = tomTatSua(d);
      if (!duong || !sua.length || d.tren_web === false) continue;
      ra.push({ loai, id: d.id, duong, ten: d.ten ?? null, sua, capNhat: d.updatedAt ?? "" });
    }
  }
  return ra.sort((a, b) => b.capNhat.localeCompare(a.capNhat));
}

// ------------------------------------------------------------------ Search Console trước / sau
export type SoKy = { nhap: number; hien: number; ngay: number };
export type TruocSau = { truoc: SoKy; sau: SoKy };
export const KY_SO_SANH = 28;

const ngayIso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Chia số theo ngày của Search Console thành 28 ngày TRƯỚC ngày sửa và tối đa 28 ngày TỪ ngày sửa (tới `den`). `ngay` = số
 *  ngày của kỳ (kỳ sau có thể ngắn hơn khi mới sửa) — so bằng nhấp/ngày + CTR, không so tổng. */
export function chiaTruocSau(dong: { keys: string[]; clicks: number; impressions: number }[], ngaySua: string, den: string): TruocSau {
  const sua = Date.parse(`${ngaySua.slice(0, 10)}T00:00:00Z`), het = Date.parse(`${den}T00:00:00Z`);
  const tuTruoc = ngayIso(sua - KY_SO_SANH * 86_400_000), s = ngayIso(sua), denSau = ngayIso(Math.min(het, sua + (KY_SO_SANH - 1) * 86_400_000));
  const ky = (): SoKy => ({ nhap: 0, hien: 0, ngay: 0 });
  const truoc = ky(), sau = ky();
  for (const d of dong) {
    const n = d.keys[0] ?? "";
    const k = n >= tuTruoc && n < s ? truoc : n >= s && n <= denSau ? sau : null;
    if (k) { k.nhap += d.clicks; k.hien += d.impressions; }
  }
  truoc.ngay = KY_SO_SANH;
  sau.ngay = het < sua ? 0 : Math.round((Date.parse(`${denSau}T00:00:00Z`) - sua) / 86_400_000) + 1;
  return { truoc, sau };
}

/** Bộ lọc trang cho Search Console: URL cụ thể → equals; mẫu cụm → includingRegex (cùng luật regexMau, RE2). */
export function locGsc(t: Pick<TrangCmsQt, "loai" | "duong">): { dimension: "page"; operator: "equals" | "includingRegex"; expression: string } {
  if (t.loai === "trang") return { dimension: "page", operator: "equals", expression: `${SITE_CHINH}${t.duong}` };
  const re = regexMau(t.duong).source.replace(/^\^/, "");
  return { dimension: "page", operator: "includingRegex", expression: `^${SITE_CHINH.replace(/\./g, "\\.")}${re}` };
}

// ------------------------------------------------------------------ gộp cho thẻ quản trị
export const TOI_DA_GSC = 25;
export type DongTrangCms = TrangCmsQt & { bam: number | null; gsc: TruocSau | null };
export type BaoCaoTrangCms = {
  ds: DongTrangCms[];
  /** null = có số; chuỗi = lý do không có (chưa kết nối / lỗi) — thẻ hiện lý do thay vì số 0. */
  gscLoi: string | null; bamLoi: string | null;
};

const loiCua = (e: unknown) => e instanceof ChuaKetNoi ? `chưa kết nối (${e.message})` : e instanceof Error ? e.message : "lỗi không rõ";

/** Lượt bấm nút CMS (28 ngày) theo trang; mẫu cụm = tổng các URL khớp mẫu. */
export function bamTheoDong(t: Pick<TrangCmsQt, "loai" | "duong">, theoTrang: Map<string, number>): number {
  if (t.loai === "trang") return theoTrang.get(t.duong) ?? 0;
  const re = regexMau(t.duong);
  let n = 0;
  for (const [d, so] of theoTrang) if (re.test(d)) n += so;
  return n;
}

async function baoCaoTrangCmsTho(): Promise<BaoCaoTrangCms | null> {
  const ds = await dsTrangCmsQt();
  if (!ds) return null;
  let bamLoi: string | null = null, gscLoi: string | null = null;
  const bam = await hogql<[string | null, number]>(`SELECT properties.trang, count() FROM events
     WHERE event = 'cms_khoi_bam' AND timestamp > now() - INTERVAL 28 DAY GROUP BY properties.trang LIMIT 2000`)
    .then((r) => new Map(r.filter(([d]) => d).map(([d, n]) => [d!, Number(n)])))
    .catch((e: unknown) => { bamLoi = loiCua(e); return null; });
  const den = ngayChotGsc();
  // Search Console: mỗi URL / cụm một lần gọi → chỉ TOI_DA_GSC dòng sửa gần nhất (hạn mức API); dòng sau hiện "—".
  const gsc = await Promise.all(ds.slice(0, TOI_DA_GSC).map(async (t) => {
    if (gscLoi || !t.capNhat) return null;
    const tu = new Date(Date.parse(t.capNhat) - KY_SO_SANH * 86_400_000).toISOString().slice(0, 10);
    try { return chiaTruocSau(await gscTheoNgay(locGsc(t), tu), t.capNhat, den); } catch (e) { gscLoi ??= loiCua(e); return null; }
  }));
  return {
    ds: ds.map((t, i) => ({ ...t, bam: bam ? bamTheoDong(t, bam) : null, gsc: gscLoi ? null : gsc[i] ?? null })),
    gscLoi, bamLoi,
  };
}

/** Cache 1 giờ như các báo cáo khác của /quan-tri/tang-truong. */
export const baoCaoTrangCms = anToan(baoCaoTrangCmsTho, "qt-trang-cms");

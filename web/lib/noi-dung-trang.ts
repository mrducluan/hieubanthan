// ND-0 — nội dung một URL = gộp theo thứ tự ưu tiên (docs/KIEN-TRUC-NOI-DUNG-TRANG.md mục 3.1, 3.7):
//   tài liệu "Trang website" của chính URL (ô có nội dung) > "Mẫu cụm trang" (chỉ khối) > chữ mặc định trong code (lib/so-trang.ts).
// Luôn trả đủ ô, KHÔNG bao giờ null: CMS chưa nối / lỗi / chậm (hạn 1,5 giây) → toàn bộ mặc định code.
// ND-2 nối trang công cụ, ND-3 trang tĩnh + chủ đề; pháp lý (ND-4) và trang KB (ND-5) chưa đọc.
// Biến mẫu cụm {tieu_de}…: web thay bằng giá trị engine trả cho đúng trang, biến lạ giữ nguyên chữ. KHÔNG thoát HTML ở đây:
// mọi khối CMS hiện dạng văn bản thuần (React tự thoát ký tự) — thoát hai lần sẽ lộ "&amp;" trên trang (ND-5).
import type { Metadata } from "next";
import { anhCms, dangHien, duongLienKet, goiCms, chuoiTruyVan, type AnhCms, type LienKetCms } from "@/lib/cms";
import { catMoTa, metaTrang, tieuDeSeo } from "@/lib/seo";
import { khopMauCum, mucSoTrang, type MacDinhTrang, type NhomTrang } from "@/lib/so-trang";

export type KieuChu = { co: "nho" | "thuong" | "lon" | "rat_lon"; can: "trai" | "giua"; nen: "khong" | "nhan" | "vang" | "ngoc" };
export type KhoiCms = { blockType: string; id?: string; [k: string]: unknown };
export type ViTri = "tren" | "duoi" | "cuoi";
export type NoiDungTrang = {
  duong: string; nhom: NhomTrang | null; ten: string | null;
  seo: { tieuDe: string | null; moTa: string | null; anh: AnhCms | null };
  dau: { h1: string | null; loiDan: string | null; kieuChu: KieuChu };
  gioiThieu: { doan: string[]; hoiDap: { hoi: string; dap: string }[]; lienKet: { href: string; ten: string }[] };
  /** Mục văn bản: html = null → trang dùng thân mục trong code (CMS chưa sửa mục đó). */
  muc: { id: string; tieuDe: string; html: string | null }[];
  ngayHieuLuc: string | null;
  khoi: Record<ViTri, KhoiCms[]>;
  /** ND-7 "Chữ trên trang" thô từ CMS (khoá → chữ; trang URL thắng mẫu cụm) — trang lọc theo bảng chữ của mình (taoChu). */
  chu: Record<string, string>;
  /** Có lấy được gì từ CMS không (để đo / gỡ lỗi). */
  nguon: { trang: boolean; mau: boolean };
};

/** Tài liệu CMS (REST) — chỉ các trường web dùng. */
export type TrangCms = {
  duong?: string; nhom?: NhomTrang | null; ten?: string | null;
  tieu_de_seo?: string | null; mo_ta_seo?: string | null; anh_chia_se?: AnhCms | number | null;
  h1?: string | null; loi_dan?: string | null; kieu_chu?: Partial<KieuChu> | null;
  doan?: { chu?: string | null }[] | null; hoi_dap?: { cau_hoi?: string | null; tra_loi?: string | null }[] | null;
  lien_ket?: LienKetCms[] | null;
  muc?: { neo?: string | null; tieu_de?: string | null; noi_dung_html?: string | null }[] | null;
  ngay_hieu_luc?: string | null;
  khoi_tren?: KhoiCms[] | null; khoi_duoi?: KhoiCms[] | null; khoi_cuoi?: KhoiCms[] | null;
  che_do_mau?: Partial<Record<ViTri, "thay" | "them_sau" | "an_mau">> | null;
  chu?: Record<string, unknown> | null;
};
export type MauCms = Pick<TrangCms, "khoi_tren" | "khoi_duoi" | "khoi_cuoi" | "chu"> & { mau_duong?: string };

const KIEU_CHU_MAC_DINH: KieuChu = { co: "thuong", can: "trai", nen: "khong" };
const TRONG_SITE = /^\/(?![/\\])[^\s\\]*$/;   // như DUONG_TRONG_SITE của CMS

/** Đường dẫn hợp lệ cho webhook / tra cứu: trong site, ≤ 300 ký tự (không nhận link ngoài, không "//x"). */
export const duongHopLe = (v: unknown): string | null =>
  typeof v === "string" && v.length <= 300 && TRONG_SITE.test(v) ? v : null;
export const theTrang = (duong: string) => `trang:${duong}`;

/** Thay {bien} bằng giá trị (chữ thuần — nơi hiển thị tự thoát). Biến không có trong `bien` giữ nguyên chữ. */
export function thayBien(s: string, bien: Record<string, string>): string {
  return s.replace(/\{([a-z_]+)\}/g, (m, k: string) => (Object.hasOwn(bien, k) ? bien[k]! : m));
}
/** Thay biến trong mọi chuỗi của một khối (đệ quy), bỏ qua đường dẫn / mã. */
function thayBienKhoi<T>(v: T, bien: Record<string, string>, khoa = ""): T {
  if (typeof v === "string") return (["blockType", "id", "url", "link", "nut_link", "duong_dan", "cong_cu"].includes(khoa) ? v : thayBien(v, bien)) as T;
  if (Array.isArray(v)) return v.map((x) => thayBienKhoi(x, bien, khoa)) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, thayBienKhoi(x, bien, k)])) as T;
  return v;
}

const chu = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const khoiHien = (ds: KhoiCms[] | null | undefined, now: number) =>
  (ds ?? []).filter((k) => k && typeof k.blockType === "string" && dangHien(k as { tu_ngay?: string | null; den_ngay?: string | null }, now));

/** Gộp (thuần, để test): URL > mẫu cụm (khối) > mặc định code. */
export function gopNoiDung(duong: string, macDinh: MacDinhTrang & { nhom?: NhomTrang | null; ten?: string | null },
  trang: TrangCms | null, mau: MauCms | null, bien: Record<string, string> = {}, now = Date.now()): NoiDungTrang {
  const t = trang ?? {};
  const doan = (t.doan ?? []).map((d) => chu(d?.chu)).filter((x): x is string => Boolean(x));
  const hoiDap = (t.hoi_dap ?? []).flatMap((h) => (chu(h?.cau_hoi) && chu(h?.tra_loi) ? [{ hoi: chu(h.cau_hoi)!, dap: chu(h.tra_loi)! }] : []));
  const lienKet = (t.lien_ket ?? []).flatMap((l) => {
    const href = l ? duongLienKet(l) : null;
    return href && chu(l.nhan) ? [{ href, ten: chu(l.nhan)! }] : [];
  });
  const mucCms = (t.muc ?? []).flatMap((m) => (m?.neo && chu(m.tieu_de) ? [{ id: m.neo, tieuDe: chu(m.tieu_de)!, html: chu(m.noi_dung_html) }] : []));
  const kc = t.kieu_chu ?? {};
  const khoi = {} as Record<ViTri, KhoiCms[]>;
  for (const vt of ["tren", "duoi", "cuoi"] as const) {
    const rieng = khoiHien(t[`khoi_${vt}`], now), cua = khoiHien(mau?.[`khoi_${vt}`], now);
    const cheDo = t.che_do_mau?.[vt] ?? "thay";
    const ds = cheDo === "an_mau" ? rieng : cheDo === "them_sau" ? [...cua, ...rieng] : rieng.length ? rieng : cua;
    khoi[vt] = Object.keys(bien).length ? ds.map((k) => thayBienKhoi(k, bien)) : ds;
  }
  const chuCms: Record<string, string> = {};
  for (const nguon of [mau?.chu, t.chu]) {
    if (!nguon || typeof nguon !== "object" || Array.isArray(nguon)) continue;
    for (const [k, v] of Object.entries(nguon)) if (typeof v === "string" && v.trim()) chuCms[k] = v.trim();
  }
  const anh = t.anh_chia_se && typeof t.anh_chia_se === "object" && t.anh_chia_se.url ? t.anh_chia_se : null;
  return {
    duong, nhom: t.nhom ?? macDinh.nhom ?? null, ten: t.ten ?? macDinh.ten ?? null,
    seo: { tieuDe: chu(t.tieu_de_seo) ?? macDinh.tieu_de_seo ?? null, moTa: chu(t.mo_ta_seo) ?? macDinh.mo_ta_seo ?? null, anh },
    dau: {
      h1: chu(t.h1) ?? macDinh.h1 ?? null, loiDan: chu(t.loi_dan) ?? macDinh.loi_dan ?? null,
      kieuChu: {
        co: (["nho", "thuong", "lon", "rat_lon"] as const).find((x) => x === kc.co) ?? KIEU_CHU_MAC_DINH.co,
        can: (["trai", "giua"] as const).find((x) => x === kc.can) ?? KIEU_CHU_MAC_DINH.can,
        nen: (["khong", "nhan", "vang", "ngoc"] as const).find((x) => x === kc.nen) ?? KIEU_CHU_MAC_DINH.nen,
      },
    },
    gioiThieu: {
      doan: doan.length ? doan : [...(macDinh.doan ?? [])],
      hoiDap: hoiDap.length ? hoiDap : [...(macDinh.hoi_dap ?? [])],
      lienKet: lienKet.length ? lienKet : [...(macDinh.lien_ket ?? [])],
    },
    muc: mucCms.length ? mucCms : (macDinh.muc ?? []).map((m) => ({ id: m.id, tieuDe: m.tieu_de, html: null })),
    ngayHieuLuc: chu(t.ngay_hieu_luc) ?? macDinh.ngay_hieu_luc ?? null,
    khoi,
    chu: chuCms,
    nguon: { trang: Boolean(trang), mau: Boolean(mau) },
  };
}

const HAN = 1_500;   // chạy trên mọi trang → ngắn hơn hạn đọc bài (4 giây)
const tv = (o: Record<string, unknown>) => chuoiTruyVan(o).join("&");

/** Nội dung của một URL (bản đã xuất bản). `bien`: giá trị biến cho mẫu cụm (trang KB). */
export async function layNoiDungTrang(duong: string, bien: Record<string, string> = {}): Promise<NoiDungTrang> {
  const muc = mucSoTrang(duong), cum = muc ? null : khopMauCum(duong);
  const macDinh = { ...(muc?.mac_dinh ?? {}), nhom: muc?.nhom ?? cum?.mau.nhom ?? null, ten: muc?.ten ?? null };
  if (!duongHopLe(duong)) return gopNoiDung(duong, macDinh, null, null);
  const daXb = { _status: { equals: "published" } };
  const [r, m] = await Promise.all([
    goiCms<{ docs?: TrangCms[] }>(`/api/noi-dung-trang?${tv({ where: { duong: { equals: duong }, ...daXb }, limit: 1, depth: 1 })}`,
      { hanMs: HAN, the: [theTrang(duong)] }),
    cum ? goiCms<{ docs?: MauCms[] }>(`/api/mau-cum?${tv({ where: { mau_duong: { equals: cum.mau.mau_duong }, ...daXb }, limit: 1, depth: 1 })}`,
      { hanMs: HAN, the: [theTrang(cum.mau.mau_duong)] }) : Promise.resolve(null),
  ]);
  return gopNoiDung(duong, macDinh, r?.docs?.[0] ?? null, m?.docs?.[0] ?? null, { ...(cum?.bien ?? {}), ...bien });
}

/** ND-7: H1 + lời dẫn đã xuất bản của nhiều URL trong MỘT lần gọi (thẻ chủ đề ở /kien-thuc và khối "Kiến thức …" của
 *  trang công cụ: sửa tên/mô tả trang chủ đề ở CMS thì thẻ trỏ tới nó đổi theo). Lỗi / CMS chưa nối → {}. */
export async function layDauNhieuTrang(duongs: string[]): Promise<Record<string, { ten: string | null; moTa: string | null }>> {
  const ds = [...new Set(duongs.filter((d) => duongHopLe(d)))];
  if (!ds.length) return {};
  const r = await goiCms<{ docs?: TrangCms[] }>(`/api/noi-dung-trang?${tv({ where: { duong: { in: ds.join(",") }, _status: { equals: "published" } },
    limit: ds.length, depth: 0, select: { duong: true, h1: true, loi_dan: true } })}`, { hanMs: HAN });
  return Object.fromEntries((r?.docs ?? []).flatMap((d) => (d.duong ? [[d.duong, { ten: chu(d.h1), moTa: chu(d.loi_dan) }]] : [])));
}

/** Phủ ô SEO của CMS lên metadata gốc của trang. CMS không đổi gì so với chữ trong code → trả NGUYÊN metadata gốc
 *  (HTML không lệch một byte). `tuyetDoi`: tiêu đề không gắn hậu tố thương hiệu (trang chủ). Ảnh chia sẻ: ảnh CMS nếu có; đổi tiêu đề thì ảnh /og tự vẽ lại theo tiêu đề mới. */
export function apDungSeo(goc: Metadata, nd: NoiDungTrang, { tuyetDoi = false } = {}): Metadata {
  const md = mucSoTrang(nd.duong)?.mac_dinh ?? {};
  const tieuDe = nd.seo.tieuDe && nd.seo.tieuDe !== md.tieu_de_seo ? nd.seo.tieuDe : null;
  const moTa = nd.seo.moTa && nd.seo.moTa !== md.mo_ta_seo ? catMoTa(nd.seo.moTa) : null;
  const anh = anhCms(nd.seo.anh, "og");
  if (!tieuDe && !moTa && !anh) return goc;
  // openGraph/twitter của trang THAY bản layout (không gộp) → trang không tự khai thì dựng đủ bộ (loại, url, ảnh /og, thẻ
  // Twitter) bằng metaTrang, tránh mất ảnh chia sẻ khi chỉ sửa tiêu đề.
  const day = metaTrang({ tieuDe: tieuDe ?? md.tieu_de_seo ?? nd.ten ?? "", moTa: moTa ?? md.mo_ta_seo ?? "", duong: nd.duong });
  const og = (goc.openGraph ?? day.openGraph) as Record<string, unknown>, tw = (goc.twitter ?? day.twitter) as Record<string, unknown>;
  const anhGoc0 = Array.isArray(og.images) ? og.images[0] : og.images;
  const anhGoc = typeof anhGoc0 === "string" ? anhGoc0 : (anhGoc0 as { url?: unknown } | undefined)?.url;
  // Ảnh /og vẽ theo tiêu đề: đổi tiêu đề thì giữ nguyên hình theo mảng (SEO-K), chỉ thay chữ.
  const veLai = (u: string) => { const q = new URLSearchParams(u.slice(4)); q.set("tieu_de", tieuDe!); return `/og?${q.toString()}`; };
  const anhMoi = anh ? [anh.src]
    : tieuDe && typeof anhGoc === "string" && anhGoc.startsWith("/og?tieu_de=") ? [veLai(anhGoc)] : null;
  const them = { ...(tieuDe ? { title: tieuDe } : {}), ...(moTa ? { description: moTa } : {}), ...(anhMoi ? { images: anhMoi } : {}) };
  return {
    ...goc,
    ...(tieuDe ? { title: tuyetDoi ? { absolute: tieuDe } : tieuDeSeo(tieuDe) } : {}),
    ...(moTa ? { description: moTa } : {}),
    openGraph: { ...og, ...them } as Metadata["openGraph"],
    twitter: { ...tw, ...them } as Metadata["twitter"],
  };
}

/** Props cho khối "Về công cụ…" (GioiThieuCongCu) từ nội dung đã gộp. */
export const gioiThieuTu = (nd: NoiDungTrang) => ({
  duong: nd.duong, ten: nd.ten ?? "", moTa: nd.seo.moTa ?? "",
  doan: nd.gioiThieu.doan, hoiDap: nd.gioiThieu.hoiDap, lienKet: nd.gioiThieu.lienKet,
});

/** Metadata mặc định từ sổ trang (tiêu đề + mô tả SEO đang chạy trong code) — trang dựng meta gốc từ đây. */
export function metaMacDinh(duong: string): Metadata {
  const m = mucSoTrang(duong)?.mac_dinh ?? {};
  return metaTrang({ tieuDe: m.tieu_de_seo ?? "", moTa: m.mo_ta_seo ?? "", duong });
}

const mdChu = (v: unknown) => (typeof v === "string" ? v.trim() : "");
/** Chữ của các khối CMS dạng Markdown — bản .md của trang cùng nội dung với HTML (SEO-D). Khối không có chữ bị bỏ qua. */
export function mdKhoi(ds: KhoiCms[]): string {
  return ds.map((k) => {
    const td = mdChu(k.tieu_de), nd = mdChu(k.noi_dung), mo = mdChu(k.mo_ta);
    switch (k.blockType) {
      case "van_ban": return [td && `## ${td}`, nd].filter(Boolean).join("\n\n");
      case "ghi_chu": return nd && `> ${td ? `**${td}** — ` : ""}${nd.replace(/\n+/g, " ")}`;
      case "trich_dan": return mdChu(k.cau) && `> ${mdChu(k.cau)}\n>\n> — ${mdChu(k.nguon)}`;
      case "banner": case "loi_moi": return [td && `**${td}**`, mo].filter(Boolean).join("\n\n");
      case "keu_goi": return mdChu(k.loi_moi);
      case "anh": return mdChu(k.chu_thich);
      case "hoi_dap": return ((k.ds as { cau_hoi?: string; tra_loi?: string }[] | undefined) ?? [])
        .map((h) => `### ${mdChu(h.cau_hoi)}\n\n${mdChu(h.tra_loi)}`).join("\n\n");
      default: return "";
    }
  }).filter(Boolean).join("\n\n");
}

/** Ngày hiệu lực hiển thị dd/mm/yyyy: chữ trong code đã đúng dạng; ngày CMS (ISO, ô "dayOnly" lưu 12:00 UTC) đổi theo UTC. */
export function ngayHienThi(v: string | null): string | null {
  if (!v || /^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

// ND — cầu nối CMS ↔ Kho tri thức (mục 8.2 docs/KIEN-TRUC-NOI-DUNG-TRANG.md): CMS KHÔNG lưu chữ KB, chỉ xem trước CHỈ
// ĐỌC chữ engine đang trả cho một trang KB + nút mở /quan-tri/tri-thuc/<tệp> (sửa ở git → PR). Dùng chung engine với
// trợ lý AI (ENGINE_URL, ENGINE_API_KEY). Thiếu engine / lỗi → báo rõ, không bịa.
import { webUrl } from "./web";

export type NguonKb = { kieu: "kb" | "tuoi" | "la_so_mau"; loai?: string; vi_du: string; tep_kb: string[] };
export type DoanKb = { nhan: string; chu: string };
export type XemKb = { duong: string; tieu_de: string | null; doan: DoanKb[]; tep: { ten: string; url: string }[]; loi?: string };

const SLUG = /^[a-z0-9-]{1,120}$/;
const LOAI = /^[a-z_]{1,20}$/;

/** Đường dẫn engine của một trang theo kiểu nguồn (null nếu dữ liệu sai). */
export function duongEngine(n: NguonKb, slug: string): string | null {
  if (!SLUG.test(slug)) return null;
  if (n.kieu === "kb") return n.loai && LOAI.test(n.loai) ? `/v1/kb/trang/${n.loai}/${slug}` : null;
  // SEO-K: trang tuổi gộp nam + nữ (tuoi-1990); slug cũ -nam/-nu engine vẫn tra được về bản gộp.
  if (n.kieu === "tuoi") return /^tuoi-\d{4}(-(nam|nu))?$/.test(slug) ? `/v1/phongthuy/tuoi-gop/${slug}` : null;
  return `/v1/tuvi/la-so-mau/${slug}`;
}

/** Link sửa từng tệp KB ở trang quản trị web (cần token GitHub ở web — QT-1). */
export const linkTepKb = (tep: string[]) =>
  tep.filter((t) => /^[a-z0-9_]+\.json$/.test(t)).map((t) => ({ ten: t, url: `${webUrl()}/quan-tri/tri-thuc/${t.replace(/\.json$/, "")}` }));

/** Rút chữ đọc được từ JSON engine (trang KB có tieu_de/tra_loi_nhanh/muc/hoi_dap; trang khác: mọi chuỗi đủ dài). */
export function rutChu(d: unknown, toiDa = 40): { tieu_de: string | null; doan: DoanKb[] } {
  const o = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
  const doan: DoanKb[] = [];
  const them = (nhan: string, chu: unknown) => {
    if (typeof chu === "string" && chu.trim() && doan.length < toiDa) doan.push({ nhan, chu: chu.trim() });
  };
  them("Mô tả", o.mo_ta);
  them("Trả lời nhanh", o.tra_loi_nhanh);
  if (Array.isArray(o.muc)) for (const m of o.muc as Record<string, unknown>[]) {
    them(`Mục · ${String(m?.tieu_de ?? "")}`, [m?.doan, ...(Array.isArray(m?.danh_sach) ? (m.danh_sach as unknown[]).map((x) => `• ${String(x)}`) : [])]
      .filter((x) => typeof x === "string" && x).join("\n"));
  }
  if (Array.isArray(o.hoi_dap)) for (const h of o.hoi_dap as Record<string, unknown>[]) them(`Hỏi · ${String(h?.hoi ?? "")}`, h?.dap);
  if (!doan.length) {
    // Trang không theo khuôn KB (tuổi hợp hướng, lá số mẫu): duyệt mọi chuỗi ≥ 30 ký tự, bỏ khoá kỹ thuật.
    const duyet = (v: unknown, khoa: string) => {
      if (doan.length >= toiDa) return;
      if (typeof v === "string") { if (v.length >= 30 && !/^(slug|url|duong|ma)$/.test(khoa)) them(khoa, v); return; }
      if (Array.isArray(v)) v.forEach((x) => duyet(x, khoa));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (k !== "minh_hoa") duyet(x, k);
    };
    duyet(o, "");
  }
  return { tieu_de: typeof o.tieu_de === "string" ? o.tieu_de : null, doan };
}

export async function xemKb(n: NguonKb, slug: string, duongWeb: string): Promise<XemKb> {
  const tep = linkTepKb(n.tep_kb ?? []);
  const rong = (loi: string): XemKb => ({ duong: duongWeb, tieu_de: null, doan: [], tep, loi });
  const goc = (process.env.ENGINE_URL || "").replace(/\/+$/, "");
  if (!goc) return rong("Chưa nối engine (thiếu ENGINE_URL trên CMS) — vẫn mở được Kho tri thức bằng nút bên dưới.");
  const d = duongEngine(n, slug);
  if (!d) return rong("Đường dẫn không thuộc cụm này.");
  try {
    const r = await fetch(`${goc}${d}`, {
      headers: process.env.ENGINE_API_KEY ? { "x-engine-key": process.env.ENGINE_API_KEY } : {},
      signal: AbortSignal.timeout(8_000),
    });
    if (r.status === 404) return rong("Engine không có trang này.");
    if (!r.ok) return rong(`Engine lỗi ${r.status}.`);
    return { duong: duongWeb, ...rutChu(await r.json()), tep };
  } catch {
    return rong("Không kết nối được engine, thử lại sau.");
  }
}

/** Trang KB có thật không (ghi đè theo yêu cầu): true / false; null = không hỏi được engine (chỉ dựa vào mẫu đường dẫn). */
export async function coTrangKb(n: NguonKb, slug: string): Promise<boolean | null> {
  const goc = (process.env.ENGINE_URL || "").replace(/\/+$/, "");
  const d = duongEngine(n, slug);
  if (!d) return false;
  if (!goc) return null;
  try {
    const r = await fetch(`${goc}${d}`, {
      headers: process.env.ENGINE_API_KEY ? { "x-engine-key": process.env.ENGINE_API_KEY } : {},
      signal: AbortSignal.timeout(8_000),
    });
    return r.status === 404 ? false : r.ok ? true : null;
  } catch {
    return null;
  }
}

// CG-6 — kiểm trùng nội dung bài viết với bài khác trong CMS và với kho tri thức của site.
// Luật cố định, KHÔNG gọi AI: vân tay = băm từng cụm K từ liên tiếp (đã bỏ dấu, viết thường), độ trùng = tỉ lệ cụm
// của bài mới có trong nguồn kia. Chép nguyên đoạn, đổi dấu câu/hoa thường/kiểu bỏ dấu vẫn bị bắt; viết lại bằng lời
// của mình thì không. Bài cộng tác viên trùng nặng → chặn gửi duyệt/xuất bản (chặn chép bài, docs/KE-HOACH-CHUYEN-GIA.md).
// File chỉ import kiem-dinh.ts (không thư viện) để chạy được cả trong `node --test`.
import { boDau, docLexical, type MucKiem } from "./kiem-dinh.ts";

/** Số từ mỗi cụm. 5 âm tiết tiếng Việt ≈ 2–3 từ: đủ dài để cụm chung chung ("số chủ đạo 7 là") không gây trùng giả. */
export const K = 5;
/** Ngưỡng độ trùng (tỉ lệ cụm của bài mới nằm trong nguồn kia). */
export const NGUONG = { canh_bao: 0.2, loi: 0.5 } as const;
/** Bài ngắn hơn chừng này cụm thì chưa kiểm (nháp mới gõ vài dòng). */
const IT_NHAT = 20;

type Tu = { goc: string; khoa: string };

function tach(van: string): Tu[] {
  const ra: Tu[] = [];
  for (const goc of String(van ?? "").normalize("NFC").split(/[^\p{L}\p{N}]+/u)) {
    const khoa = boDau(goc).replace(/[^a-z0-9]/g, "");
    if (khoa) ra.push({ goc, khoa });
  }
  return ra;
}

/** Từ đã chuẩn hoá (bỏ dấu, viết thường, bỏ dấu câu). */
export const tuCua = (van: string) => tach(van).map((t) => t.khoa);

function bam(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

function cacCum(tu: string[]): number[] {
  const ra: number[] = [];
  for (let i = 0; i + K <= tu.length; i++) ra.push(bam(tu.slice(i, i + K).join(" ")));
  return ra;
}

export function vanTay(van: string): Set<number> {
  return new Set(cacCum(tuCua(van)));
}

export const maHoaVanTay = (v: Iterable<number>) => [...v].map((h) => h.toString(36)).join(" ");
export const giaiMaVanTay = (s: string) => new Set(String(s ?? "").split(" ").filter(Boolean).map((x) => parseInt(x, 36)));

/** Văn bản dùng để so: trả lời nhanh + thân bài + câu trả lời hỏi đáp (tiêu đề ngắn, không tính). */
export function vanBai(bai: { tra_loi_nhanh?: unknown; noi_dung?: unknown; hoi_dap?: unknown }): string {
  const hd = Array.isArray(bai.hoi_dap) ? bai.hoi_dap.map((x) => String((x as { tra_loi?: unknown })?.tra_loi ?? "")) : [];
  return [String(bai.tra_loi_nhanh ?? ""), docLexical(bai.noi_dung).van, ...hd].join("\n");
}

function doChua(moi: Set<number>, nguon: Set<number>): number {
  if (!moi.size) return 0;
  let co = 0;
  for (const h of moi) if (nguon.has(h)) co++;
  return co / moi.size;
}

/** Đoạn chép liền dài nhất của `van` có trong `nguon` (chữ gốc, tối đa 30 từ) — để người duyệt thấy ngay chỗ trùng. */
export function doanTrungDaiNhat(van: string, nguon: Set<number>): string {
  const tu = tach(van);
  const cum = cacCum(tu.map((t) => t.khoa));
  let tot = { dau: -1, dai: 0 }, dau = -1;
  for (let i = 0; i <= cum.length; i++) {
    if (i < cum.length && nguon.has(cum[i]!)) { if (dau < 0) dau = i; continue; }
    if (dau >= 0 && i - dau > tot.dai) tot = { dau, dai: i - dau };
    dau = -1;
  }
  if (tot.dau < 0) return "";
  const doan = tu.slice(tot.dau, tot.dau + tot.dai + K - 1).map((t) => t.goc);
  return doan.length > 30 ? doan.slice(0, 30).join(" ") + " …" : doan.join(" ");
}

export type BaiSo = { id: number | string; tieu_de: string; slug: string; xuat_ban: boolean; van_tay: Set<number> };

const phanTram = (x: number) => `${Math.round(x * 100)}%`;

/**
 * Đánh giá trùng lặp → các mục kiểm định nhóm "noi_dung".
 * `khac`: bài khác trong CMS (không gồm chính bài này). `kb`: vân tay kho tri thức theo tệp nguồn.
 * Cộng tác viên trùng ≥ NGUONG.loi → lỗi chặn; ban biên tập chỉ được cảnh báo (tự chịu trách nhiệm khi đăng lại).
 * Bài nháp của người khác không lộ tiêu đề/slug.
 */
export function danhGiaTrung(
  moi: Set<number>, khac: BaiSo[], kb: Map<string, Set<number>>,
  opts: { congTacVien: boolean; van?: string },
): MucKiem[] {
  if (moi.size < IT_NHAT) return [];
  const muc: MucKiem[] = [];
  const xep = (ti_le: number, dat: string, ten: string, loiKhuyen: string, nguon: Set<number>, ma: string) => {
    if (ti_le < NGUONG.canh_bao) {
      muc.push({ ma, nhom: "noi_dung", muc_do: "dat", thong_diep: dat });
      return;
    }
    const nang = ti_le >= NGUONG.loi;
    const doan = opts.van ? doanTrungDaiNhat(opts.van, nguon) : "";
    const chan = nang && opts.congTacVien;
    muc.push({
      ma, nhom: "noi_dung", muc_do: nang && opts.congTacVien ? "loi" : "canh_bao",
      thong_diep: `Trùng ${phanTram(ti_le)} với ${ten}. ${loiKhuyen}` + (doan ? ` Đoạn trùng: "${doan}"` : ""),
      ...(chan ? { chan: true } : {}),
    });
  };

  let top: { ti_le: number; bai: BaiSo | null } = { ti_le: 0, bai: null };
  for (const b of khac) {
    const t = doChua(moi, b.van_tay);
    if (t > top.ti_le) top = { ti_le: t, bai: b };
  }
  const tenBai = top.bai?.xuat_ban ? `bài "${top.bai.tieu_de}" (/blog/${top.bai.slug})` : "một bài nháp khác trong CMS";
  xep(top.ti_le, "Không trùng bài nào khác trong CMS", tenBai,
    "Viết lại bằng trải nghiệm, ví dụ, góc nhìn của chính bạn; cùng chủ đề thì nên sửa bài cũ thay vì tạo bài mới "
    + "(Google bỏ qua trang trùng lặp).", top.bai?.van_tay ?? new Set(), "trung_bai");

  if (kb.size) {
    let tkb = { ti_le: 0, nguon: "", vt: new Set<number>() };
    let gop = new Set<number>();
    for (const [nguon, vt] of kb) {
      const t = doChua(moi, vt);
      if (t > tkb.ti_le) tkb = { ti_le: t, nguon, vt };
      if (t > 0) gop = new Set([...gop, ...vt]);
    }
    // Chép rải từ nhiều tệp KB cũng tính: lấy độ trùng với hợp các tệp có dính.
    const tGop = doChua(moi, gop);
    xep(tGop, "Không chép nguyên văn kho tri thức của site", `kho tri thức của site (nhiều nhất: ${tkb.nguon || "—"})`,
      "Trang kiến thức đã có nội dung này — bài viết nên đi sâu bằng góc nhìn riêng và dẫn link sang trang kiến thức.",
      gop, "trung_kho_tri_thuc");
  }
  return muc;
}

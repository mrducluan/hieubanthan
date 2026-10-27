// BLOG-7 — chuẩn hoá SEO bài blog nhập từ NotFair (chủ dự án 2026-10-26: "audit lại các bài NotFair chuẩn bài SEO, thiếu
// trường nào tự bổ sung; xem lại toàn bộ URL"). Hàm THUẦN, tất định, không AI, không mạng — chạy được bằng `node --test`.
// Chỉ ĐIỀN chỗ trống / sửa chỗ sai luật kiểm định, không viết lại chữ biên tập đã có:
//  · slug → không dấu (NotFair để sót "đ": "…-va-đoc-ho-so…"), ≤ 75 ký tự; slug cũ vào slug_cu → web 308 (giuSlugCu).
//  · tiêu đề SEO 30–60, mô tả SEO 70–160, sapo, "Trả lời nhanh" 40–80 chữ — lấy từ chính câu chữ của bài.
//  · từ khoá chính / phụ (từ thẻ + tiêu đề), mảng (luật từ khoá như web lib/blog-mang.ts), loại bài "Hướng dẫn".
//  · Hỏi đáp: tách từ tiêu đề mục dạng câu hỏi + đoạn trả lời ngay dưới (≤ 6).
//  · Kiểu bỏ dấu thống nhất "hoà, thuỷ" (site dùng) — trừ chữ gắn link (đối tác NotFair kiểm chữ gắn link).
//  · Liên kết nội bộ + lối tới công cụ của mảng khi bài thiếu (đoạn cuối bài, lời mời không doạ).
// Ảnh (bìa nền sáng, ảnh "Tóm tắt nhanh") do chuan-hoa-notfair.ts vẽ + tải lên; ở đây chỉ báo cần gì và chèn nút ảnh.
import { boDau, docLexical, slugViet } from "../kiem-dinh/kiem-dinh.ts";
import { htmlSangKhoi, type NutLexical } from "./html-lexical.ts";

export type MangCms = "than_so" | "tu_vi" | "bat_tu" | "kinh_dich" | "phong_thuy" | "chung";

export type BaiChuanHoa = {
  tieu_de?: string | null; slug?: string | null; mo_ta_ngan?: string | null; tra_loi_nhanh?: string | null;
  noi_dung?: unknown; meta?: { title?: string | null; description?: string | null; image?: unknown } | null;
  anh_bia?: unknown; hoi_dap?: { cau_hoi?: string | null; tra_loi?: string | null }[] | null;
  tu_khoa_chinh?: string | null; tu_khoa_phu?: string[] | null; the?: string[] | null; mang?: string | null; loai_bai?: string | null;
};

export type KetQuaChuanHoa = {
  /** Trường cần ghi (chỉ trường đổi). */
  data: Record<string, unknown>;
  /** Mô tả từng thay đổi (ghi vào "Ghi chú của Chủ biên" để người duyệt đọc). */
  thay_doi: string[];
  /** Mảng sau chuẩn hoá (dùng chọn hoạ tiết ảnh). */
  mang: MangCms;
  /** Tiêu đề các mục H2 (ảnh "Tóm tắt nhanh"). */
  muc: string[];
};

// ------------------------------------------------------------------ chữ

const chuoi = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const demTu = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Slug chuẩn của site: không dấu, chữ thường, gạch ngang, ≤ 75 ký tự (cắt ở ranh giới từ). Giống web lib/blog-gop.ts. */
export function slugChuan(s: string): string {
  const d = slugViet(s.normalize("NFC"));
  if (d.length <= 75) return d;
  const c = d.slice(0, 76);
  return c.slice(0, c.lastIndexOf("-") > 0 ? c.lastIndexOf("-") : 75);
}

/** Tách câu (giữ dấu câu). */
export function tachCau(s: string): string[] {
  return (chuoi(s).match(/[^.!?…]+[.!?…]+["”»)]*|[^.!?…]+$/g) ?? []).map((c) => c.trim()).filter(Boolean);
}

/** Lấy các câu đầu sao cho độ dài (ký tự) trong [min, max]; câu đầu quá dài thì cắt ở ranh giới từ. */
export function catTheoCau(s: string, min: number, max: number): string {
  let kq = "";
  for (const c of tachCau(s)) {
    const moi = kq ? `${kq} ${c}` : c;
    if (moi.length > max) break;
    kq = moi;
    if (kq.length >= min) break;
  }
  if (kq.length >= Math.min(min, 40)) return kq;
  const t = chuoi(s);
  if (t.length <= max) return t;
  const cat = t.slice(0, max - 1);
  return `${cat.slice(0, cat.lastIndexOf(" ")).replace(/[,;:\-–—]+$/, "")}…`;
}

// Từ nối — cắt tiêu đề dài ở TRƯỚC các từ này để vế còn lại trọn nghĩa ("… và đọc hồ sơ | cho người mới bắt đầu").
const TU_NOI = /\s(cho|để|của|với|khi|trong|theo|từ|mà|và|hay|hoặc|giúp|dành)\s/giu;

/** Tiêu đề SEO 30–60 ký tự từ tiêu đề bài, GIỮ vế đầu (thường chứa từ khoá): giữ nguyên nếu vừa; bỏ phần trong ngoặc;
 *  lấy vế trước ":" / "—" / "|" nếu vừa; còn dài thì cắt trước từ nối gần mốc 60 nhất; cuối cùng cắt ở ranh giới từ. */
export function tieuDeSeo(t: string): string {
  const s = chuoi(t);
  if (s.length <= 60) return s;
  const a = s.replace(/\s*\([^)]*\)/g, "").replace(/\s+([:,])/g, "$1").trim();
  if (a.length <= 60 && a.length >= 30) return a;
  const dau = a.split(/\s*[:|—–]\s+|\s+-\s+/)[0] ?? "";
  if (dau.length >= 30 && dau.length <= 60) return dau;
  let cat = "";
  for (const m of a.matchAll(TU_NOI)) if (m.index! <= 60 && m.index! >= 30) cat = a.slice(0, m.index);
  if (cat) return cat.replace(/[,;:\-–—]+$/, "").trim();
  const c = a.slice(0, 61);
  return c.slice(0, c.lastIndexOf(" ")).replace(/[,;:\-–—(]+$/, "").trim();
}

// Kiểu bỏ dấu cũ → mới ở âm tiết mở oa/oe/uy (hòa→hoà, khỏe→khoẻ, thủy→thuỷ); "qu" giữ nguyên (quý chuẩn cả hai kiểu).
const DOI_DAU: Record<string, string> = {
  "òa": "oà", "óa": "oá", "ỏa": "oả", "õa": "oã", "ọa": "oạ", "òe": "oè", "óe": "oé", "ỏe": "oẻ", "õe": "oẽ", "ọe": "oẹ",
  "ùy": "uỳ", "úy": "uý", "ủy": "uỷ", "ũy": "uỹ", "ụy": "uỵ",
};
export function kieuDauMoi(s: string): string {
  return s.normalize("NFC").replace(/\p{L}+/gu, (tu) => {
    const m = tu.match(/([òóỏõọ][ae]|[ùúủũụ]y)$/iu);
    if (!m) return tu;
    if (/^[ùúủũụ]/iu.test(m[1]!) && /q$/iu.test(tu.slice(0, -2))) return tu;   // "qúy" (hiếm) giữ nguyên
    const moi = DOI_DAU[m[1]!.toLowerCase()];
    if (!moi) return tu;
    const viet = [...moi].map((c, i) => (m[1]![i] !== m[1]![i]!.toLowerCase() ? c.toUpperCase() : c)).join("");
    return tu.slice(0, -2) + viet;
  });
}

// ------------------------------------------------------------------ mảng (luật từ khoá — cùng bảng với web lib/blog-mang.ts)

const TU_KHOA: Record<Exclude<MangCms, "chung">, [string, number][]> = {
  than_so: [["than so hoc", 3], ["than so", 3], ["numerology", 3], ["so chu dao", 3], ["duong doi", 2], ["so linh hon", 2], ["so su menh", 2],
    ["pitago", 2], ["pythagoras", 2], ["chaldea", 2], ["con so", 1], ["bieu do ngay sinh", 2], ["nam ca nhan", 2], ["no nghiep", 2]],
  tu_vi: [["tu vi dau so", 3], ["tu vi", 3], ["la so", 2], ["chinh tinh", 2], ["tu hoa", 2], ["dai han", 2], ["cung menh", 2], ["luu nien", 1],
    ["astrology", 2], ["chiem tinh", 2], ["cung hoang dao", 2], ["horoscope", 2], ["ban do sao", 1]],
  bat_tu: [["bat tu", 3], ["tu tru", 3], ["bazi", 3], ["nhat chu", 2], ["thap than", 2], ["dung than", 2], ["dai van", 1], ["can chi", 1], ["menh gi", 1]],
  kinh_dich: [["kinh dich", 3], ["i ching", 3], ["gieo que", 3], ["mai hoa", 2], ["luc hao", 2], ["64 que", 2], ["que dich", 2], ["hao dong", 2]],
  phong_thuy: [["phong thuy", 3], ["feng shui", 3], ["bat trach", 2], ["huyen khong", 2], ["phi tinh", 2], ["huong nha", 2], ["huong ban", 1],
    ["la ban", 1], ["cung phi", 2], ["ban tho", 1], ["phong ngu", 1], ["phong bep", 1], ["nha o", 1]],
};

export function doanMang(van: string): MangCms {
  const v = ` ${boDau(van).replace(/[^a-z0-9]+/g, " ")} `;
  let tot: MangCms = "chung", diemTot = 0;
  for (const [m, ds] of Object.entries(TU_KHOA) as [MangCms, [string, number][]][]) {
    const diem = ds.reduce((s, [tu, w]) => s + (v.split(` ${tu} `).length - 1) * w, 0);
    if (diem > diemTot) { tot = m; diemTot = diem; }
  }
  return tot;
}

/** Công cụ + trang kiến thức của từng mảng (đường dẫn silo QH-URL). */
export const LOI_MANG: Record<MangCms, { cong_cu: string; ten_cong_cu: string; kien_thuc: string; ten_kien_thuc: string }> = {
  than_so: { cong_cu: "/than-so", ten_cong_cu: "xem 4 con số cốt lõi của bạn", kien_thuc: "/than-so/y-nghia-so", ten_kien_thuc: "ý nghĩa từng con số" },
  tu_vi: { cong_cu: "/tu-vi", ten_cong_cu: "lập lá số Tử vi của bạn", kien_thuc: "/tu-vi/chinh-tinh", ten_kien_thuc: "14 chính tinh" },
  bat_tu: { cong_cu: "/bat-tu", ten_cong_cu: "xem tứ trụ Bát tự của bạn", kien_thuc: "/bat-tu/nhat-chu", ten_kien_thuc: "10 nhật chủ" },
  kinh_dich: { cong_cu: "/kinh-dich", ten_cong_cu: "gieo một quẻ cho việc đang băn khoăn", kien_thuc: "/kinh-dich/que", ten_kien_thuc: "64 quẻ Kinh Dịch" },
  phong_thuy: { cong_cu: "/phong-thuy", ten_cong_cu: "xem hướng nhà hợp tuổi bạn", kien_thuc: "/phong-thuy/huong-hop-tuoi", ten_kien_thuc: "hướng hợp từng tuổi" },
  chung: { cong_cu: "/than-so", ten_cong_cu: "xem 4 con số cốt lõi của bạn", kien_thuc: "/kien-thuc", ten_kien_thuc: "thư viện kiến thức" },
};

const CONG_CU = /^(https?:\/\/(www\.)?hieuban\.com)?\/(than-so|tu-vi|bat-tu|kinh-dich|phong-thuy|hop-doi|hom-nay)(\/|$|\?)/;
const CAU_HOI = /\?\s*$/;
const LA_HUONG_DAN = /^(cách|hướng dẫn|làm sao|làm thế nào)\b|\b(cách (tính|xem|đọc|gieo|lập|chọn|đặt|bố trí)|từng bước)\b/iu;

// ------------------------------------------------------------------ Lexical

type Nut = NutLexical & { children?: Nut[]; text?: string; tag?: string };

const chuNut = (n: Nut): string =>
  n.type === "text" ? String(n.text ?? "") : n.type === "linebreak" ? " " : (n.children ?? []).map(chuNut).join("");

/** Đổi kiểu dấu trong mọi nút chữ, TRỪ chữ nằm trong link (đối tác trao đổi kiểm chữ gắn link). */
function doiDauCay(n: Nut, trongLink = false): { nut: Nut; doi: number } {
  if (n.type === "text" && typeof n.text === "string" && !trongLink) {
    const moi = kieuDauMoi(n.text);
    return { nut: moi === n.text ? n : { ...n, text: moi }, doi: moi === n.text ? 0 : 1 };
  }
  if (!Array.isArray(n.children)) return { nut: n, doi: 0 };
  let doi = 0;
  const link = trongLink || n.type === "link" || n.type === "autolink";
  const children = n.children.map((c) => { const r = doiDauCay(c, link); doi += r.doi; return r.nut; });
  return { nut: doi ? { ...n, children } : n, doi };
}

/** Hỏi đáp từ thân bài: tiêu đề mục kết thúc "?" + các đoạn ngay dưới (tới tiêu đề kế), trả lời ≤ 1200 ký tự. */
export function hoiDapTuThanBai(khoi: Nut[]): { cau_hoi: string; tra_loi: string }[] {
  const kq: { cau_hoi: string; tra_loi: string }[] = [];
  for (let i = 0; i < khoi.length; i++) {
    const k = khoi[i]!;
    if (k.type !== "heading") continue;
    const hoi = chuoi(chuNut(k));
    if (!CAU_HOI.test(hoi) || hoi.length > 200) continue;
    const doan: string[] = [];
    for (let j = i + 1; j < khoi.length && khoi[j]!.type !== "heading"; j++) {
      const t = chuoi(chuNut(khoi[j]!));
      if (t && (khoi[j]!.type === "paragraph" || khoi[j]!.type === "list" || khoi[j]!.type === "quote")) doan.push(t);
    }
    const traLoi = catTheoCau(doan.join(" "), 160, 1200);
    if (traLoi.length >= 40) kq.push({ cau_hoi: hoi, tra_loi: traLoi });
  }
  return kq;
}

const nutAnh = (id: number | string): Nut => ({
  type: "upload", relationTo: "media", value: id, fields: null, format: "", version: 3,
  id: `bl7${String(id)}`.replace(/[^a-z0-9]/gi, "").padEnd(12, "0").slice(0, 24),
});

// ------------------------------------------------------------------ chuẩn hoá

export type TuyChon = {
  /** id ảnh "Tóm tắt nhanh" đã tải lên → chèn sau đoạn mở đầu (null = không chèn). */
  anhTomTat?: number | string | null;
  /** id ảnh bìa mới (nền sáng) → anh_bia + meta.image. */
  anhBia?: number | string | null;
  /** slug đã có ở bài khác → thêm hậu tố. */
  slugDaDung?: (slug: string) => boolean;
};

export function chuanHoaBai(bai: BaiChuanHoa, tc: TuyChon = {}): KetQuaChuanHoa {
  const data: Record<string, unknown> = {};
  const thay: string[] = [];
  const tieuDe = chuoi(bai.tieu_de);
  const goc = (bai.noi_dung && typeof bai.noi_dung === "object" ? (bai.noi_dung as { root?: Nut }).root : null) ?? null;
  let khoi: Nut[] = Array.isArray(goc?.children) ? [...goc!.children] : [];
  let doiThan = false;

  // ---- kiểu bỏ dấu trong thân bài (trước khi đọc đoạn văn để sapo/trả lời nhanh dùng chữ đã thống nhất)
  let soNutDoi = 0;
  khoi = khoi.map((k) => { const r = doiDauCay(k); soNutDoi += r.doi; return r.nut; });
  if (soNutDoi) { doiThan = true; thay.push(`Thống nhất kiểu bỏ dấu "hoà, thuỷ" ở ${soNutDoi} đoạn chữ (chữ gắn link giữ nguyên).`); }

  const doc = docLexical({ root: { ...goc, children: khoi } });
  const doanDau = khoi.filter((k) => k.type === "paragraph").map((k) => chuoi(chuNut(k))).filter((t) => t.length >= 40);
  const moDau = doanDau.slice(0, 2).join(" ");
  const muc = doc.tieuDe.filter((h) => h.tag === "h2").map((h) => h.text).filter(Boolean);

  // ---- slug
  const slug = chuoi(bai.slug);
  let slugMoi = slug && (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 75) ? slugChuan(slug) : slug;
  if (!slugMoi && tieuDe) slugMoi = slugChuan(tieuDe);
  if (slugMoi && slugMoi !== slug) {
    let s = slugMoi, n = 2;
    while (tc.slugDaDung?.(s)) s = `${slugMoi.slice(0, 72)}-${n++}`;
    data.slug = s;
    thay.push(`Đường dẫn /blog/${slug || "(trống)"} → /blog/${s} (không dấu, chuẩn SEO; đường dẫn cũ tự chuyển 308 khi xuất bản).`);
  }

  // ---- tiêu đề + mô tả SEO
  const meta = { ...(bai.meta ?? {}) } as Record<string, unknown>;
  let doiMeta = false;
  const mt = chuoi(meta.title);
  if (tieuDe && (!mt || mt.length > 60 || mt.length < 30)) {
    const moi = tieuDeSeo(mt.length > 60 ? mt : tieuDe);
    if (moi && moi !== mt && moi.length >= 20) { meta.title = moi; doiMeta = true; thay.push(`Tiêu đề SEO: "${moi}" (${moi.length} ký tự).`); }
  }
  const md = chuoi(meta.description);
  const sapo = chuoi(bai.mo_ta_ngan);
  if (!md || md.length < 70 || md.length > 160) {
    const nguon = [md, sapo, moDau].find((s) => s.length >= 70) ?? moDau;
    const moi = nguon ? catTheoCau(kieuDauMoi(nguon), 110, 158) : "";
    if (moi && moi !== md && moi.length >= 50) { meta.description = moi; doiMeta = true; thay.push(`Mô tả SEO (${moi.length} ký tự) lấy từ câu mở đầu của bài.`); }
  }
  if (tc.anhBia != null) { meta.image = tc.anhBia; doiMeta = true; }
  else if (!meta.image && bai.anh_bia) { meta.image = bai.anh_bia; doiMeta = true; thay.push("Ảnh chia sẻ mạng xã hội = ảnh bìa."); }
  if (doiMeta) data.meta = meta;

  if (tc.anhBia != null) { data.anh_bia = tc.anhBia; thay.push("Ảnh bìa mới nền sáng (nổi trên nền tối của site), kèm tiêu đề bài."); }

  if (!sapo) {
    const moi = catTheoCau(kieuDauMoi(moDau || chuoi(meta.description)), 120, 280);
    if (moi) { data.mo_ta_ngan = moi; thay.push("Sapo (mô tả ngắn) lấy từ đoạn mở đầu."); }
  }

  // ---- Trả lời nhanh 40–80 chữ (AI hay trích)
  const tln = chuoi(bai.tra_loi_nhanh);
  if (!tln || demTu(tln) < 25 || demTu(tln) > 90) {
    let moi = "";
    for (const c of tachCau(moDau)) {
      const thu = moi ? `${moi} ${c}` : c;
      if (demTu(thu) > 85) break;
      moi = thu;
      if (demTu(moi) >= 40) break;
    }
    if (demTu(moi) >= 25 && moi !== tln) { data.tra_loi_nhanh = moi.slice(0, 700); thay.push(`"Trả lời nhanh" ${demTu(moi)} chữ từ đoạn mở đầu.`); }
  }

  // ---- từ khoá
  const the = (bai.the ?? []).map(chuoi).filter(Boolean);
  const tk = chuoi(bai.tu_khoa_chinh);
  if (!tk) {
    const trongTieuDe = the.find((t) => boDau(tieuDe).includes(boDau(t)) && demTu(t) <= 6);
    const veDau = tieuDe.split(/\s*[:|—–(]\s*|\s+-\s+/)[0] ?? "";
    const moi = (trongTieuDe ?? (demTu(veDau) <= 6 && veDau.length >= 6 ? veDau : the[0] ?? "")).toLowerCase().slice(0, 80);
    if (moi) { data.tu_khoa_chinh = moi; thay.push(`Từ khoá chính: "${moi}".`); }
  }
  if (!(bai.tu_khoa_phu ?? []).length && the.length) {
    const chinh = boDau(String(data.tu_khoa_chinh ?? tk));
    const phu = the.filter((t) => boDau(t) !== chinh).slice(0, 10);
    if (phu.length) { data.tu_khoa_phu = phu; thay.push(`Từ khoá phụ: ${phu.join(", ")}.`); }
  }

  // ---- mảng + loại bài
  const mangCu = (bai.mang ?? "chung") as MangCms;
  let mang = mangCu;
  if (mangCu === "chung") {
    const doan = doanMang([tieuDe, tieuDe, slug.replace(/-/g, " "), ...the, chuoi(meta.description)].join(" "));
    if (doan !== "chung") { mang = doan; data.mang = doan; thay.push(`Mảng: ${doan} (theo từ khoá tiêu đề, thẻ).`); }
  }
  if ((bai.loai_bai ?? "bai_viet") === "bai_viet" && LA_HUONG_DAN.test(tieuDe)) {
    data.loai_bai = "huong_dan"; thay.push("Loại bài: Hướng dẫn (schema Article).");
  }

  // ---- Hỏi đáp
  const coSan = (bai.hoi_dap ?? []).filter((h) => chuoi(h?.cau_hoi) && chuoi(h?.tra_loi));
  if (coSan.length < 3) {
    const daCo = new Set(coSan.map((h) => boDau(chuoi(h.cau_hoi))));
    const them = hoiDapTuThanBai(khoi).filter((h) => !daCo.has(boDau(h.cau_hoi))).slice(0, 6 - coSan.length);
    if (them.length) {
      data.hoi_dap = [...coSan.map((h) => ({ cau_hoi: chuoi(h.cau_hoi), tra_loi: chuoi(h.tra_loi) })), ...them];
      thay.push(`Hỏi đáp: thêm ${them.length} câu từ các mục dạng câu hỏi trong bài (FAQPage).`);
    }
  }

  // ---- ảnh "Tóm tắt nhanh" sau đoạn mở đầu
  if (tc.anhTomTat != null) {
    const viTri = khoi.findIndex((k) => k.type === "paragraph" && chuoi(chuNut(k)).length >= 40);
    khoi.splice(viTri >= 0 ? viTri + 1 : 0, 0, nutAnh(tc.anhTomTat));
    doiThan = true;
    thay.push(`Chèn ảnh "Tóm tắt nhanh" (${Math.min(5, muc.length)} ý, nền sáng) sau đoạn mở đầu.`);
  }

  // ---- liên kết nội bộ + lối tới công cụ
  const coCongCu = doc.lienKetTrong.some((u) => CONG_CU.test(u));
  if (!coCongCu || doc.lienKetTrong.length < 2) {
    const l = LOI_MANG[mang];
    const html = `<p>Muốn áp vào chính mình? Bạn có thể <a href="${l.cong_cu}">${l.ten_cong_cu}</a> miễn phí trên Hiểu Bản Thân, `
      + `hoặc đọc thêm <a href="${l.kien_thuc}">${l.ten_kien_thuc}</a> để hiểu kỹ từng phần.</p>`;
    khoi.push(...(htmlSangKhoi(html) as Nut[]));
    doiThan = true;
    thay.push(`Thêm đoạn cuối bài có 2 liên kết nội bộ: ${l.cong_cu}, ${l.kien_thuc}.`);
  }

  if (doiThan) data.noi_dung = { root: { type: "root", direction: "ltr", format: "", indent: 0, version: 1, ...(goc ?? {}), children: khoi } };
  return { data, thay_doi: thay, mang, muc };
}

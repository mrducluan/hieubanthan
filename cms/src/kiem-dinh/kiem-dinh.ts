// Kiểm định bài viết CMS: SEO · AI SEO/GEO · E-E-A-T · ranh giới nội dung.
// Luật cố định, KHÔNG gọi AI. Dùng ở hai nơi: khung "Kiểm định" trong trình soạn (chạy ngay khi gõ)
// và hook máy chủ trước khi lưu (lưu điểm, CHẶN xuất bản khi có lỗi chặn).
// Lỗi chặn chỉ gồm thứ không được phép lên trang: vùng cấm, thông tin liên hệ, tên nội bộ (BM-1),
// chữ ký E-E-A-T sai (EEAT-1). Mọi thứ khác chỉ là gợi ý và trừ điểm.
// File không import gì, để chạy được cả trong trình duyệt lẫn `node --test`.

export type BaiKiem = {
  tieu_de?: string | null;
  slug?: string | null;
  tu_khoa_chinh?: string | null;
  mo_ta_ngan?: string | null;
  tra_loi_nhanh?: string | null;
  noi_dung?: unknown;
  meta?: { title?: string | null; description?: string | null; image?: unknown } | null;
  anh_bia?: unknown;
  hoi_dap?: { cau_hoi?: string | null; tra_loi?: string | null }[] | null;
  nguon?: { ten?: string | null; url?: string | null }[] | null;
  ky_ten?: "ban_bien_tap" | "tac_gia" | "tham_dinh" | string | null;
  tac_gia?: unknown;
  nguoi_tham_dinh?: unknown;
  ngay_tham_dinh?: string | null;
  xac_nhan_tham_dinh?: boolean | null;
};

export type MucDo = "dat" | "canh_bao" | "loi";
export type Nhom = "seo" | "geo" | "eeat" | "noi_dung";
export type MucKiem = { ma: string; nhom: Nhom; muc_do: MucDo; thong_diep: string; chan?: boolean };
export type KetQuaKiem = { diem: number; muc: MucKiem[]; loi_chan: MucKiem[] };

export const TEN_NHOM: Record<Nhom, string> = {
  seo: "SEO", geo: "AI SEO / GEO", eeat: "E-E-A-T", noi_dung: "Ranh giới nội dung",
};

// ------------------------------------------------------------------ chữ

/** Bỏ hết dấu (kể cả đ) và viết thường. Dùng cho từ khoá và slug. */
export function boDau(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
}

/** Slug tiếng Việt: "Số chủ đạo 7: Tính cách" → "so-chu-dao-7-tinh-cach". Tối đa 80 ký tự, cắt ở ranh giới từ. */
export function slugViet(s: string): string {
  const day = boDau(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (day.length <= 80) return day;
  const cat = day.slice(0, 81);
  return cat.slice(0, cat.lastIndexOf("-") > 0 ? cat.lastIndexOf("-") : 80);
}

// Chuẩn hoá dấu kiểu cũ/mới (hoá ↔ hóa) mà KHÔNG bỏ hết dấu (để "bùa" không trùng "bữa") — như engine tham_dinh._DAU.
const DAU_CU_MOI: Record<string, string> = {
  ó: "o", ò: "o", ỏ: "o", õ: "o", ọ: "o", á: "a", à: "a", ả: "a", ã: "a", ạ: "a", ú: "u", ù: "u", ủ: "u", ũ: "u",
  ụ: "u", ý: "y", ỳ: "y", ỷ: "y", ỹ: "y", ỵ: "y", é: "e", è: "e", ẻ: "e", ẽ: "e", ẹ: "e",
};
const chuanCum = (s: string) => s.normalize("NFC").toLowerCase().replace(/[óòỏõọáàảãạúùủũụýỳỷỹỵéèẻẽẹ]/g, (c) => DAU_CU_MOI[c] ?? c);

const chuoi = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const mang = <T>(v: unknown): T[] =>
  (Array.isArray(v) ? (v as T[]).filter((x) => x && typeof x === "object") : []);

const demTu = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// ------------------------------------------------------------------ đọc cây Lexical

export type DocLexical = {
  van: string; soTu: number; doanDau: string;
  tieuDe: { tag: string; text: string }[];
  lienKetTrong: string[]; lienKetNgoai: string[];
  anh: number; anhThieuAlt: number; danhSach: number; bang: number;
  doanDaiNhat: number;
};

const NOI_BO = /^https?:\/\/(www\.)?hieuban\.com(\/|$)/i;

type Nut = { type?: string; text?: string; tag?: string; children?: unknown; fields?: Record<string, unknown>; value?: unknown };

export function docLexical(nd: unknown): DocLexical {
  const kq: DocLexical = {
    van: "", soTu: 0, doanDau: "", tieuDe: [], lienKetTrong: [], lienKetNgoai: [],
    anh: 0, anhThieuAlt: 0, danhSach: 0, bang: 0, doanDaiNhat: 0,
  };
  const root = nd && typeof nd === "object" ? (nd as { root?: unknown }).root : null;
  if (!root || typeof root !== "object") return kq;
  const khoi: string[] = [];

  const chuCua = (n: Nut): string => {
    if (n.type === "text" && typeof n.text === "string") return n.text;
    if (n.type === "linebreak") return " ";
    return Array.isArray(n.children) ? (n.children as Nut[]).map(chuCua).join("") : "";
  };
  const duyet = (n: Nut) => {
    if (!n || typeof n !== "object") return;
    switch (n.type) {
      case "heading": {
        const t = chuCua(n).trim();
        kq.tieuDe.push({ tag: String(n.tag ?? "h2"), text: t });
        khoi.push(t);
        return;
      }
      case "paragraph": case "quote": case "listitem": {
        const t = chuCua(n).trim();
        if (t) {
          khoi.push(t);
          if (n.type === "paragraph") {
            if (!kq.doanDau) kq.doanDau = t;
            kq.doanDaiNhat = Math.max(kq.doanDaiNhat, demTu(t));
          }
        }
        break;   // vẫn duyệt con để bắt link / danh sách lồng
      }
      case "list": kq.danhSach++; break;
      case "table": kq.bang++; break;
      case "link": case "autolink": {
        const f = n.fields ?? {};
        const url = typeof f.url === "string" ? f.url.trim() : "";
        if (f.linkType === "internal" || (url.startsWith("/") && !url.startsWith("//")) || NOI_BO.test(url)) {
          kq.lienKetTrong.push(url || "(nội bộ)");
        } else if (url) kq.lienKetNgoai.push(url);
        break;
      }
      case "upload": {
        kq.anh++;
        const altTruong = typeof n.fields?.alt === "string" ? n.fields.alt.trim() : "";
        const v = n.value;
        // value chỉ là id → không biết alt của ảnh gốc (Media bắt buộc alt) → không tính là thiếu.
        const altAnh = v && typeof v === "object" && typeof (v as { alt?: unknown }).alt === "string"
          ? ((v as { alt: string }).alt).trim() : v && typeof v === "object" ? "" : "?";
        if (!altTruong && !altAnh) kq.anhThieuAlt++;
        return;
      }
    }
    if (Array.isArray(n.children)) (n.children as Nut[]).forEach(duyet);
  };
  duyet(root as Nut);
  kq.van = khoi.join("\n");
  kq.soTu = demTu(kq.van);
  return kq;
}

// ------------------------------------------------------------------ luật nội dung

// Lỗi chặn: nội dung gây hại hoặc ngoài phạm vi sản phẩm (CLAUDE.md "Cấm" + engine tham_dinh._CAM_GOC_NHIN).
const CAM_CHAN = ["chết sớm", "sẽ chết", "chết yểu", "khắc chết", "chữa bệnh", "chữa khỏi", "xổ số", "lô đề", "số đề",
  "trúng số", "bùa", "cúng sao", "dâng sao", "mua vật phẩm"];
// Nhạy cảm: có thể hợp lệ khi bài GIẢI THÍCH vì sao không làm → chỉ cảnh báo để người biên tập đọc lại.
const NHAY_CAM = ["giải hạn", "hoá giải", "vật phẩm", "tai nạn", "phá sản", "lời nguyền", "ly hôn", "bệnh"];
const GIONG_PHAN = ["chắc chắn sẽ", "định mệnh", "số phận đã", "không thể tránh", "tiền định", "100%"];
// BM-1: trang công khai không nêu thư viện, bộ đối chiếu, nhà cung cấp hạ tầng.
const TEN_NOI_BO = [/\b(iztro|lasotuvi|lunar[- ]?typescript|lunar-lite|horosa|mingyu|aov\.cc|openrouter|supabase|vercel|anko-ki-maya|tuvimcp|opencode-tianji|ctext\.org|posthog|sentry)\b/i,
  /\bRender\b/];
const LIEN_HE_CHU = /\b\d[\d .]{8,}\d\b|[\w.+-]+@[\w-]+\.[\w.]+|\bzalo\b|\bhotline\b/i;
const CONG_CU = /^(https?:\/\/(www\.)?hieuban\.com)?\/(than-so|tu-vi|bat-tu|kinh-dich|phong-thuy|hop-doi|hom-nay)(\/|$|\?)/;
const CAU_HOI = /\?\s*$|là gì|thế nào|như nào|tại sao|vì sao|bao nhiêu|có nên|ở đâu|khi nào|ra sao|có phải/i;

const timCum = (van: string, ds: string[]) => {
  const v = chuanCum(van);
  return ds.filter((c) => v.includes(chuanCum(c)));
};

// ------------------------------------------------------------------ kiểm định

const TRONG_SO: Record<string, number> = {
  tieu_de: 3, meta_title: 2, meta_description: 3, slug: 2, tu_khoa: 2, tu_khoa_tieu_de: 2, tu_khoa_mo_ta: 1,
  tu_khoa_doan_dau: 2, tu_khoa_h2: 1, mat_do_tu_khoa: 1, do_dai: 3, tieu_de_phu: 2, h1_than_bai: 1,
  thu_tu_tieu_de: 1, lien_ket_noi_bo: 2, cta_cong_cu: 1, anh_bia: 2, alt_anh: 2, doan_dai: 1,
  tra_loi_nhanh: 3, hoi_dap: 3, tieu_de_cau_hoi: 1, nguon: 2, cau_truc: 1, dinh_nghia: 1,
  ky_ten: 1, chuyen_gia: 1,
};
const HE_SO: Record<MucDo, number> = { dat: 1, canh_bao: 0.3, loi: 0 };

export function kiemDinhBai(bai: BaiKiem): KetQuaKiem {
  const muc: MucKiem[] = [];
  const them = (ma: string, nhom: Nhom, muc_do: MucDo, thong_diep: string, chan = false) =>
    muc.push({ ma, nhom, muc_do, thong_diep, ...(chan ? { chan: true } : {}) });

  // Dữ liệu đến từ form đang gõ dở → mọi trường có thể sai kiểu; ép về chuỗi/mảng an toàn.
  const meta = bai.meta && typeof bai.meta === "object" ? bai.meta : {};
  const tieuDe = chuoi(bai.tieu_de);
  const metaTitle = chuoi(meta.title) || tieuDe;
  const moTa = chuoi(meta.description) || chuoi(bai.mo_ta_ngan);
  const slug = chuoi(bai.slug);
  const tk = chuoi(bai.tu_khoa_chinh);
  const tkK = boDau(tk);
  const d = docLexical(bai.noi_dung);
  const hoiDap = mang<{ cau_hoi?: unknown; tra_loi?: unknown }>(bai.hoi_dap).filter((h) => chuoi(h?.cau_hoi) && chuoi(h?.tra_loi));
  const nguon = mang<{ ten?: unknown }>(bai.nguon).filter((n) => chuoi(n?.ten));
  const tln = chuoi(bai.tra_loi_nhanh);

  // ---------------- SEO
  if (!tieuDe) them("tieu_de", "seo", "loi", "Chưa có tiêu đề bài (H1).");
  else if (tieuDe.length < 20 || tieuDe.length > 70)
    them("tieu_de", "seo", "canh_bao", `Tiêu đề ${tieuDe.length} ký tự — nên 20–70 để vừa kết quả tìm kiếm.`);
  else them("tieu_de", "seo", "dat", `Tiêu đề ${tieuDe.length} ký tự.`);

  if (!metaTitle) them("meta_title", "seo", "loi", "Chưa có tiêu đề SEO.");
  else if (metaTitle.length > 60 || metaTitle.length < 30)
    them("meta_title", "seo", "canh_bao", `Tiêu đề SEO ${metaTitle.length} ký tự — nên 30–60 (Google cắt khoảng 60).`);
  else them("meta_title", "seo", "dat", `Tiêu đề SEO ${metaTitle.length} ký tự.`);

  if (!moTa) them("meta_description", "seo", "canh_bao", "Chưa có mô tả SEO (meta description) — Google sẽ tự cắt một đoạn.");
  else if (moTa.length < 70 || moTa.length > 160)
    them("meta_description", "seo", "canh_bao", `Mô tả SEO ${moTa.length} ký tự — nên 70–160.`);
  else them("meta_description", "seo", "dat", `Mô tả SEO ${moTa.length} ký tự.`);

  if (!slug) them("slug", "seo", "canh_bao", "Chưa có đường dẫn (slug).");
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 75)
    them("slug", "seo", "canh_bao", "Đường dẫn nên viết thường, không dấu, nối bằng gạch ngang, dưới 75 ký tự.");
  else them("slug", "seo", "dat", `Đường dẫn /blog/${slug}`);

  if (!tk) them("tu_khoa", "seo", "canh_bao", "Chưa đặt từ khoá chính — đặt để kiểm tiêu đề, mô tả, đoạn mở đầu.");
  else {
    them("tu_khoa", "seo", "dat", `Từ khoá chính: "${tk}".`);
    const co = (s: string) => boDau(s).includes(tkK);
    them("tu_khoa_tieu_de", "seo", co(tieuDe) || co(metaTitle) ? "dat" : "canh_bao",
      co(tieuDe) || co(metaTitle) ? "Từ khoá có trong tiêu đề." : "Từ khoá chưa có trong tiêu đề.");
    them("tu_khoa_mo_ta", "seo", moTa && co(moTa) ? "dat" : "canh_bao",
      moTa && co(moTa) ? "Từ khoá có trong mô tả SEO." : "Từ khoá chưa có trong mô tả SEO.");
    const dau120 = d.van.split(/\s+/).slice(0, 120).join(" ");
    them("tu_khoa_doan_dau", "seo", co(dau120) ? "dat" : "canh_bao",
      co(dau120) ? "Từ khoá xuất hiện ngay đoạn mở đầu." : "Nhắc từ khoá trong khoảng 100 chữ đầu.");
    const h2 = d.tieuDe.filter((h) => h.tag === "h2" || h.tag === "h3");
    them("tu_khoa_h2", "seo", h2.some((h) => co(h.text)) ? "dat" : "canh_bao",
      h2.some((h) => co(h.text)) ? "Từ khoá có trong một tiêu đề phụ." : "Đưa từ khoá (hoặc biến thể) vào ít nhất một H2/H3.");
    if (d.soTu > 0) {
      const lan = boDau(d.van).split(tkK).length - 1;
      const matDo = (lan * Math.max(1, demTu(tk))) / d.soTu;
      them("mat_do_tu_khoa", "seo", matDo > 0.03 ? "canh_bao" : "dat",
        matDo > 0.03 ? `Từ khoá lặp quá dày (${(matDo * 100).toFixed(1)}%) — viết tự nhiên, dùng từ đồng nghĩa.`
          : `Mật độ từ khoá ${(matDo * 100).toFixed(1)}%.`);
    }
  }

  if (d.soTu === 0) them("do_dai", "seo", "loi", "Thân bài đang trống.");
  else if (d.soTu < 600)
    them("do_dai", "seo", "canh_bao", `Bài ${d.soTu} chữ — bài hướng dẫn nên từ 600 chữ để trả lời đủ ý.`);
  else them("do_dai", "seo", "dat", `Bài ${d.soTu} chữ.`);

  if (d.soTu > 0) {
    const soH2 = d.tieuDe.filter((h) => h.tag === "h2").length;
    them("tieu_de_phu", "seo", d.soTu >= 500 && soH2 < 2 ? "canh_bao" : "dat",
      d.soTu >= 500 && soH2 < 2 ? "Chia bài bằng ít nhất 2 tiêu đề H2 (mục lục, AI trích đoạn dễ hơn)." : `${soH2} tiêu đề H2.`);
    const h1 = d.tieuDe.some((h) => h.tag === "h1");
    them("h1_than_bai", "seo", h1 ? "canh_bao" : "dat",
      h1 ? "Thân bài có H1 — trang chỉ nên có một H1 (là tiêu đề bài). Đổi thành H2." : "Không có H1 thừa trong thân bài.");
    let truoc = 1, nhay = false;
    for (const h of d.tieuDe) {
      const cap = Number(h.tag.replace(/\D/g, "")) || 2;
      if (cap > truoc + 1) nhay = true;
      truoc = cap;
    }
    them("thu_tu_tieu_de", "seo", nhay ? "canh_bao" : "dat",
      nhay ? "Tiêu đề nhảy cấp (vd H2 → H4) — giữ thứ tự H2 → H3 → H4." : "Thứ tự tiêu đề hợp lệ.");
    const trong = d.lienKetTrong.length;
    them("lien_ket_noi_bo", "seo", trong >= 2 ? "dat" : "canh_bao",
      trong >= 2 ? `${trong} liên kết nội bộ.` : `Mới ${trong} liên kết nội bộ — nên ít nhất 2 (trang kiến thức, từ điển, công cụ).`);
    const cc = d.lienKetTrong.some((u) => CONG_CU.test(u));
    them("cta_cong_cu", "seo", cc ? "dat" : "canh_bao",
      cc ? "Có liên kết tới công cụ (người đọc thử ngay được)." : "Thêm liên kết tới một công cụ (vd /than-so, /tu-vi) để người đọc tự xem.");
    them("alt_anh", "seo", d.anhThieuAlt ? "canh_bao" : "dat",
      d.anhThieuAlt ? `${d.anhThieuAlt} ảnh thiếu mô tả (alt).` : d.anh ? `${d.anh} ảnh đều có alt.` : "Không có ảnh trong thân bài.");
    them("doan_dai", "seo", d.doanDaiNhat > 150 ? "canh_bao" : "dat",
      d.doanDaiNhat > 150 ? `Có đoạn ${d.doanDaiNhat} chữ — tách đoạn dưới 150 chữ cho dễ đọc trên điện thoại.`
        : "Độ dài đoạn văn dễ đọc.");
  }
  const coAnh = Boolean(bai.anh_bia || meta.image);
  them("anh_bia", "seo", coAnh ? "dat" : "canh_bao",
    coAnh ? "Có ảnh bìa / ảnh chia sẻ." : "Chưa có ảnh bìa — thẻ chia sẻ Facebook/Zalo sẽ dùng ảnh mặc định.");

  // ---------------- GEO / AI SEO
  const soTuTln = demTu(tln);
  if (!tln) them("tra_loi_nhanh", "geo", "canh_bao", "Chưa có \"Trả lời nhanh\" — đoạn 40–80 chữ trả lời thẳng câu hỏi chính, AI hay trích đoạn này.");
  else if (soTuTln < 25 || soTuTln > 90)
    them("tra_loi_nhanh", "geo", "canh_bao", `Trả lời nhanh ${soTuTln} chữ — nên 40–80 chữ, đủ ý trong một đoạn.`);
  else them("tra_loi_nhanh", "geo", "dat", `Trả lời nhanh ${soTuTln} chữ.`);

  if (hoiDap.length >= 3) them("hoi_dap", "geo", "dat", `${hoiDap.length} câu hỏi đáp (xuất FAQPage).`);
  else them("hoi_dap", "geo", "canh_bao", `Mới ${hoiDap.length} câu hỏi đáp — nên 3–6 câu người đọc hay hỏi.`);

  if (d.tieuDe.length) {
    const ok = d.tieuDe.some((h) => CAU_HOI.test(h.text)) || hoiDap.length > 0;
    them("tieu_de_cau_hoi", "geo", ok ? "dat" : "canh_bao",
      ok ? "Có tiêu đề dạng câu hỏi." : "Đặt ít nhất một tiêu đề phụ dạng câu hỏi (\"… là gì?\", \"Vì sao …?\").");
  } else if (d.soTu > 0) them("tieu_de_cau_hoi", "geo", "canh_bao", "Chưa có tiêu đề phụ dạng câu hỏi.");

  them("nguon", "geo", nguon.length ? "dat" : "canh_bao",
    nguon.length ? `${nguon.length} nguồn tham khảo.` : "Chưa ghi nguồn — ghi sách / trường phái tham khảo (không ghi thư viện phần mềm).");
  if (d.soTu > 0) {
    them("cau_truc", "geo", d.danhSach + d.bang > 0 ? "dat" : "canh_bao",
      d.danhSach + d.bang > 0 ? "Có danh sách/bảng (dễ trích)." : "Thêm một danh sách hoặc bảng tóm tắt ý chính.");
  }
  if (tk && d.doanDau) {
    const ok = boDau(d.doanDau).includes(tkK) && / là /i.test(d.doanDau);
    them("dinh_nghia", "geo", ok ? "dat" : "canh_bao",
      ok ? "Đoạn mở đầu định nghĩa rõ chủ đề." : `Mở bài bằng câu định nghĩa: "${tk} là …".`);
  }

  // ---------------- E-E-A-T (EEAT-1, BM-1, DX-1)
  const ky = bai.ky_ten || "ban_bien_tap";
  if (ky === "tham_dinh") {
    const thieu = [!bai.nguoi_tham_dinh && "người thẩm định", !bai.ngay_tham_dinh && "ngày thẩm định",
      !bai.xac_nhan_tham_dinh && "ô xác nhận chuyên gia đã đọc và duyệt"].filter(Boolean);
    if (thieu.length) them("tham_dinh", "eeat", "loi", `Ký "Thẩm định" nhưng thiếu: ${thieu.join(", ")}.`, true);
    else them("ky_ten", "eeat", "dat", "Bài ghi chuyên gia thẩm định (có ngày).");
  } else if (ky === "tac_gia") {
    if (!bai.tac_gia) them("tac_gia", "eeat", "loi", "Ký \"Tác giả\" nhưng chưa chọn tác giả.", true);
    else them("ky_ten", "eeat", "dat", "Bài do chuyên gia tự viết, đứng tên tác giả.");
  } else them("ky_ten", "eeat", "dat", "Bài đứng tên Ban biên tập · Chủ biên duyệt xuất bản.");
  them("chuyen_gia", "eeat", ky === "ban_bien_tap" ? "canh_bao" : "dat",
    ky === "ban_bien_tap" ? "Gợi ý: nhờ chuyên gia đọc và thẩm định để bài có chữ ký chuyên môn."
      : "Có chữ ký chuyên môn.");

  // ---------------- Ranh giới nội dung
  const toanVan = [tieuDe, metaTitle, moTa, chuoi(bai.mo_ta_ngan), tln, d.van,
    ...hoiDap.flatMap((h) => [chuoi(h.cau_hoi), chuoi(h.tra_loi)])].join("\n");
  const cam = timCum(toanVan, CAM_CHAN);
  if (cam.length) them("vung_cam", "noi_dung", "loi", `Ngoài ranh giới nội dung: ${cam.map((c) => `"${c}"`).join(", ")}.`, true);
  else them("vung_cam", "noi_dung", "dat", "Không có nội dung ngoài ranh giới.");
  const nhay = timCum(toanVan, NHAY_CAM);
  if (nhay.length) them("nhay_cam", "noi_dung", "canh_bao",
    `Có cụm nhạy cảm ${nhay.map((c) => `"${c}"`).join(", ")} — đọc lại: chỉ giải thích, không khuyên làm, không doạ.`);
  const phan = timCum(toanVan, GIONG_PHAN);
  them("giong_phan", "noi_dung", phan.length ? "canh_bao" : "dat",
    phan.length ? `Giọng phán quyết: ${phan.map((c) => `"${c}"`).join(", ")} — viết giọng tham khảo ("thường được mô tả là").`
      : "Giọng tham khảo, không phán.");
  const lienHe = LIEN_HE_CHU.test(toanVan) || d.lienKetNgoai.some((u) => /^(mailto|tel|sms):/i.test(u) || /zalo\.me/i.test(u));
  if (lienHe) them("lien_he", "noi_dung", "loi", "Có số điện thoại, email, Zalo hoặc link liên hệ riêng.", true);
  const noiBo = TEN_NOI_BO.flatMap((r) => toanVan.match(new RegExp(r.source, r.flags + "g")) ?? []);
  if (noiBo.length) them("ten_noi_bo", "noi_dung", "loi",
    `Có tên nội bộ không được công khai: ${[...new Set(noiBo)].join(", ")} — ghi nguồn kiểu sách/trường phái.`, true);

  // ---------------- điểm
  let co = 0, tong = 0;
  for (const m of muc) {
    const w = TRONG_SO[m.ma] ?? 0;
    tong += w;
    co += w * HE_SO[m.muc_do];
  }
  const loi_chan = muc.filter((m) => m.chan);
  let diem = tong ? Math.round((100 * co) / tong) : 0;
  if (loi_chan.length) diem = Math.min(diem, 40);
  return { diem, muc, loi_chan };
}

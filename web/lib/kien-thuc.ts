// Trang kiến thức (SEO-B): nội dung từ KB của engine, render phía server để máy tìm kiếm và AI đọc được.
// Chỉ dùng ở Server Component / route handler. Web chỉ hiển thị — không tự viết nghĩa. Lỗi engine → trả null/[] (trang vẫn render, cache tự làm mới).

import { unstable_noStore as noStore } from "next/cache";
import type { MinhHoaDuLieu } from "@/components/minh-hoa/MinhHoa";
import type { KieuMang } from "@/components/minh-hoa/TrangTri";
import CHUYEN from "@/lib/chuyen-huong.json";

export type LoaiTrang = "so" | "que" | "sao" | "cung" | "thap_than" | "nhat_chu"
  | "cap_so" | "nghe" | "tinh_yeu" | "nam_ca_nhan" | "no_nghiep" | "sao_cung" | "hoa_cung" | "menh_nam" | "so_kep";

type ChuDe = { loai: LoaiTrang; ten: string; mo_ta: string; mang: string };
/** Khoá = mã chủ đề (giữ nguyên làm mã nội bộ: CMS, hình, llms); `duong` = URL cụm theo silo mảng (lib/chuyen-huong.json). */
const CHU_DE_GOC: Record<string, ChuDe> = {
  "than-so": { loai: "so", ten: "Ý nghĩa các con số", mang: "/than-so",
    mo_ta: "12 con số của thần số học Pythagoras (1–9 và số cái 11, 22, 33): từ khoá, mặt tối, năm cá nhân, đỉnh cao, thử thách." },
  // SEO-G: cụm thần số theo câu người Việt hay tìm
  "hop-so": { loai: "cap_so", ten: "Số chủ đạo nào hợp nhau", mang: "/hop-doi",
    mo_ta: "45 cặp số chủ đạo 1–9: hai người dễ hoà ở đâu, dễ va ở đâu, cùng làm gì để êm. Không chấm điểm hợp – khắc." },
  "nghe-nghiep": { loai: "nghe", ten: "Số chủ đạo hợp nghề gì", mang: "/than-so",
    mo_ta: "12 số chủ đạo và sự nghiệp: nghề thường hợp, thế mạnh, môi trường, cái bẫy nghề nghiệp và chuyện tiền bạc." },
  "tinh-yeu": { loai: "tinh_yeu", ten: "Số chủ đạo trong tình yêu", mang: "/hop-doi",
    mo_ta: "12 số chủ đạo trong tình yêu: cách yêu, cần được gì, điểm mù, hợp kiểu người nào, dấu hiệu lệch nhịp." },
  "nam-ca-nhan": { loai: "nam_ca_nhan", ten: "Năm cá nhân 1–9", mang: "/than-so",
    mo_ta: "Năm cá nhân số 1 đến 9: chủ đề của năm, nên làm, nên tránh, chuyện hay gặp và cách tự tính năm cá nhân." },
  "no-nghiep": { loai: "no_nghiep", ten: "Nợ nghiệp 13, 14, 16, 19", mang: "/than-so",
    mo_ta: "Bốn số nợ nghiệp trong thần số học: ý nghĩa, khi nào được xem là có, và cách hiểu như bài học cần luyện." },
  "so-kep": { loai: "so_kep", ten: "Số kép Chaldea 10–52", mang: "/than-so",
    mo_ta: "43 số kép trong thần số học phái Chaldea: hình ảnh biểu tượng, xu hướng, mặt tối, rút gọn về số gốc nào." },
  "kinh-dich": { loai: "que", ten: "64 quẻ Kinh Dịch", mang: "/kinh-dich",
    mo_ta: "Ý nghĩa 64 quẻ Kinh Dịch theo Nghĩa Lý: lời khuyên, mặt tối, theo từng lĩnh vực, trích Chu Dịch." },
  "tu-vi": { loai: "sao", ten: "14 chính tinh Tử vi", mang: "/tu-vi",
    mo_ta: "14 chính tinh trong Tử vi Đẩu Số: ngũ hành, tính chất, điểm mạnh, mặt tối, ý nghĩa ở 12 cung." },
  "cung-tu-vi": { loai: "cung", ten: "12 cung Tử vi", mang: "/tu-vi",
    mo_ta: "12 cung trong lá số Tử vi: mỗi cung nói về điều gì, không trả lời được gì, 14 chính tinh và tứ hoá ở từng cung." },
  // SEO-H: "sao X ở cung Y" — 14 chính tinh × 12 cung
  "sao-cung": { loai: "sao_cung", ten: "Chính tinh ở từng cung Tử vi", mang: "/tu-vi",
    mo_ta: "168 trường hợp 14 chính tinh đứng ở 12 cung: ý nghĩa, sáng hay hãm theo từng chi, sao đồng cung, xung chiếu, tam hợp và tứ hoá." },
  // SEO-I: "Hoá X ở cung Y" — 4 tứ hoá × 12 cung
  "tu-hoa": { loai: "hoa_cung", ten: "Tứ hoá ở 12 cung Tử vi", mang: "/tu-vi",
    mo_ta: "48 trường hợp Hoá Lộc, Quyền, Khoa, Kỵ rơi vào 12 cung: ý nghĩa, năm sinh nào có, sao nào mang hoá, tam phương tứ chính." },
  // SEO-J: "sinh năm X mệnh gì" — 1950–2025
  "menh-tuoi": { loai: "menh_nam", ten: "Sinh năm nào mệnh gì", mang: "/bat-tu",
    mo_ta: "Tra mệnh theo năm sinh 1950–2025: tuổi can chi, mệnh nạp âm và ý nghĩa, màu hợp theo ngũ hành, tuổi hợp – xung, cung phi nam nữ, mốc Tết và Lập xuân." },
  "thap-than": { loai: "thap_than", ten: "10 thập thần Bát tự", mang: "/bat-tu",
    mo_ta: "10 thập thần trong Bát tự (Tỷ Kiên đến Chính Ấn): ý nghĩa, tính cách, khi quá nhiều, khi thiếu, với nam và nữ." },
  "nhat-chu": { loai: "nhat_chu", ten: "10 nhật chủ Bát tự", mang: "/bat-tu",
    mo_ta: "10 nhật chủ (can ngày sinh) trong Bát tự: hình tượng, tính chất, điểm mạnh, mặt tối và ảnh hưởng của mùa sinh." },
};
// QH-URL (phương án B): cụm kiến thức nằm dưới trang công cụ của mảng — /{mảng}/{cụm}/{trang}. URL cũ /kien-thuc/{khoá}/…
// chuyển 308 (next.config.mjs đọc cùng lib/chuyen-huong.json).
export const CHU_DE: Record<string, ChuDe & { duong: string }> = Object.fromEntries(Object.entries(CHU_DE_GOC).map(([k, v]) => {
  const duong = (CHUYEN.chu_de as Record<string, string>)[k];
  if (!duong) throw new Error(`Chủ đề ${k} chưa có đường dẫn trong lib/chuyen-huong.json`);
  return [k, { ...v, duong }];
}));
/** Trang công cụ = trang trụ (pillar) của silo; tên hiện ở breadcrumb và khối "Kiến thức {mảng}". */
export const TEN_MANG_SILO: Record<string, string> = {
  "/than-so": "Thần số học", "/hop-doi": "Hợp đôi", "/tu-vi": "Tử vi", "/bat-tu": "Bát tự", "/kinh-dich": "Kinh Dịch", "/phong-thuy": "Phong thuỷ",
};
/** Trang trụ của một đường dẫn cụm/trang: "/tu-vi/sao-o-cung/x" → "/tu-vi". */
export const truCua = (duong: string) => `/${duong.split("/")[1] ?? ""}`;
/** Khoá chủ đề theo URL cụm ("/tu-vi/sao-o-cung" → "sao-cung"); không phải cụm → null. */
export const khoaTheoDuong = (duong: string): string | null =>
  Object.entries(CHU_DE).find(([, c]) => c.duong === duong)?.[0] ?? null;
/** Các cụm kiến thức thuộc một trang trụ (theo thứ tự khai báo). */
export const cumCuaTru = (tru: string) => Object.entries(CHU_DE).filter(([, c]) => truCua(c.duong) === tru);
/** Thứ tự silo trên thư viện + khối "Kiến thức {mảng}" ở trang công cụ. */
export const THU_TU_TRU = ["/than-so", "/hop-doi", "/tu-vi", "/bat-tu", "/kinh-dich", "/phong-thuy"] as const;
export type CumHienThi = { duong: string; ten: string; mo_ta: string; khoa: string | null; hinh: KieuMang };
/** Cụm không dựng từ CHU_DE (lá số mẫu, trang tuổi phong thuỷ) nhưng thuộc silo của mảng. */
const CUM_PHU: Record<string, CumHienThi[]> = {
  "/tu-vi": [{ duong: "/tu-vi/la-so-mau", ten: "Lá số mẫu đọc từng bước", khoa: null, hinh: "tu-vi",
    mo_ta: "6 lá số minh hoạ đọc theo đúng thứ tự: Mệnh–Thân, chính tinh, độ sáng, tam phương tứ chính, tứ hoá, đại hạn." }],
  "/phong-thuy": [
    { duong: "/phong-thuy/huong-hop-tuoi", ten: "Tuổi nào hợp hướng nào", khoa: null, hinh: "phong-thuy",
      mo_ta: "Nam, nữ sinh 1960–2005: mệnh quái Bát trạch, 4 hướng tốt, 4 hướng nên tránh, bố trí cửa, bếp, giường." },
    { duong: "/phong-thuy/huong-xau-nam", ten: "Hướng xấu theo năm", khoa: null, hinh: "phong-thuy",
      mo_ta: "Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng, Nhị Hắc của từng năm — phía nên giữ yên, không động thổ." },
  ],
};
/** Mọi cụm của một trang trụ (cụm KB trước, cụm phụ sau). */
export function dsCumTru(tru: string): CumHienThi[] {
  return [
    ...cumCuaTru(tru).map(([k, c]) => ({ duong: c.duong, ten: c.ten, mo_ta: c.mo_ta, khoa: k, hinh: HINH_CHU_DE[k] ?? "than-so" })),
    ...(CUM_PHU[tru] ?? []),
  ];
}

/** MH-1: hình trang trí cho từng chủ đề. */
export const HINH_CHU_DE: Record<string, KieuMang> = {
  "than-so": "than-so", "kinh-dich": "kinh-dich", "tu-vi": "tu-vi", "cung-tu-vi": "tu-vi", "thap-than": "bat-tu", "nhat-chu": "bat-tu",
  "hop-so": "than-so", "nghe-nghiep": "than-so", "tinh-yeu": "than-so", "nam-ca-nhan": "than-so", "no-nghiep": "than-so", "so-kep": "than-so",
  "sao-cung": "tu-vi", "tu-hoa": "tu-vi", "menh-tuoi": "bat-tu",
};
export const CHU_DE_THEO_LOAI: Record<LoaiTrang, string> = {
  so: "than-so", que: "kinh-dich", sao: "tu-vi", cung: "cung-tu-vi", thap_than: "thap-than", nhat_chu: "nhat-chu",
  cap_so: "hop-so", nghe: "nghe-nghiep", tinh_yeu: "tinh-yeu", nam_ca_nhan: "nam-ca-nhan", no_nghiep: "no-nghiep", so_kep: "so-kep",
  sao_cung: "sao-cung", hoa_cung: "tu-hoa", menh_nam: "menh-tuoi",
};

/** SEO-K: `xem_them` = link sang trang gốc thay cho chép lại khối dùng chung (engine dựng, tiêu đề điền sẵn). */
/** SEO-M: trích dẫn sách (nguyên văn ≤ 2 câu, có phiên âm + nghĩa) — KB bo_sung_<loai>.json. */
export interface TrichDan { sach: string; chuong?: string; nguyen_van?: string; phien_am?: string; nghia?: string }
export interface MucTrang {
  tieu_de: string; doan?: string; danh_sach?: string[]; xem_them?: { loai: LoaiTrang; slug: string; tieu_de: string }[];
  /** SEO-M: bảng thật · trích dẫn · phần do ban biên tập bổ sung trên trang chuyên gia tự viết (EEAT-1). */
  bang?: { cot: string[]; dong: string[][] }; trich_dan?: TrichDan[]; bien_tap?: boolean;
}
export interface TrangKienThuc {
  loai: LoaiTrang; slug: string; tieu_de: string; mo_ta: string; tra_loi_nhanh: string;
  muc: MucTrang[]; hoi_dap: { hoi: string; dap: string }[]; nguon: string[];
  /** SEO-M: 3–5 ý chính cho ảnh infographic (/og/y-chinh). */
  y_chinh?: string[];
  trang_thai: string; index: boolean; cap_nhat: string;
  /** SEO-L4: ngày đăng thật (sổ băm nội dung engine); `cap_nhat` = ngày sửa nội dung gần nhất. */
  ngay_dang?: string;
  /** EEAT-1: mã chuyên gia (tra hồ sơ ở lib/chuyen-gia.ts). tac_gia chỉ có khi chuyên gia tự viết; tham_dinh chỉ khi đã duyệt. */
  chu_bien: string; tac_gia: string | null; tham_dinh: { nguoi: string; ngay: string } | null;
  /** GN-1: lời chính chuyên gia viết (2–4 câu kinh nghiệm), chỉ có trên trang người đó đã thẩm định / tự viết. */
  goc_nhin: { noi_dung: string; nguoi: string; ngay: string } | null;
  /** DX-1: chủ biên duyệt cho xuất bản toàn kho (quyết định biên tập, không phải thẩm định từng bài). */
  duyet_xuat_ban: { nguoi: string; ngay: string } | null;
  bien_soan: "chuyen_gia" | "ai_ho_tro";
  /** MH-1: dữ liệu hình minh hoạ do engine trả (web chỉ vẽ). */
  minh_hoa?: MinhHoaDuLieu;
  lien_quan: { loai: LoaiTrang; slug: string; tieu_de: string }[];
  /** SEO-H: trang sao / trang cung trỏ tới 12 hoặc 14 trang "sao ở cung" (engine dựng danh sách). */
  trang_con?: { tieu_de: string; ds: { loai: LoaiTrang; slug: string; tieu_de: string }[] };
  /** SEO-I: trang cung trỏ tới 4 trang "Hoá X ở cung này". */
  trang_con_hoa?: { tieu_de: string; ds: { loai: LoaiTrang; slug: string; tieu_de: string }[] };
  /** SEO-J: link sang trang ngoài thư viện kiến thức (vd /phong-thuy/huong-hop-tuoi/tuoi-1990). Engine dựng đường dẫn. */
  lien_ket_ngoai?: { duong: string; ten: string }[];
}
export type MucLuc = Pick<TrangKienThuc, "loai" | "slug" | "tieu_de" | "mo_ta" | "trang_thai" | "index" | "cap_nhat" | "ngay_dang"
  | "chu_bien" | "tac_gia" | "tham_dinh" | "bien_soan">;

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;
const LAM_MOI = 60 * 60 * 6;   // 6 giờ

async function lay<T>(duong: string): Promise<T | null> {
  try {
    const r = await fetch(`${ENGINE_URL}${duong}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: LAM_MOI },
      signal: AbortSignal.timeout(20_000),
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** SEO-L3 — trang MỘT mục: engine trả 404/422 = không có trang (→ notFound 404); engine lỗi / không kết nối được → NÉM
 *  lỗi (→ error.tsx, HTTP 5xx) để Google giữ chỉ mục và thử lại, thay vì thấy ~600 trang 404 mỗi lần engine khởi động lại.
 *  Phản hồi lỗi không vào bộ nhớ đệm (Next chỉ cache 200). */
export class LoiEngine extends Error {}
async function layTrangMot<T>(duong: string): Promise<T | null> {
  let r: Response;
  try {
    r = await fetch(`${ENGINE_URL}${duong}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: LAM_MOI },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new LoiEngine(`engine không kết nối được: ${duong}`);
  }
  if (r.ok) return (await r.json()) as T;
  if (r.status === 404 || r.status === 422) return null;
  throw new LoiEngine(`engine lỗi ${r.status}: ${duong}`);
}

export async function mucLuc(): Promise<MucLuc[]> {
  const ds = (await lay<{ trang: MucLuc[] }>("/v1/kb/trang"))?.trang;
  // Engine chưa sẵn sàng (vd lúc build, Render đang ngủ): KHÔNG cache bản rỗng 6 giờ —
  // chuyển trang sang render động; dữ liệu engine vẫn được cache ở tầng fetch khi lấy được.
  if (!ds) noStore();
  return ds ?? [];
}

export function trang(loai: LoaiTrang, slug: string): Promise<TrangKienThuc | null> {
  return layTrangMot<TrangKienThuc>(`/v1/kb/trang/${loai}/${encodeURIComponent(slug)}`);
}

export const duongTrang = (loai: LoaiTrang, slug: string) => `${CHU_DE[CHU_DE_THEO_LOAI[loai]]!.duong}/${slug}`;

// GN — từ điển thuật ngữ dễ hiểu (engine GET /v1/tu-dien).
export interface MucTuDien { ma: string; ten: string; bien_the: string[]; han: string | null; mo_dun: string;
  nhom: string | null; de_hieu: string; vi_du: string | null }
export async function tuDien(): Promise<{ muc: MucTuDien[]; nguon: string; trang_thai: string } | null> {
  const d = await lay<{ muc: MucTuDien[]; nguon: string; trang_thai: string }>("/v1/tu-dien");
  if (!d) noStore();
  return d;
}

// MAU6 — lá số minh hoạ đọc từng bước (engine GET /v1/tuvi/la-so-mau[/slug]); nhân vật hư cấu.
export interface MucLaSoMau { slug: string; ten: string; tieu_de: string; mo_ta: string; hu_cau: boolean }
export interface BuocDoc { ma: string; tieu_de: string; cach_doc: string; doan: string[]; thuat_ngu: ThuatNguKb[] }
export interface ThuatNguKb { ma: string; ten: string; han: string | null; mo_dun: string; de_hieu: string; vi_du: string | null; khop: string[] }
export interface LaSoMau extends MucLaSoMau {
  gioi_tinh: "nam" | "nu"; ngay: string; gio: string; noi_sinh: string; ngay_xem: string; trang_thai: string;
  ngay_dang?: string; cap_nhat?: string;
  la_so: unknown; buoc: BuocDoc[];
}
export async function dsLaSoMau(): Promise<MucLaSoMau[]> {
  const d = await lay<{ ds: MucLaSoMau[] }>("/v1/tuvi/la-so-mau");
  if (!d) noStore();
  return d?.ds ?? [];
}
export function laSoMau(slug: string): Promise<LaSoMau | null> {
  return layTrangMot<LaSoMau>(`/v1/tuvi/la-so-mau/${encodeURIComponent(slug)}`);
}

// SEO-F → SEO-K (2026-10-21): trang "tuổi X hợp hướng nào" GỘP nam + nữ cùng năm (46 trang 1960–2005;
// bản cũ -nam/-nu 308 về bản gộp). Engine GET /v1/phongthuy/tuoi-gop[/slug].
export interface MucTuoiHuong { slug: string; nam: number; tieu_de: string; can_chi: string;
  quai_nam: string; nhom_nam: string; quai_nu: string; nhom_nu: string }
export interface HuongDuNien { huong: string; du_nien: string; y_nghia: string; dung_cho: string }
export interface TuoiTheoGioi {
  gioi_tinh: "nam" | "nu";
  menh_quai: { quai: string; nhom: string; so: number; ngu_hanh?: string; tinh_chat?: string };
  huong_tot: HuongDuNien[]; huong_xau: HuongDuNien[]; bang_huong: Record<string, string>;
  goi_y: { ma: string; tieu_de: string; noi_dung: string; nguon: string; huong: string[]; du_nien: string[] }[];
  tra_loi_nhanh: string; sinh_truoc_moc: { nam_tinh: number; quai: string; nhom: string };
}
export interface TuoiHuong {
  slug: string; nam: number; tieu_de: string; mo_ta: string; can_chi: string; nap_am: { ten: string; hanh: string; han: string };
  /** SEO-J: đường dẫn trang "sinh năm X mệnh gì" (engine dựng). */
  trang_menh?: string;
  gioi: TuoiTheoGioi[]; huong_chung: string[];
  moc_dau_nam: { lap_xuan: string; tet_viet: string; tet_trung: string; tet_lech: boolean };
  sinh_truoc_moc: { nam_tinh: number; slug: string | null };
  tra_loi_nhanh: string; hoi_dap: { hoi: string; dap: string }[]; nguon: string; luu_y: string[]; trang_thai: string;
  ngay_dang?: string; cap_nhat?: string;
}
/** "huong-hop-tuoi" = trang mục lục; "tuoi-1990" = trang con dưới mục lục (QH-URL). */
export const duongTuoi = (slug: string) => (slug === "huong-hop-tuoi" ? CHUYEN.tuoi_huong : `${CHUYEN.tuoi_huong}/${slug}`);
export const SLUG_TUOI = /^tuoi-\d{4}$/;
/** Slug cũ trước SEO-K (một giới tính) → slug gộp; null nếu không phải dạng cũ. */
export const slugTuoiGop = (slug: string) => /^tuoi-\d{4}-(nam|nu)$/.test(slug) ? slug.slice(0, 9) : null;
export async function dsTuoiHuong(): Promise<MucTuoiHuong[]> {
  const d = await lay<{ trang: MucTuoiHuong[] }>("/v1/phongthuy/tuoi-gop");
  if (!d) noStore();
  return d?.trang ?? [];
}
export function tuoiHuong(slug: string): Promise<TuoiHuong | null> {
  return SLUG_TUOI.test(slug) ? layTrangMot<TuoiHuong>(`/v1/phongthuy/tuoi-gop/${slug}`) : Promise.resolve(null);
}

// ---- EEAT-1: số trang theo chuyên gia (engine đếm từ sổ thẩm định) ----------------
export interface SoTrangChuyenGia {
  slug: string;
  so_trang: { chu_bien: number; tac_gia: number; tham_dinh: number; cho_tham_dinh: number };
  tac_gia: { loai: LoaiTrang; slug: string; tieu_de: string }[];
  tham_dinh_gan_day: { loai: LoaiTrang; slug: string; tieu_de: string; tham_dinh: { nguoi: string; ngay: string } }[];
}

export function soTrangChuyenGia(slug: string): Promise<SoTrangChuyenGia | null> {
  return lay<SoTrangChuyenGia>(`/v1/kb/chuyen-gia/${encodeURIComponent(slug)}`);
}

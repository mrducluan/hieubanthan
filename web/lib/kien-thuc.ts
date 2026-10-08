// Trang kiến thức (SEO-B): nội dung từ KB của engine, render phía server để máy tìm kiếm và AI đọc được.
// Chỉ dùng ở Server Component / route handler. Web chỉ hiển thị — không tự viết nghĩa. Lỗi engine → trả null/[] (trang vẫn render, cache tự làm mới).

import { unstable_noStore as noStore } from "next/cache";
import type { MinhHoaDuLieu } from "@/components/minh-hoa/MinhHoa";
import type { KieuMang } from "@/components/minh-hoa/TrangTri";

export type LoaiTrang = "so" | "que" | "sao" | "cung" | "thap_than" | "nhat_chu"
  | "cap_so" | "nghe" | "tinh_yeu" | "nam_ca_nhan" | "no_nghiep";

export const CHU_DE: Record<string, { loai: LoaiTrang; ten: string; mo_ta: string; mang: string }> = {
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
  "kinh-dich": { loai: "que", ten: "64 quẻ Kinh Dịch", mang: "/kinh-dich",
    mo_ta: "Ý nghĩa 64 quẻ Kinh Dịch theo Nghĩa Lý: lời khuyên, mặt tối, theo từng lĩnh vực, trích Chu Dịch." },
  "tu-vi": { loai: "sao", ten: "14 chính tinh Tử vi", mang: "/tu-vi",
    mo_ta: "14 chính tinh trong Tử vi Đẩu Số: ngũ hành, tính chất, điểm mạnh, mặt tối, ý nghĩa ở 12 cung." },
  "cung-tu-vi": { loai: "cung", ten: "12 cung Tử vi", mang: "/tu-vi",
    mo_ta: "12 cung trong lá số Tử vi: mỗi cung nói về điều gì, không trả lời được gì, 14 chính tinh và tứ hoá ở từng cung." },
  "thap-than": { loai: "thap_than", ten: "10 thập thần Bát tự", mang: "/bat-tu",
    mo_ta: "10 thập thần trong Bát tự (Tỷ Kiên đến Chính Ấn): ý nghĩa, tính cách, khi quá nhiều, khi thiếu, với nam và nữ." },
  "nhat-chu": { loai: "nhat_chu", ten: "10 nhật chủ Bát tự", mang: "/bat-tu",
    mo_ta: "10 nhật chủ (can ngày sinh) trong Bát tự: hình tượng, tính chất, điểm mạnh, mặt tối và ảnh hưởng của mùa sinh." },
};
/** MH-1: hình trang trí cho từng chủ đề. */
export const HINH_CHU_DE: Record<string, KieuMang> = {
  "than-so": "than-so", "kinh-dich": "kinh-dich", "tu-vi": "tu-vi", "cung-tu-vi": "tu-vi", "thap-than": "bat-tu", "nhat-chu": "bat-tu",
  "hop-so": "than-so", "nghe-nghiep": "than-so", "tinh-yeu": "than-so", "nam-ca-nhan": "than-so", "no-nghiep": "than-so",
};
export const CHU_DE_THEO_LOAI: Record<LoaiTrang, string> = {
  so: "than-so", que: "kinh-dich", sao: "tu-vi", cung: "cung-tu-vi", thap_than: "thap-than", nhat_chu: "nhat-chu",
  cap_so: "hop-so", nghe: "nghe-nghiep", tinh_yeu: "tinh-yeu", nam_ca_nhan: "nam-ca-nhan", no_nghiep: "no-nghiep",
};

export interface MucTrang { tieu_de: string; doan?: string; danh_sach?: string[] }
export interface TrangKienThuc {
  loai: LoaiTrang; slug: string; tieu_de: string; mo_ta: string; tra_loi_nhanh: string;
  muc: MucTrang[]; hoi_dap: { hoi: string; dap: string }[]; nguon: string[];
  trang_thai: string; index: boolean; cap_nhat: string;
  /** MH-1: dữ liệu hình minh hoạ do engine trả (web chỉ vẽ). */
  minh_hoa?: MinhHoaDuLieu;
  lien_quan: { loai: LoaiTrang; slug: string; tieu_de: string }[];
}
export type MucLuc = Pick<TrangKienThuc, "loai" | "slug" | "tieu_de" | "mo_ta" | "trang_thai" | "index" | "cap_nhat">;

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

export async function mucLuc(): Promise<MucLuc[]> {
  const ds = (await lay<{ trang: MucLuc[] }>("/v1/kb/trang"))?.trang;
  // Engine chưa sẵn sàng (vd lúc build, Render đang ngủ): KHÔNG cache bản rỗng 6 giờ —
  // chuyển trang sang render động; dữ liệu engine vẫn được cache ở tầng fetch khi lấy được.
  if (!ds) noStore();
  return ds ?? [];
}

export function trang(loai: LoaiTrang, slug: string): Promise<TrangKienThuc | null> {
  return lay<TrangKienThuc>(`/v1/kb/trang/${loai}/${encodeURIComponent(slug)}`);
}

export const duongTrang = (loai: LoaiTrang, slug: string) => `/kien-thuc/${CHU_DE_THEO_LOAI[loai]}/${slug}`;

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
  la_so: unknown; buoc: BuocDoc[];
}
export async function dsLaSoMau(): Promise<MucLaSoMau[]> {
  const d = await lay<{ ds: MucLaSoMau[] }>("/v1/tuvi/la-so-mau");
  if (!d) noStore();
  return d?.ds ?? [];
}
export function laSoMau(slug: string): Promise<LaSoMau | null> {
  return lay<LaSoMau>(`/v1/tuvi/la-so-mau/${encodeURIComponent(slug)}`);
}

// SEO-F — trang "tuổi X hợp hướng nào" (engine GET /v1/phongthuy/tuoi[/slug]); 92 trang năm 1960–2005 × nam/nữ.
export interface MucTuoiHuong { slug: string; nam: number; gioi_tinh: "nam" | "nu"; tieu_de: string; quai: string; nhom: string; can_chi: string }
export interface HuongDuNien { huong: string; du_nien: string; y_nghia: string; dung_cho: string }
export interface TuoiHuong extends Omit<MucTuoiHuong, "quai" | "nhom"> {
  mo_ta: string; nap_am: { ten: string; hanh: string; han: string };
  menh_quai: { quai: string; nhom: string; so: number; ngu_hanh?: string; tinh_chat?: string };
  huong_tot: HuongDuNien[]; huong_xau: HuongDuNien[]; bang_huong: Record<string, string>;
  goi_y: { ma: string; tieu_de: string; noi_dung: string; nguon: string; huong: string[]; du_nien: string[] }[];
  moc_dau_nam: { lap_xuan: string; tet_viet: string; tet_trung: string; tet_lech: boolean };
  sinh_truoc_moc: { nam_tinh: number; quai: string; nhom: string; slug: string | null };
  tra_loi_nhanh: string; hoi_dap: { hoi: string; dap: string }[]; nguon: string; luu_y: string[]; trang_thai: string;
}
export const duongTuoi = (slug: string) => `/phong-thuy/${slug}`;
export async function dsTuoiHuong(): Promise<MucTuoiHuong[]> {
  const d = await lay<{ trang: MucTuoiHuong[] }>("/v1/phongthuy/tuoi");
  if (!d) noStore();
  return d?.trang ?? [];
}
export function tuoiHuong(slug: string): Promise<TuoiHuong | null> {
  return /^tuoi-\d{4}-(nam|nu)$/.test(slug) ? lay<TuoiHuong>(`/v1/phongthuy/tuoi/${slug}`) : Promise.resolve(null);
}

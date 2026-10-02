// Trang kiến thức (SEO-B): nội dung từ KB của engine, render phía server để máy tìm kiếm và AI đọc được.
// Chỉ dùng ở Server Component / route handler. Web chỉ hiển thị — không tự viết nghĩa. Lỗi engine → trả null/[] (trang vẫn render, cache tự làm mới).

import { unstable_noStore as noStore } from "next/cache";

export type LoaiTrang = "so" | "que" | "sao";

export const CHU_DE: Record<string, { loai: LoaiTrang; ten: string; mo_ta: string; mang: string }> = {
  "than-so": { loai: "so", ten: "Ý nghĩa các con số", mang: "/than-so",
    mo_ta: "12 con số của thần số học Pythagoras (1–9 và số cái 11, 22, 33): từ khoá, mặt tối, năm cá nhân, đỉnh cao, thử thách." },
  "kinh-dich": { loai: "que", ten: "64 quẻ Kinh Dịch", mang: "/kinh-dich",
    mo_ta: "Ý nghĩa 64 quẻ Kinh Dịch theo Nghĩa Lý: lời khuyên, mặt tối, theo từng lĩnh vực, trích Chu Dịch." },
  "tu-vi": { loai: "sao", ten: "14 chính tinh Tử vi", mang: "/tu-vi",
    mo_ta: "14 chính tinh trong Tử vi Đẩu Số: ngũ hành, tính chất, điểm mạnh, mặt tối, ý nghĩa ở 12 cung." },
};
export const CHU_DE_THEO_LOAI: Record<LoaiTrang, string> = { so: "than-so", que: "kinh-dich", sao: "tu-vi" };

export interface MucTrang { tieu_de: string; doan?: string; danh_sach?: string[] }
export interface TrangKienThuc {
  loai: LoaiTrang; slug: string; tieu_de: string; mo_ta: string; tra_loi_nhanh: string;
  muc: MucTrang[]; hoi_dap: { hoi: string; dap: string }[]; nguon: string[];
  trang_thai: string; index: boolean; cap_nhat: string;
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

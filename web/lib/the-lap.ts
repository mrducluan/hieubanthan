// CTA-2 — "thẻ lấp lưới": khối cuối trang (Kiến thức {mảng}, Bài viết liên quan / mới, Đọc tiếp) là lưới 3 cột nhưng số
// mục thật thay đổi (silo Hợp đôi / Kinh Dịch chỉ có 1 cụm, blog mới vài bài) → ô trống trên máy tính. Thay vì để trống
// hay co lưới, bù cho đủ hàng bằng lối đi tiếp CÓ THẬT trong site, theo thứ tự gần chủ đề nhất: cụm kiến thức cùng mảng →
// công cụ / cụm liên quan chéo mảng → thư viện chung. Ban biên tập sửa danh sách ở CMS (global "Lối đi tiếp cuối trang" +
// thẻ ưu tiên từng URL — lib/loi-di-tiep.ts lọc lại); CMS trống → bộ mặc định lib/loi-di-tiep-mac-dinh.json. Hàm ở đây
// thuần (nhận cấu hình làm tham số); lib/the-lap-cms.ts đọc CMS + số lượt bấm. Bỏ mục trang đã hiện (boQua).
import type { KieuMang } from "@/components/minh-hoa/TrangTri";
import { THONG_TIN_MANG, type MangBlog } from "@/lib/blog-mang";
import { dsCumTru } from "@/lib/kien-thuc";
import { CAU_HINH_MAC_DINH, NHAN, type CauHinhLoiDi, type TheTho } from "@/lib/loi-di-tiep";
import { soCanLap } from "@/lib/luoi";

export { lopCot, lopOCuoi, soCanLap } from "@/lib/luoi";

export type TheLap = {
  duong: string; ten: string; mo_ta: string; hinh: KieuMang;
  /** chip nhỏ để người đọc biết đây là lối đi tiếp, không phải bài cùng loại */ nhan: "Kiến thức" | "Công cụ" | "Thư viện";
};

const sangThe = (t: TheTho): TheLap => ({ duong: t.duong, ten: t.ten, mo_ta: t.mo_ta, hinh: t.hinh, nhan: NHAN[t.nhan] });

const MANG_TRU: Record<string, MangBlog> = {
  "/than-so": "than_so", "/hop-doi": "hop_doi", "/tu-vi": "tu_vi", "/bat-tu": "bat_tu", "/kinh-dich": "kinh_dich", "/phong-thuy": "phong_thuy",
};
const HINH_TRU: Record<string, KieuMang> = {
  "/than-so": "than-so", "/hop-doi": "than-so", "/tu-vi": "tu-vi", "/bat-tu": "bat-tu", "/kinh-dich": "kinh-dich", "/phong-thuy": "phong-thuy",
};

/** Thẻ công cụ của chính trang trụ (dùng ở thư viện /kien-thuc: silo ít cụm → mời mở công cụ của mảng). */
export function theCongCu(tru: string): TheLap | null {
  const m = MANG_TRU[tru];
  if (!m) return null;
  const tt = THONG_TIN_MANG[m];
  return { duong: tru, ten: tt.nut, mo_ta: tt.ngan, hinh: HINH_TRU[tru] ?? "than-so", nhan: "Công cụ" };
}

const goc = (d: string) => d.split(/[?#]/)[0]!;

/** `can` thẻ bù: cụm cùng silo `tru` → chéo mảng của `tru` → chung. Bỏ đường dẫn trong `boQua` (so phần trước ?/#) và trùng. */
export type TuyChonLap = {
  tru?: string | null; boQua?: string[]; coCongCu?: boolean;
  /** thẻ ưu tiên của chính URL (Trang website → Lối đi tiếp) */ uuTien?: TheTho[];
  /** cấu hình CMS (global "Lối đi tiếp cuối trang"); không có = mặc định trong code */ cauHinh?: CauHinhLoiDi;
  /** tỉ lệ bấm đã làm mượt theo đường dẫn (khi cauHinh.tu_xep) — xếp lại TRONG từng nhóm, giữ thứ tự biên tập khi hoà */
  tiLe?: Record<string, number>;
};

/** Xếp lại trong nhóm theo tỉ lệ bấm (cao trước); thẻ chưa có số giữ chỗ theo thứ tự biên tập (sort ổn định). */
export function xepTheoTiLe<T extends { duong: string }>(ds: T[], tiLe?: Record<string, number>): T[] {
  if (!tiLe || !Object.keys(tiLe).length) return ds;
  return ds.map((t, i) => ({ t, i, v: tiLe[t.duong] })).sort((a, b) =>
    a.v === undefined || b.v === undefined ? a.i - b.i : b.v - a.v || a.i - b.i).map((x) => x.t);
}

export function theLap(can: number, { tru, boQua = [], coCongCu = false, uuTien = [], cauHinh = CAU_HINH_MAC_DINH, tiLe }: TuyChonLap = {}): TheLap[] {
  if (can <= 0 || !cauHinh.bat) return [];
  const da = new Set(boQua.map(goc));
  const cc = coCongCu && tru ? theCongCu(tru) : null;
  const xep = (ds: TheTho[]) => (cauHinh.tu_xep ? xepTheoTiLe(ds, tiLe) : ds).map(sangThe);
  const cum = tru && cauHinh.cum_truoc ? dsCumTru(tru).map((c) => ({ duong: c.duong, ten: c.ten, mo_ta: c.mo_ta, hinh: c.hinh, nhan: "Kiến thức" as const })) : [];
  const ungVien: TheLap[] = [
    ...uuTien.map(sangThe),
    ...(cc ? [cc] : []),
    ...cum,
    ...(tru ? xep(cauHinh.nhom[tru] ?? []) : []),
    ...xep(cauHinh.nhom.chung ?? []),
  ];
  const ra: TheLap[] = [];
  for (const t of ungVien) {
    // Dedupe theo phần trước #: "/hom-nay#que-ngay" và "/hom-nay" là một trang.
    if (da.has(goc(t.duong))) continue;
    da.add(goc(t.duong));
    ra.push(t);
    if (ra.length >= can) break;
  }
  return ra;
}

/** "Đọc tiếp" cuối bài blog: ít bài khác hơn 3 → bù cụm kiến thức cùng mảng mà CtaBlog chưa liệt kê, rồi lối chung. */
export function theLapBlog(soBai: number, mang: MangBlog, daHien: string[], them: Pick<TuyChonLap, "cauHinh" | "tiLe"> = {}): TheLap[] {
  const tt = THONG_TIN_MANG[mang];
  return theLap(soCanLap(soBai) || (soBai === 0 ? 3 : 0), { tru: tt.duong, boQua: [tt.duong, ...daHien], ...them });
}


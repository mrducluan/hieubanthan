// CTA-2 — "thẻ lấp lưới": khối cuối trang (Kiến thức {mảng}, Bài viết liên quan / mới, Đọc tiếp) là lưới 3 cột nhưng số
// mục thật thay đổi (silo Hợp đôi / Kinh Dịch chỉ có 1 cụm, blog mới vài bài) → ô trống trên máy tính. Thay vì để trống
// hay co lưới, bù cho đủ hàng bằng lối đi tiếp CÓ THẬT trong site, theo thứ tự gần chủ đề nhất: cụm kiến thức cùng mảng →
// công cụ / cụm liên quan chéo mảng → thư viện chung. Danh sách cố định trong code (tất định, không gọi engine / CMS),
// mọi đường dẫn nằm trong site; bỏ mục trang đã hiện (boQua) để không lặp link ngay trên đó.
import type { KieuMang } from "@/components/minh-hoa/TrangTri";
import { THONG_TIN_MANG, type MangBlog } from "@/lib/blog-mang";
import { CHU_DE, dsCumTru } from "@/lib/kien-thuc";
import { soCanLap } from "@/lib/luoi";

export { lopCot, lopOCuoi, soCanLap } from "@/lib/luoi";

export type TheLap = {
  duong: string; ten: string; mo_ta: string; hinh: KieuMang;
  /** chip nhỏ để người đọc biết đây là lối đi tiếp, không phải bài cùng loại */ nhan: "Kiến thức" | "Công cụ" | "Thư viện";
};

const cum = (k: string, hinh: KieuMang): TheLap => ({ duong: CHU_DE[k]!.duong, ten: CHU_DE[k]!.ten, mo_ta: CHU_DE[k]!.mo_ta, hinh, nhan: "Kiến thức" });

/** Lối đi chéo mảng của từng trang trụ — cái người đọc mảng đó hay muốn xem tiếp. */
const CHEO: Record<string, TheLap[]> = {
  "/than-so": [
    cum("hop-so", "than-so"),
    { duong: "/hom-nay", ten: "Hôm nay của bạn", hinh: "than-so", nhan: "Công cụ",
      mo_ta: "Ngày cá nhân, câu tự soi và giờ hoàng đạo — mỗi ngày một trang mới, tính từ ngày sinh của bạn." },
  ],
  "/hop-doi": [
    cum("tinh-yeu", "than-so"),
    { duong: "/tu-vi#hop-tham", ten: "Xem lá số 2 người", hinh: "tu-vi", nhan: "Công cụ",
      mo_ta: "Đặt hai lá số Tử vi cạnh nhau: mệnh nạp âm, can chi, cung phi và tứ hoá — có điểm tham khảo, kèm lý do." },
    cum("than-so", "than-so"),
  ],
  "/tu-vi": [
    cum("menh-tuoi", "bat-tu"),
    { duong: "/tu-vi#hop-tham", ten: "Xem lá số 2 người", hinh: "tu-vi", nhan: "Công cụ",
      mo_ta: "Đặt hai lá số Tử vi cạnh nhau: mệnh nạp âm, can chi, cung phi và tứ hoá — có điểm tham khảo, kèm lý do." },
  ],
  "/bat-tu": [
    { duong: "/xem-ngay-tot", ten: "Xem ngày tốt theo tuổi", hinh: "bat-tu", nhan: "Công cụ",
      mo_ta: "Hoàng lịch từng ngày: việc nên làm, giờ hoàng đạo, ngày xung tuổi — chọn ngày cưới hỏi, khai trương, về nhà mới." },
  ],
  "/kinh-dich": [
    { duong: "/hom-nay#que-ngay", ten: "Quẻ đầu ngày", hinh: "kinh-dich", nhan: "Công cụ",
      mo_ta: "Mỗi sáng một quẻ Mai Hoa kèm lời nói nôm na, và quẻ riêng theo hai con số bạn tự nghĩ tới." },
    { duong: "/tu-dien", ten: "Từ điển thuật ngữ", hinh: "kinh-dich", nhan: "Thư viện",
      mo_ta: "Hào động, quẻ biến, thể – dụng, lục thân… hơn 200 thuật ngữ của năm mảng, giải nghĩa bằng lời đời thường." },
  ],
  "/phong-thuy": [
    { duong: "/xem-tuoi-lam-nha", ten: "Xem tuổi làm nhà", hinh: "phong-thuy", nhan: "Công cụ",
      mo_ta: "Năm nay tuổi bạn có phạm Kim lâu, Hoang ốc, Tam tai không — và nếu cần mượn tuổi thì chọn tuổi nào." },
    { duong: "/tuoi-xong-dat", ten: "Tuổi xông đất", hinh: "phong-thuy", nhan: "Công cụ",
      mo_ta: "Tuổi nào hợp xông đất đầu năm với gia chủ — chỉ liệt kê tuổi hợp và lý do, không chấm điểm." },
  ],
};

/** Lối đi chung cho mọi trang (thư viện, từ điển, nhịp mỗi ngày, lịch). */
const CHUNG: TheLap[] = [
  { duong: "/kien-thuc", ten: "Thư viện kiến thức", hinh: "tu-vi", nhan: "Thư viện",
    mo_ta: "Hơn 600 trang tra cứu: ý nghĩa con số, chính tinh ở từng cung, 64 quẻ, thập thần, tuổi hợp hướng." },
  { duong: "/hom-nay", ten: "Hôm nay của bạn", hinh: "than-so", nhan: "Công cụ",
    mo_ta: "Ngày cá nhân, câu tự soi và giờ hoàng đạo — mỗi ngày một trang mới, tính từ ngày sinh của bạn." },
  { duong: "/tu-dien", ten: "Từ điển thuật ngữ", hinh: "kinh-dich", nhan: "Thư viện",
    mo_ta: "Hơn 200 thuật ngữ của Thần số, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ — giải nghĩa bằng lời đời thường." },
  { duong: "/xem-ngay-tot", ten: "Xem ngày tốt", hinh: "bat-tu", nhan: "Công cụ",
    mo_ta: "Hoàng lịch từng ngày: việc nên làm, giờ hoàng đạo, tuổi xung — cho cưới hỏi, khai trương, về nhà mới." },
];

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
export function theLap(can: number, { tru, boQua = [], coCongCu = false }: { tru?: string | null; boQua?: string[]; coCongCu?: boolean } = {}): TheLap[] {
  if (can <= 0) return [];
  const da = new Set(boQua.map(goc));
  const cc = coCongCu && tru ? theCongCu(tru) : null;
  const ungVien: TheLap[] = [
    ...(cc ? [cc] : []),
    ...(tru ? dsCumTru(tru).map((c) => ({ duong: c.duong, ten: c.ten, mo_ta: c.mo_ta, hinh: c.hinh, nhan: "Kiến thức" as const })) : []),
    ...(tru ? CHEO[tru] ?? [] : []),
    ...CHUNG,
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
export function theLapBlog(soBai: number, mang: MangBlog, daHien: string[]): TheLap[] {
  const tt = THONG_TIN_MANG[mang];
  return theLap(soCanLap(soBai) || (soBai === 0 ? 3 : 0), { tru: tt.duong, boQua: [tt.duong, ...daHien] });
}


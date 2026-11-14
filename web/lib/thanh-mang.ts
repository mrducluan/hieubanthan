// TM-1 (chủ dự án duyệt 2026-11-03, phương án A của docs/audit-2026-11/H-de-xuat-dieu-huong.md) — "thanh mảng": thanh
// điều hướng phụ của MỖI mảng, dính ngay dưới menu chính, hiện trên trang công cụ + mọi trang cụm + trang con của mảng.
// Mục đầu = công cụ của mảng (tên theo việc người dùng làm), các mục sau = cụm kiến thức (số trang đếm từ engine).
// Dùng được ở trình duyệt (không gọi engine). Nhãn sửa ở CMS "Chữ dùng chung" (khoá thanh.<mảng>.<mục>, lib/chu/chung.ts);
// ĐƯỜNG DẪN + thứ tự khoá trong code (sửa nhầm không làm gãy link).
import CHUYEN from "@/lib/chuyen-huong.json";

const CUM = CHUYEN.chu_de as Record<string, string>;

/** `dem`: cách đếm số trang — khoá CHU_DE (đếm theo mục lục engine) hoặc nguồn riêng; không có = không hiện số. */
export type MucThanh = { ma: string; duong: string; nhan: string; dem?: string;
  /** EN-ALL: nhãn bản Anh (chỉ hiện khi trang của mục có bản Anh đã mở — lib/duong-en). */ en: string };
export type ThanhMang = { tru: string; ma: string; ten: string; en: string; muc: MucThanh[] };

const cum = (khoa: string) => {
  const d = CUM[khoa];
  if (!d) throw new Error(`Thanh mảng: cụm ${khoa} chưa có trong lib/chuyen-huong.json`);
  return d;
};

export const THANH_MANG: readonly ThanhMang[] = [
  { tru: "/tu-vi", ma: "tuvi", ten: "Tử vi", en: "Zi Wei Dou Shu", muc: [
    { ma: "cong_cu", duong: "/tu-vi", nhan: "Lá số của tôi", en: "My chart" },
    { ma: "chinh_tinh", duong: cum("tu-vi"), nhan: "Chính tinh", dem: "tu-vi", en: "Main stars" },
    { ma: "cung", duong: cum("cung-tu-vi"), nhan: "Cung", dem: "cung-tu-vi", en: "Palaces" },
    { ma: "sao_cung", duong: cum("sao-cung"), nhan: "Sao ở cung", dem: "sao-cung", en: "Star in palace" },
    { ma: "tu_hoa", duong: cum("tu-hoa"), nhan: "Tứ hoá", dem: "tu-hoa", en: "Four Transformations" },
    { ma: "la_so_mau", duong: "/tu-vi/la-so-mau", nhan: "Lá số mẫu", dem: "la-so-mau", en: "Sample charts" },
    { ma: "co_thu", duong: cum("co-thu"), nhan: "Cổ thư", en: "Classics" },
  ] },
  { tru: "/bat-tu", ma: "battu", ten: "Bát tự", en: "BaZi", muc: [
    { ma: "cong_cu", duong: "/bat-tu", nhan: "Lá số của tôi", en: "My chart" },
    { ma: "menh_nam", duong: cum("menh-tuoi"), nhan: "Sinh năm nào mệnh gì", dem: "menh-tuoi", en: "Element by birth year" },
    { ma: "thap_than", duong: cum("thap-than"), nhan: "Thập thần", dem: "thap-than", en: "Ten Gods" },
    { ma: "nhat_chu", duong: cum("nhat-chu"), nhan: "Nhật chủ", dem: "nhat-chu", en: "Day Masters" },
  ] },
  // "Quẻ đầu ngày" (mockup) cần hồ sơ ở /hom-nay → thanh trỏ "Quẻ theo giờ" (Mai Hoa giờ hiện tại, ai cũng xem được).
  { tru: "/kinh-dich", ma: "kinhdich", ten: "Kinh Dịch", en: "I Ching", muc: [
    { ma: "cong_cu", duong: "/kinh-dich", nhan: "Gieo quẻ", en: "Cast a hexagram" },
    { ma: "que", duong: cum("kinh-dich"), nhan: "64 quẻ", dem: "kinh-dich", en: "64 hexagrams" },
    { ma: "mai_hoa", duong: "/kinh-dich?cach=mai_hoa", nhan: "Quẻ theo giờ", en: "Hexagram of the hour" },
  ] },
  { tru: "/phong-thuy", ma: "phongthuy", ten: "Phong thuỷ", en: "Feng Shui", muc: [
    { ma: "cong_cu", duong: "/phong-thuy", nhan: "Nhà của tôi", en: "My home" },
    { ma: "huong_tuoi", duong: CHUYEN.tuoi_huong, nhan: "Hướng hợp tuổi", dem: "cung-phi", en: "Best directions" },
    { ma: "dau_hieu", duong: cum("dau-hieu"), nhan: "Dấu hiệu trong nhà", dem: "dau-hieu", en: "Signs in the home" },
    { ma: "huong_xau", duong: "/phong-thuy/huong-xau-nam", nhan: "Hướng xấu theo năm", en: "Afflicted directions" },
  ] },
  { tru: "/than-so", ma: "thanso", ten: "Thần số", en: "Numerology", muc: [
    { ma: "cong_cu", duong: "/than-so", nhan: "Số của tôi", en: "My numbers" },
    { ma: "y_nghia", duong: cum("than-so"), nhan: "Ý nghĩa số", dem: "than-so", en: "Life Path numbers" },
    { ma: "nghe", duong: cum("nghe-nghiep"), nhan: "Nghề nghiệp", dem: "nghe-nghiep", en: "Careers" },
    { ma: "tinh_yeu", duong: cum("tinh-yeu"), nhan: "Tình yêu", dem: "tinh-yeu", en: "Love" },
    { ma: "nam_ca_nhan", duong: cum("nam-ca-nhan"), nhan: "Năm cá nhân", dem: "nam-ca-nhan", en: "Personal year" },
    { ma: "so_kep", duong: cum("so-kep"), nhan: "Số kép", dem: "so-kep", en: "Compound numbers" },
    { ma: "no_nghiep", duong: cum("no-nghiep"), nhan: "Nợ nghiệp", dem: "no-nghiep", en: "Karmic debt" },
  ] },
  // NT-1: Nhân tướng học — công cụ tự quan sát + cụm bộ vị gương mặt.
  { tru: "/nhan-tuong", ma: "nhantuong", ten: "Nhân tướng", en: "Face reading", muc: [
    { ma: "cong_cu", duong: "/nhan-tuong", nhan: "Gương mặt của tôi", en: "My face" },
    { ma: "bo_vi", duong: cum("bo-vi"), nhan: "Bộ vị gương mặt", dem: "bo-vi", en: "Face areas" },
    { ma: "hoi", duong: "/nhan-tuong#hoi-dap", nhan: "Hỏi về một vùng", en: "Ask about an area" },
  ] },
  // TR-1: Tarot — công cụ trải bài + cụm 78 lá.
  { tru: "/tarot", ma: "tarot", ten: "Tarot", en: "Tarot", muc: [
    { ma: "cong_cu", duong: "/tarot", nhan: "Trải bài của tôi", en: "My spread" },
    { ma: "la_bai", duong: cum("la-bai"), nhan: "78 lá bài", dem: "la-bai", en: "78 cards" },
    { ma: "hoi", duong: "/tarot#hoi-dap", nhan: "Hỏi về một lá", en: "Ask about a card" },
  ] },
  // "Số trong tình yêu" nằm dưới /than-so (silo) nhưng thuộc ý định hợp đôi → thanh Hợp đôi trỏ cùng cụm.
  { tru: "/hop-doi", ma: "hopdoi", ten: "Hợp đôi", en: "Compatibility", muc: [
    { ma: "cong_cu", duong: "/hop-doi", nhan: "Xem hợp đôi", en: "Check compatibility" },
    { ma: "hai_la_so", duong: "/tu-vi#hop-tham", nhan: "Xem lá số 2 người", en: "Compare two charts" },
    { ma: "cap_so", duong: cum("hop-so"), nhan: "Cặp số hợp nhau", dem: "hop-so", en: "Number pairs" },
    { ma: "tinh_yeu", duong: cum("tinh-yeu"), nhan: "Số trong tình yêu", dem: "tinh-yeu", en: "Numbers in love" },
  ] },
];

/** Khoá chữ CMS của một mục: "thanh.tuvi.sao_cung". */
export const khoaChu = (t: Pick<ThanhMang, "ma">, m: Pick<MucThanh, "ma">) => `thanh.${t.ma}.${m.ma}`;

const boDuoi = (h: string) => h.split(/[?#]/)[0]!;

/** Thanh của đường dẫn đang xem: theo đoạn đầu (trang trụ của silo). /tu-vi/sao-o-cung/x → Tử vi; /xem-sao-han → null. */
export function thanhCua(duong: string): ThanhMang | null {
  const tru = `/${boDuoi(duong).split("/")[1] ?? ""}`;
  return THANH_MANG.find((t) => t.tru === tru) ?? null;
}

/** Mục đang xem: đường dẫn dài nhất khớp (cụm và trang con của cụm); mục công cụ chỉ sáng khi đúng trang công cụ.
 *  Mục có ?query (một chế độ của công cụ, vd ?cach=mai_hoa) sáng khi đường dẫn đang xem có đúng query đó và thắng mục
 *  công cụ; mục có # (lối tắt tới một khối) không bao giờ sáng. Không khớp → -1. */
export function mucDangXem(t: ThanhMang, duong: string): number {
  const p = boDuoi(duong).replace(/\/$/, "") || "/";
  const q = duong.split("#")[0]!.slice(p.length).replace(/^\//, "");
  let tot = -1, dai = -1;
  t.muc.forEach((m, i) => {
    if (m.duong.includes("#")) return;
    const [k, mq] = m.duong.split("?") as [string, string | undefined];
    const khop = mq !== undefined ? p === k && new URLSearchParams(q).toString().split("&").includes(mq)
      : k === t.tru ? p === k : p === k || p.startsWith(`${k}/`);
    if (khop && m.duong.length > dai) { tot = i; dai = m.duong.length; }
  });
  return tot;
}

/** (Trình duyệt) chiều cao vùng dính trên cùng đang che nội dung: menu chính + thanh mảng nếu đang hiện. Đo thật. */
export function caoDinhTren(): number {
  const dau = document.querySelector<HTMLElement>("[data-thanh-dau]")?.getBoundingClientRect().height ?? 0;
  const tm = document.querySelector<HTMLElement>("[data-thanh-mang]");
  return dau + (tm && tm.dataset.an !== "1" ? tm.getBoundingClientRect().height : 0);
}

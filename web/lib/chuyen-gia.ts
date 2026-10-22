// EEAT-1 — hồ sơ chuyên gia + nhãn "ai viết / ai thẩm định" (chủ dự án yêu cầu 2026-10-09).
// Engine chỉ trả mã chuyên gia (chu_bien / tac_gia / tham_dinh.nguoi); web tra hồ sơ hiển thị ở đây.
// NGUYÊN TẮC: chỉ ghi điều chuyên gia đã tự công bố. Không bịa thầy, sách, giải thưởng, số khách. Thêm chi tiết →
// chủ dự án cung cấp rồi mới điền (docs/VIEC-CUA-ANH.md mục M).
import { siteUrl, urlDayDu } from "@/lib/seo";

export interface ChuyenGia {
  slug: string;
  ten: string;
  vaiTro: string;
  /** Một câu ngắn hiện dưới tên (byline, thẻ). */
  tomTat: string;
  /** GN-1: thâm niên hiển thị ở chữ ký "Góc nhìn chuyên gia", ví dụ "hơn 15 năm". */
  thamNien: string;
  linhVuc: string[];
  gioiThieu: string[];
  /** Hồ sơ mạng xã hội / trang cá nhân do chuyên gia cung cấp (schema sameAs). */
  sameAs: string[];
}

export const CHUYEN_GIA: Record<string, ChuyenGia> = {
  "duc-luan": {
    slug: "duc-luan",
    ten: "Đức Luân",
    vaiTro: "Người sáng lập · Chủ biên nội dung",
    tomTat: "Hơn 15 năm nghiên cứu thần số học, Tử vi, Bát tự, Phong thuỷ và Kinh Dịch.",
    thamNien: "hơn 15 năm",
    linhVuc: ["Thần số học", "Tử vi", "Bát tự", "Phong thuỷ", "Kinh Dịch"],
    gioiThieu: [
      "Đức Luân là người sáng lập Hiểu Bản Thân, với hơn 15 năm nghiên cứu thần số học, Tử vi, Bát tự, Phong thuỷ và Kinh Dịch.",
      "Anh tự biên soạn phần ý nghĩa 12 con số thần số học Pythagoras bản tiếng Việt — nền của mọi bài đọc thần số trên trang — và chịu trách nhiệm biên tập toàn bộ kho tri thức: chọn trường phái mặc định (âm lịch Việt Nam, độ sáng sao Nam phái, Hoả Linh lối Việt…), đặt ranh giới nội dung, và thẩm định từng bài trước khi gỡ nhãn chờ duyệt.",
      "Quan điểm của anh: các hệ thống này là di sản văn hoá để tự soi, không phải lời phán định mệnh. Vì vậy mọi bài đều nêu cả mặt sáng lẫn mặt tối, ghi nguồn và trường phái, và không bàn chuyện bệnh tật, sống chết hay \"giải hạn\".",
    ],
    sameAs: [],
  },
};

/** Ảnh chân dung công khai (đặt tệp vào web/public khi chủ dự án gửi ảnh — VIEC-CUA-ANH mục M2). */
const CHUYEN_GIA_ANH: Record<string, string | undefined> = {};

export const duongChuyenGia = (slug: string) => `/tac-gia/${slug}`;
export const idChuyenGia = (slug: string) => `${siteUrl()}${duongChuyenGia(slug)}#nguoi`;

/** sameAs = hồ sơ trong code + env máy chủ `CHUYEN_GIA_SAME_AS_<SLUG>` (link https cách nhau dấu phẩy, ví dụ
 *  CHUYEN_GIA_SAME_AS_DUC_LUAN) — chủ dự án tự đặt link hồ sơ thật, không cần sửa code (VIEC-CUA-ANH mục M3). */
export function sameAsChuyenGia(cg: ChuyenGia): string[] {
  const env = typeof process !== "undefined" ? process.env[`CHUYEN_GIA_SAME_AS_${cg.slug.toUpperCase().replace(/-/g, "_")}`] ?? "" : "";
  return [...new Set([...cg.sameAs, ...env.split(",").map((x) => x.trim()).filter((x) => /^https:\/\/[^\s]+$/.test(x))])];
}

export function ldNguoi(cg: ChuyenGia) {
  return {
    "@type": "Person",
    "@id": idChuyenGia(cg.slug),
    name: cg.ten,
    url: urlDayDu(duongChuyenGia(cg.slug)),
    jobTitle: cg.vaiTro,
    description: cg.tomTat,
    knowsAbout: cg.linhVuc,
    ...(CHUYEN_GIA_ANH[cg.slug] ? { image: urlDayDu(CHUYEN_GIA_ANH[cg.slug]!) } : {}),
    worksFor: { "@id": `${siteUrl()}/#to-chuc` },
    ...(sameAsChuyenGia(cg).length ? { sameAs: sameAsChuyenGia(cg) } : {}),
  };
}

export const ngayVN = (iso: string) => iso.split("-").reverse().join("/");

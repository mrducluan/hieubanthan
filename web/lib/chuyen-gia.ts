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

export const duongChuyenGia = (slug: string) => `/tac-gia/${slug}`;
export const idChuyenGia = (slug: string) => `${siteUrl()}${duongChuyenGia(slug)}#nguoi`;

export function ldNguoi(cg: ChuyenGia) {
  return {
    "@type": "Person",
    "@id": idChuyenGia(cg.slug),
    name: cg.ten,
    url: urlDayDu(duongChuyenGia(cg.slug)),
    jobTitle: cg.vaiTro,
    description: cg.tomTat,
    knowsAbout: cg.linhVuc,
    worksFor: { "@id": `${siteUrl()}/#to-chuc` },
    ...(cg.sameAs.length ? { sameAs: cg.sameAs } : {}),
  };
}

export const ngayVN = (iso: string) => iso.split("-").reverse().join("/");

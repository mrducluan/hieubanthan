// HH-1 — dữ liệu dùng chung của hub /huyen-hoc: trang HTML (app/huyen-hoc/page.tsx) và bản Markdown cho bot AI
// (/huyen-hoc.md → lib/markdown.ts mdHuyenHoc). Một nguồn → hai bản không lệch nhau. Chữ ở CHU_HUYEN_HOC (CMS sửa được).
import type { KieuMang } from "@/components/minh-hoa/TrangTri";
import type { MangAnh } from "@/lib/seo";

export type KhoaMangHH = "than_so" | "tu_vi" | "bat_tu" | "phong_thuy" | "kinh_dich";
export type MangHH = { khoa: KhoaMangHH; href: string; kieu: KieuMang; mang: MangAnh; han: string; lop: string };

// Thứ tự = thứ tự đọc: thần số (cửa vào) → hai lá số → nhà → một việc. Lưới 6 cột: hai thẻ lớn rồi ba thẻ.
export const MANG_HH: MangHH[] = [
  { khoa: "than_so", href: "/than-so", kieu: "than-so", mang: "than-so", han: "數", lop: "lg:col-span-3" },
  { khoa: "tu_vi", href: "/tu-vi", kieu: "tu-vi", mang: "tu-vi", han: "紫微", lop: "lg:col-span-3" },
  { khoa: "bat_tu", href: "/bat-tu", kieu: "bat-tu", mang: "bat-tu", han: "八字", lop: "lg:col-span-2" },
  { khoa: "phong_thuy", href: "/phong-thuy", kieu: "phong-thuy", mang: "phong-thuy", han: "風水", lop: "lg:col-span-2" },
  { khoa: "kinh_dich", href: "/kinh-dich", kieu: "kinh-dich", mang: "kinh-dich", han: "易經", lop: "md:col-span-2 lg:col-span-2" },
];

/** Đích của 6 câu "Bạn đang băn khoăn điều gì?" (chữ: hoi.cau_n / hoi.den_n). */
export const HOI_HH = ["/than-so", "/hop-doi", "/tu-vi", "/kinh-dich", "/phong-thuy", "/xem-ngay-tot"] as const;

/** Năm dương lịch hiện tại theo giờ Việt Nam (chỉ để dựng link /lich-am/{năm}). */
export const namNayVn = () => Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()));

/** Đích của 8 công cụ lịch & tuổi (chữ: lich.ten_n / lich.mo_n). */
export const lichHH = (nam: number) => ["/hom-nay", "/xem-ngay-tot", "/xem-tuoi-lam-nha", "/tuoi-xong-dat", "/phong-thuy/huong-xau-nam",
  "/phong-thuy/huong-hop-tuoi", `/lich-am/${nam}`, "/doi-lich-am-duong"];

export const SO_CACH_HH = 3;

/** Lối tra cứu thêm cho mảng ít cụm kiến thức (chân thẻ không trơ một chip). Chỉ trang có thật trong site. */
export const TRA_CUU_THEM: Partial<Record<KhoaMangHH, { duong: string; ten: string; khoa: null }[]>> = {
  kinh_dich: [{ duong: "/hom-nay", ten: "Quẻ đầu ngày", khoa: null }, { duong: "/tu-dien", ten: "Từ điển thuật ngữ", khoa: null }],
};

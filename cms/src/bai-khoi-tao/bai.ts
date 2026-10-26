// BLOG-6 — bài khởi tạo cho mảng chưa có bài (Kinh Dịch · Bát tự · Phong thuỷ). Mỗi bài là một tệp JSON trong thư mục
// này (git là nguồn); migration `bai_khoi_tao` tạo thành BÀI NHÁP trong CMS — Chủ biên đọc, sửa, gắn ảnh bìa rồi tự bấm
// Xuất bản (máy không xuất bản thay, không ký thẩm định thay). Thân bài viết bằng HTML đơn giản (h2/h3/p/ul/ol/table/a/
// strong/em) → Lexical bằng bộ đọc có sẵn `lib/html-lexical.ts`. Test `bai.test.ts` chạy đúng bộ kiểm định của CMS.
import { htmlSangKhoi, thayAnh } from "../lib/html-lexical.ts";

export type BaiKhoiTao = {
  slug: string; tieu_de: string; mang: "kinh_dich" | "bat_tu" | "phong_thuy";
  loai_bai: "bai_viet" | "huong_dan";
  tu_khoa_chinh: string; tu_khoa_phu: string[]; the: string[];
  mo_ta_ngan: string; tra_loi_nhanh: string;
  meta: { title: string; description: string };
  html: string;
  hoi_dap: { cau_hoi: string; tra_loi: string }[];
  nguon: { ten: string; url?: string }[];
  /** 4 ảnh 1600×900 như phiếu mẫu "Thần số học là gì": ảnh bìa + 3 ảnh trong bài. `vi_tri` = chèn ngay sau H2 có chữ này
   *  ("bia" = ảnh bìa). `hinh` = mô tả nội dung hình để dựng ảnh (chữ, số liệu đúng với bài). Migration chưa tải ảnh — Chủ
   *  biên tải từ phiếu nhập rồi chèn; kiểm định báo "anh_bia" tới khi có. */
  anh?: { ten_tep: string; alt: string; vi_tri: string; hinh: string }[];
};

/** Thân bài HTML → state Lexical đủ gốc (bài khởi tạo không có ảnh trong thân → chỗ ảnh nếu có bị bỏ). */
export const noiDungLexical = (html: string) => thayAnh(htmlSangKhoi(html), () => null);

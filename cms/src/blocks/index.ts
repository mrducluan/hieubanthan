// Khối chèn trong trình soạn Lexical. Mỗi khối có bộ chuyển HTML tương ứng (lib/html.ts) — web chỉ nhận HTML đã lọc.
import type { Block } from "payload";

export const CONG_CU = [
  { label: "Thần số học — tính số chủ đạo", value: "/than-so" },
  { label: "Hôm nay của bạn", value: "/hom-nay" },
  { label: "Hợp đôi", value: "/hop-doi" },
  { label: "Lá số Tử vi", value: "/tu-vi" },
  { label: "Bát tự", value: "/bat-tu" },
  { label: "Gieo quẻ Kinh Dịch", value: "/kinh-dich" },
  { label: "Phong thuỷ — hướng hợp tuổi", value: "/phong-thuy" },
] as const;

export const GhiChu: Block = {
  slug: "ghi_chu",
  interfaceName: "KhoiGhiChu",
  labels: { singular: "Hộp ghi chú", plural: "Hộp ghi chú" },
  fields: [
    {
      name: "kieu", label: "Kiểu", type: "select", required: true, defaultValue: "luu_y",
      options: [
        { label: "Lưu ý", value: "luu_y" },
        { label: "Mẹo", value: "meo" },
        { label: "Tự soi (câu hỏi cho người đọc)", value: "tu_soi" },
        { label: "Tóm tắt", value: "tom_tat" },
      ],
    },
    { name: "tieu_de", label: "Tiêu đề hộp", type: "text", maxLength: 80 },
    { name: "noi_dung", label: "Nội dung", type: "textarea", required: true, maxLength: 800 },
  ],
};

export const KeuGoiCongCu: Block = {
  slug: "keu_goi",
  interfaceName: "KhoiKeuGoi",
  labels: { singular: "Mời dùng công cụ", plural: "Mời dùng công cụ" },
  fields: [
    { name: "cong_cu", label: "Công cụ", type: "select", required: true, options: [...CONG_CU] },
    { name: "loi_moi", label: "Lời mời", type: "text", required: true, maxLength: 140,
      admin: { description: "Vd \"Xem số chủ đạo của bạn — miễn phí, có từng bước tính\"." } },
    { name: "nut", label: "Chữ trên nút", type: "text", defaultValue: "Xem của tôi", maxLength: 30 },
  ],
};

export const TrichDan: Block = {
  slug: "trich_dan",
  interfaceName: "KhoiTrichDan",
  labels: { singular: "Trích dẫn có nguồn", plural: "Trích dẫn có nguồn" },
  fields: [
    { name: "cau", label: "Câu trích", type: "textarea", required: true, maxLength: 600 },
    { name: "nguon", label: "Nguồn (sách, chương, trường phái)", type: "text", required: true, maxLength: 160 },
    { name: "dich_nghia", label: "Dịch nghĩa / giải thích", type: "textarea", maxLength: 600 },
  ],
};

export const KHOI = [GhiChu, KeuGoiCongCu, TrichDan];

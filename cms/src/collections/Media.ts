// Ảnh minh hoạ bài viết (ảnh biên tập — KHÔNG phải ảnh người dùng). Bắt buộc alt; tự sinh cỡ webp.
import type { CollectionConfig } from "payload";
import { ai, nguoiViet, chiChuBien, taiAnh } from "../access";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Ảnh", plural: "Thư viện ảnh" },
  admin: { group: "Nội dung", defaultColumns: ["filename", "alt", "updatedAt"], description: "Ảnh dưới 5 MB, nên rộng ≥ 1600px (ảnh bìa ≥ 1200px). Hệ thống tự nén WebP và sinh cỡ 480/960/1600 + ảnh chia sẻ 1200×630. Ghi alt mô tả đúng nội dung ảnh (người khiếm thị và Google đọc alt)." },
  access: { read: ai, create: taiAnh, update: nguoiViet, delete: chiChuBien },
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    focalPoint: true,
    formatOptions: { format: "webp", options: { quality: 82 } },
    imageSizes: [
      { name: "nho", width: 480, formatOptions: { format: "webp", options: { quality: 78 } } },
      { name: "vua", width: 960, formatOptions: { format: "webp", options: { quality: 80 } } },
      // Ảnh rộng cho màn hình độ phân giải cao (retina) — chỉ sinh khi ảnh gốc ≥ 1600px, không phóng to ảnh nhỏ.
      { name: "lon", width: 1600, withoutEnlargement: true, formatOptions: { format: "webp", options: { quality: 80 } } },
      { name: "og", width: 1200, height: 630, position: "centre", formatOptions: { format: "webp", options: { quality: 82 } } },
    ],
    adminThumbnail: "nho",
  },
  fields: [
    { name: "alt", label: "Mô tả ảnh (alt)", type: "text", required: true, maxLength: 160 },
    { name: "chu_thich", label: "Chú thích", type: "text", maxLength: 200 },
    { name: "nguon_anh", label: "Nguồn / bản quyền ảnh", type: "text",
      admin: { description: "Ảnh tự vẽ/tự chụp ghi \"Hiểu Bản Thân\". Ảnh lấy nơi khác phải có quyền dùng." } },
  ],
};

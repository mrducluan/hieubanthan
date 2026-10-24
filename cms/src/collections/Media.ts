// Ảnh minh hoạ bài viết (ảnh biên tập — KHÔNG phải ảnh người dùng). Bắt buộc alt; tự sinh cỡ webp.
import { APIError, type CollectionConfig } from "payload";
import { ai, nguoiViet, chiChuBien, laChuBien, taiAnh } from "../access";
import { cauHinhKho, kiemKhoAnh, LOI_CHUA_NOI_KHO } from "../lib/kho-anh";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Ảnh", plural: "Thư viện ảnh" },
  // Trần 4,5 MB = giới hạn thân yêu cầu của hàm Vercel (ảnh 4,6–5 MB trước đây lọt qua CMS rồi hỏng ở Vercel với lỗi khó hiểu).
  admin: { group: "Nội dung", defaultColumns: ["filename", "alt", "updatedAt"],
    description: "Ảnh JPG/PNG/WebP dưới 4,5 MB, nên rộng ≥ 1600px (ảnh bìa ≥ 1200px). Hệ thống tự nén WebP và sinh cỡ 480/960/1600 + ảnh chia sẻ 1200×630. Ghi alt mô tả đúng nội dung ảnh (người khiếm thị và Google đọc alt).",
    components: { beforeListTable: ["/components/KiemKhoAnh#KiemKhoAnh"] } },
  access: { read: ai, create: taiAnh, update: nguoiViet, delete: chiChuBien },
  hooks: {
    // Trên Vercel mà chưa nối S3 → báo thẳng lý do (ổ đĩa chỉ đọc) thay vì để Payload báo chung chung sau khi sharp chạy xong.
    beforeOperation: [({ operation, req }) => {
      if ((operation === "create" || operation === "update") && req.file && cauHinhKho().nguon === "dia" && cauHinhKho().vercel) {
        throw new APIError(LOI_CHUA_NOI_KHO, 400);
      }
    }],
    // "There was a problem while uploading the file." (FileUploadError) → lời tiếng Việt chỉ đường tới nút Kiểm tra kho ảnh.
    afterError: [({ error, result }) => {
      if (error?.name !== "FileUploadError") return;
      return { status: 400, response: { ...(result ?? {}), errors: [{ name: "FileUploadError",
        message: "Không xử lý được tệp ảnh (đổi WebP / tạo cỡ ảnh hoặc ghi vào kho). Mở Thư viện ảnh → bấm \"Kiểm tra kho ảnh\" để xem nguyên nhân cụ thể; thử ảnh JPG/PNG dưới 4,5 MB." }] } };
    }],
  },
  endpoints: [
    {
      // Chủ biên / Quản trị: tải thử một ảnh 16×16 qua đúng đường đi (sharp → kho → URL) rồi xoá, trả từng bước + gợi ý.
      path: "/kiem-kho", method: "get",
      handler: async (req) => {
        if (!laChuBien(req)) return Response.json({ loi: "Chỉ Quản trị / Chủ biên." }, { status: 403 });
        return Response.json(await kiemKhoAnh(req.payload));
      },
    },
    {
      path: "/kho", method: "get",
      handler: async (req) => {
        if (!laChuBien(req)) return Response.json({ loi: "Chỉ Quản trị / Chủ biên." }, { status: 403 });
        const { nguon, vercel, thieu } = cauHinhKho();
        return Response.json({ nguon, vercel, thieu });
      },
    },
  ],
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    // Payload chỉ chặn theo cỡ ở config.upload.limits (payload.config.ts) — giữ 4,5 MB ở đó.
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

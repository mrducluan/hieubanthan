// Hồ sơ người đứng tên trên bài (E-E-A-T). Chỉ ghi điều người đó đã công bố — không bịa chức danh, kinh nghiệm.
import type { CollectionConfig } from "payload";
import { slugField } from "payload";
import { ai, chiChuBien } from "../access";
import { lamMoiKhiDoi } from "../hooks/lamMoiWeb";
import { slugTuTruong, taoSlug } from "../lib/slug";

export const TacGia: CollectionConfig = {
  slug: "tac-gia",
  labels: { singular: "Chuyên gia / tác giả", plural: "Chuyên gia / tác giả" },
  admin: {
    useAsTitle: "ten", defaultColumns: ["ten", "chuc_danh", "updatedAt"], group: "Nội dung",
    description: "Người ký tên trên bài. Chỉ ghi thông tin chính người đó đã công bố (EEAT-1).",
  },
  access: { read: ai, create: chiChuBien, update: chiChuBien, delete: chiChuBien },
  hooks: { beforeValidate: [slugTuTruong("ten")], afterChange: [lamMoiKhiDoi] },
  fields: [
    { name: "ten", label: "Tên", type: "text", required: true },
    { name: "chuc_danh", label: "Chức danh / vai trò", type: "text",
      admin: { description: "Vd \"Chủ biên · nghiên cứu thần số học 10 năm\"." } },
    { name: "gioi_thieu", label: "Giới thiệu", type: "textarea", maxLength: 1000 },
    { name: "anh", label: "Ảnh chân dung", type: "upload", relationTo: "media" },
    {
      name: "trang_ho_so", label: "Trang hồ sơ trên web", type: "text",
      admin: { description: "Đường dẫn trong site, vd /tac-gia/duc-luan (đã có trang hồ sơ thì điền)." },
      validate: (v: unknown) => !v || (typeof v === "string" && /^\/[\w\-/]*$/.test(v)) || "Chỉ nhận đường dẫn bắt đầu bằng /",
    },
    {
      name: "lien_ket", label: "Hồ sơ công khai khác (sameAs)", type: "array",
      fields: [{ name: "url", type: "text", required: true,
        validate: (v: unknown) => (typeof v === "string" && /^https:\/\//.test(v)) || "Cần link https://" }],
    },
    slugField({ useAsSlug: "ten", slugify: taoSlug }),
  ],
};

import type { CollectionConfig } from "payload";
import { slugField } from "payload";
import { ai, chiChuBien } from "../access";
import { lamMoiKhiDoi } from "../hooks/lamMoiWeb";
import { slugTuTruong, taoSlug } from "../lib/slug";

export const ChuyenMuc: CollectionConfig = {
  slug: "chuyen-muc",
  labels: { singular: "Chuyên mục", plural: "Chuyên mục" },
  admin: { useAsTitle: "ten", defaultColumns: ["ten", "slug", "updatedAt"], group: "Nội dung" },
  access: { read: ai, create: chiChuBien, update: chiChuBien, delete: chiChuBien },
  hooks: { beforeValidate: [slugTuTruong("ten")], afterChange: [lamMoiKhiDoi] },
  fields: [
    { name: "ten", label: "Tên chuyên mục", type: "text", required: true },
    { name: "mo_ta", label: "Mô tả ngắn", type: "textarea", maxLength: 300 },
    slugField({ useAsSlug: "ten", slugify: taoSlug }),
  ],
};

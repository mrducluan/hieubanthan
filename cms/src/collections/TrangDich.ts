// CMS-3 — Trang đích (landing) dựng bằng KHỐI: chiến dịch mời bạn, dịp Tết, mùa thi, sinh nhật… đổi không cần code.
// Web hiện ở https://hieuban.com/su-kien/{slug} (web/app/su-kien/[slug]). Có nháp + lịch xuất bản + phiên bản;
// biên tập viên soạn nháp, Chủ biên xuất bản. Hết hạn (het_han) → web báo "đã kết thúc" + noindex.
// Mọi link chỉ nhận đường dẫn TRONG SITE (cùng luật với Điều hướng chân trang).
import type { Block, CollectionConfig, Where } from "payload";
import { slugField } from "payload";
import { chiChuBien, laChuBien, laNguoiViet, laNoiBo, type VaiTro } from "../access";
import { lamMoiKhiDoi } from "../hooks/lamMoiWeb";
import { slugTuTruong, taoSlug } from "../lib/slug";
import { DUONG_TRONG_SITE } from "../globals/DieuHuong";

const duong = (bat = false) => (v: unknown) =>
  (!bat && !v) || (typeof v === "string" && DUONG_TRONG_SITE.test(v)) || "Đường dẫn trong site, bắt đầu bằng / (vd /than-so)";

export const CONG_CU = [
  { label: "Thần số học", value: "than_so" }, { label: "Hôm nay của bạn", value: "hom_nay" }, { label: "Hợp đôi", value: "hop_doi" },
  { label: "Tử vi", value: "tu_vi" }, { label: "Bát tự", value: "bat_tu" }, { label: "Kinh Dịch", value: "kinh_dich" },
  { label: "Phong thuỷ", value: "phong_thuy" },
];

export const KHOI: Block[] = [
  {
    slug: "dau_trang", labels: { singular: "Đầu trang (hero)", plural: "Đầu trang" },
    fields: [
      { name: "nhan", label: "Nhãn nhỏ", type: "text", maxLength: 40 },
      { name: "tieu_de", label: "Tiêu đề lớn", type: "text", required: true, maxLength: 90 },
      { name: "mo_ta", label: "Mô tả", type: "textarea", maxLength: 300 },
      { name: "anh", label: "Ảnh", type: "upload", relationTo: "media" },
      { name: "nut_chu", label: "Chữ trên nút", type: "text", maxLength: 40 },
      { name: "nut_link", label: "Nút dẫn tới", type: "text", validate: duong() },
    ],
  },
  {
    slug: "cong_cu", labels: { singular: "Thẻ công cụ", plural: "Thẻ công cụ" },
    fields: [
      { name: "tieu_de", label: "Tiêu đề khối", type: "text", maxLength: 80 },
      { name: "ds", label: "Công cụ", type: "select", hasMany: true, required: true, options: CONG_CU },
    ],
  },
  {
    slug: "bai_viet", labels: { singular: "Danh sách bài viết", plural: "Danh sách bài viết" },
    fields: [
      { name: "tieu_de", label: "Tiêu đề khối", type: "text", maxLength: 80 },
      { name: "bai", label: "Chọn bài (để trống = bài mới nhất theo mảng)", type: "relationship", relationTo: "bai-viet", hasMany: true,
        maxRows: 6, filterOptions: { _status: { equals: "published" } } },
      { name: "mang", label: "Mảng (khi không chọn bài)", type: "select",
        options: [{ label: "Mọi mảng", value: "tat_ca" }, ...CONG_CU.filter((c) => !["hom_nay", "hop_doi"].includes(c.value)), { label: "Chung / văn hoá", value: "chung" }] },
      { name: "so_bai", label: "Số bài", type: "number", min: 1, max: 6, defaultValue: 3 },
    ],
  },
  {
    slug: "hoi_dap", labels: { singular: "Hỏi đáp (FAQ)", plural: "Hỏi đáp" },
    fields: [
      { name: "tieu_de", label: "Tiêu đề khối", type: "text", maxLength: 80 },
      { name: "ds", label: "Câu hỏi", type: "array", minRows: 1, maxRows: 10, fields: [
        { name: "cau_hoi", label: "Câu hỏi", type: "text", required: true, maxLength: 160 },
        { name: "tra_loi", label: "Trả lời", type: "textarea", required: true, maxLength: 800 },
      ] },
    ],
  },
  {
    slug: "loi_moi", labels: { singular: "Lời mời bạn bè (nhận Sao)", plural: "Lời mời bạn bè" },
    fields: [
      { name: "tieu_de", label: "Tiêu đề", type: "text", required: true, maxLength: 90, defaultValue: "Mời bạn cùng xem — cả hai cùng nhận Sao" },
      { name: "mo_ta", label: "Mô tả", type: "textarea", maxLength: 300 },
      { name: "nut_chu", label: "Chữ trên nút", type: "text", maxLength: 40, defaultValue: "Lấy link mời của tôi" },
    ],
  },
  {
    slug: "van_ban", labels: { singular: "Đoạn văn", plural: "Đoạn văn" },
    fields: [
      { name: "tieu_de", label: "Tiêu đề (H2)", type: "text", maxLength: 90 },
      { name: "noi_dung", label: "Nội dung (cách đoạn bằng một dòng trống)", type: "textarea", required: true, maxLength: 4000 },
    ],
  },
];

const vai = (req: { user?: unknown }) => (req.user as { vai_tro?: VaiTro } | null)?.vai_tro;
const xuatBan = (data: unknown) => (data as { _status?: string } | undefined)?._status === "published";

export const TrangDich: CollectionConfig = {
  slug: "trang-dich",
  labels: { singular: "Trang đích", plural: "Trang đích (sự kiện)" },
  admin: {
    useAsTitle: "tieu_de", group: "Giao diện website", defaultColumns: ["tieu_de", "slug", "het_han", "_status", "updatedAt"],
    description: "Trang chiến dịch / sự kiện ở hieuban.com/su-kien/{slug}, ghép từ khối. Biên tập viên soạn nháp, Chủ biên xuất bản.",
  },
  versions: { drafts: { autosave: { interval: 2000 }, schedulePublish: true }, maxPerDoc: 30 },
  access: {
    read: ({ req }): boolean | Where => (laNoiBo(req) ? true : { _status: { equals: "published" } }),
    create: ({ req, data }) => laChuBien(req) || (laNguoiViet(req) && !xuatBan(data)),
    update: ({ req, data }) => laChuBien(req) || (laNguoiViet(req) && !xuatBan(data) && vai(req) !== "cong_tac_vien"),
    delete: chiChuBien,
  },
  hooks: { beforeValidate: [slugTuTruong("tieu_de")], afterChange: [lamMoiKhiDoi] },
  fields: [
    { name: "tieu_de", label: "Tiêu đề trang (SEO, H1)", type: "text", required: true, maxLength: 90 },
    { name: "mo_ta_seo", label: "Mô tả SEO", type: "textarea", maxLength: 160, admin: { description: "≤ 160 ký tự, hiện trên Google + thẻ chia sẻ." } },
    { name: "anh_chia_se", label: "Ảnh chia sẻ (OG)", type: "upload", relationTo: "media" },
    { name: "khoi", label: "Các khối", type: "blocks", blocks: KHOI, minRows: 1, maxRows: 20 },
    slugField({ useAsSlug: "tieu_de", slugify: taoSlug }),
    { name: "het_han", label: "Kết thúc lúc", type: "date", admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime" },
      description: "Sau thời điểm này web báo \"đã kết thúc\" và không cho Google index. Để trống = không hết hạn." } },
    { name: "noindex", label: "Không cho Google index", type: "checkbox", defaultValue: false, admin: { position: "sidebar" } },
  ],
};

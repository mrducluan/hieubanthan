// Bài viết — nguồn nội dung cho /blog/{slug} trên web.
// Nháp tự lưu, lịch xuất bản, lịch sử phiên bản; kiểm định SEO/GEO/E-E-A-T chạy ngay khi gõ (khung bên phải)
// và chạy lại ở máy chủ trước khi lưu: có LỖI CHẶN thì không xuất bản được.
import {
  BlocksFeature, EXPERIMENTAL_TableFeature, FixedToolbarFeature, HeadingFeature, HorizontalRuleFeature,
  InlineToolbarFeature, LinkFeature, lexicalEditor, lexicalHTMLField,
} from "@payloadcms/richtext-lexical";
import { MetaDescriptionField, MetaImageField, MetaTitleField, OverviewField, PreviewField } from "@payloadcms/plugin-seo/fields";
import { APIError, slugField, type CollectionBeforeChangeHook, type CollectionBeforeValidateHook, type CollectionConfig } from "payload";
import { chiChuBien, daXuatBanHoacNoiBo, suaBai, truongChuBien, truongNoiBo } from "../access";
import { KHOI } from "../blocks";
import { lamMoiKhiDoiBai, lamMoiKhiXoaBai } from "../hooks/lamMoiWeb";
import { kiemDinhBai, slugViet, type BaiKiem } from "../kiem-dinh/kiem-dinh";
import { boChuyenHtml } from "../lib/html";
import { taoSlug } from "../lib/slug";
import { linkXemTruoc } from "../lib/web";

export const MANG = [
  { label: "Thần số học", value: "than_so" },
  { label: "Tử vi", value: "tu_vi" },
  { label: "Bát tự", value: "bat_tu" },
  { label: "Kinh Dịch", value: "kinh_dich" },
  { label: "Phong thuỷ", value: "phong_thuy" },
  { label: "Chung / văn hoá", value: "chung" },
];

const kiemDinhTruocKhiLuu: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const bai = { ...(originalDoc ?? {}), ...data } as BaiKiem & { _status?: string };
  const kq = kiemDinhBai(bai);
  if (data._status === "published" && kq.loi_chan.length && !req.context?.boQuaKiemDinh) {
    throw new APIError(
      "Chưa xuất bản được — sửa các lỗi sau rồi bấm Xuất bản lại: " + kq.loi_chan.map((m) => m.thong_diep).join(" · "),
      400, null, true,
    );
  }
  data.diem_kiem_dinh = kq.diem;
  data.ghi_chu_kiem_dinh = kq.muc.filter((m) => m.muc_do !== "dat").map((m) => m.thong_diep).join("\n");
  return data;
};

/** Đổi slug của bài ĐÃ xuất bản → giữ slug cũ để web chuyển hướng 308 (không mất link, không mất thứ hạng). */
const giuSlugCu: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  // "Đã từng xuất bản" xét bằng publishedAt (originalDoc có thể là bản NHÁP tự lưu mới nhất, _status = draft).
  const cu = originalDoc as { slug?: string; slug_cu?: string[]; publishedAt?: string | null } | undefined;
  if (cu?.slug && data.slug && cu.slug !== data.slug && cu.publishedAt) {
    const ds = new Set([...(cu.slug_cu ?? []), cu.slug]);
    ds.delete(data.slug);
    data.slug_cu = [...ds];
  }
  return data;
};

/** Slug trống (bài tự lưu trước khi gõ tiêu đề) → sinh từ tiêu đề trước khi kiểm "bắt buộc", người viết không phải tự mở khoá. */
const slugTuTieuDe: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data;
  const slug = (data.slug ?? originalDoc?.slug ?? "") as string;
  const tieuDe = (data.tieu_de ?? originalDoc?.tieu_de ?? "") as string;
  if (!String(slug).trim() && String(tieuDe).trim()) data.slug = slugViet(tieuDe);
  return data;
};

const ngayXuatBan: CollectionBeforeChangeHook = ({ data }) => {
  if (data._status === "published" && !data.publishedAt) data.publishedAt = new Date().toISOString();
  return data;
};

export const BaiViet: CollectionConfig<"bai-viet"> = {
  slug: "bai-viet",
  labels: { singular: "Bài viết", plural: "Bài viết" },
  admin: {
    useAsTitle: "tieu_de",
    defaultColumns: ["tieu_de", "mang", "diem_kiem_dinh", "_status", "updatedAt"],
    listSearchableFields: ["tieu_de", "slug", "tu_khoa_chinh"],
    group: "Nội dung",
    description: "Bài hiện ở hieuban.com/blog/{đường dẫn}. Biên tập viên lưu nháp; Chủ biên bấm Xuất bản.",
    preview: (doc) => linkXemTruoc((doc as { slug?: string }).slug),
    pagination: { defaultLimit: 25 },
  },
  defaultPopulate: { tieu_de: true, slug: true, mo_ta_ngan: true, anh_bia: true, publishedAt: true },
  access: { read: daXuatBanHoacNoiBo, create: suaBai, update: suaBai, delete: chiChuBien, readVersions: suaBai },
  versions: {
    drafts: { autosave: { interval: 2000 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  hooks: {
    beforeValidate: [slugTuTieuDe],
    beforeChange: [ngayXuatBan, giuSlugCu, kiemDinhTruocKhiLuu],
    afterChange: [lamMoiKhiDoiBai],
    afterDelete: [lamMoiKhiXoaBai],
  },
  fields: [
    {
      name: "tieu_de", label: "Tiêu đề bài (H1)", type: "text", required: true, maxLength: 120,
      admin: { description: "Câu người đọc gõ vào Google, rõ chủ đề. Nên 20–70 ký tự." },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Nội dung",
          fields: [
            { name: "anh_bia", label: "Ảnh bìa", type: "upload", relationTo: "media",
              admin: { description: "Ảnh ngang 16:9, tối thiểu 1200px. Dùng cho đầu bài và thẻ chia sẻ." } },
            {
              name: "mo_ta_ngan", label: "Sapo (mô tả ngắn)", type: "textarea", maxLength: 300,
              admin: { description: "1–2 câu dưới tiêu đề, hiện ở danh sách bài." },
            },
            {
              name: "tra_loi_nhanh", label: "Trả lời nhanh", type: "textarea", maxLength: 700,
              admin: { description: "40–80 chữ trả lời THẲNG câu hỏi chính của bài. Google và trợ lý AI hay trích nguyên đoạn này." },
            },
            {
              name: "noi_dung", label: "Thân bài", type: "richText", required: true,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures.filter((f) => !["relationship", "heading", "link", "horizontalRule", "toolbarInline", "checklist"].includes(f.key)),
                  HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
                  LinkFeature({ enabledCollections: ["bai-viet"] }),
                  BlocksFeature({ blocks: KHOI }),
                  EXPERIMENTAL_TableFeature(),
                  HorizontalRuleFeature(),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                ],
              }),
            },
            lexicalHTMLField({ htmlFieldName: "noi_dung_html", lexicalFieldName: "noi_dung", converters: boChuyenHtml }),
            {
              name: "hoi_dap", label: "Hỏi đáp (FAQ)", type: "array", maxRows: 10,
              labels: { singular: "Câu hỏi", plural: "Câu hỏi" },
              admin: { description: "3–6 câu người đọc hay hỏi. Xuất thành FAQPage cho Google và AI." },
              fields: [
                { name: "cau_hoi", label: "Câu hỏi", type: "text", required: true, maxLength: 200 },
                { name: "tra_loi", label: "Trả lời", type: "textarea", required: true, maxLength: 1200 },
              ],
            },
            {
              name: "nguon", label: "Nguồn tham khảo", type: "array", maxRows: 12,
              labels: { singular: "Nguồn", plural: "Nguồn" },
              admin: { description: "Ghi sách / cổ thư / trường phái. Không ghi tên thư viện phần mềm, nhà cung cấp (BM-1)." },
              fields: [
                { name: "ten", label: "Tên nguồn", type: "text", required: true, maxLength: 200 },
                { name: "url", label: "Link (nếu công khai)", type: "text",
                  validate: (v: unknown) => !v || (typeof v === "string" && /^https:\/\//.test(v)) || "Cần link https://" },
              ],
            },
          ],
        },
        {
          label: "SEO · GEO",
          fields: [
            {
              name: "tu_khoa_chinh", label: "Từ khoá chính", type: "text", maxLength: 80,
              admin: { description: "Cụm người đọc tìm nhiều nhất cho bài này (xem Search Console ở /quan-tri/tang-truong)." },
            },
            { name: "tu_khoa_phu", label: "Từ khoá phụ / biến thể", type: "text", hasMany: true, maxRows: 10 },
            {
              name: "meta", label: "Hiển thị trên Google & mạng xã hội", type: "group",
              fields: [
                OverviewField({ titlePath: "meta.title", descriptionPath: "meta.description", imagePath: "meta.image" }),
                MetaTitleField({ hasGenerateFn: true }),
                MetaDescriptionField({ hasGenerateFn: true }),
                MetaImageField({ relationTo: "media", hasGenerateFn: true }),
                PreviewField({ hasGenerateFn: true, titlePath: "meta.title", descriptionPath: "meta.description" }),
              ],
            },
            {
              name: "canonical", label: "URL chuẩn (canonical) khác", type: "text",
              admin: { description: "Để trống = chính bài này. Chỉ điền khi bài đăng lại từ trang khác của hieuban.com." },
              validate: (v: unknown) => !v || (typeof v === "string" && /^(\/|https:\/\/(www\.)?hieuban\.com\/)/.test(v))
                || "Chỉ nhận đường dẫn trong hieuban.com",
            },
            { name: "noindex", label: "Không cho Google lập chỉ mục (noindex)", type: "checkbox", defaultValue: false },
            {
              name: "dua_vao_llms", label: "Đưa vào llms.txt (gợi ý cho trợ lý AI)", type: "checkbox", defaultValue: true,
            },
          ],
        },
      ],
    },
    // ---------------- cột phải
    {
      name: "kiem_dinh", type: "ui",
      admin: { position: "sidebar", components: { Field: "/components/KiemDinh#KiemDinh" } },
    },
    slugField({ useAsSlug: "tieu_de", slugify: taoSlug }),
    {
      name: "mang", label: "Mảng", type: "select", required: true, defaultValue: "chung", options: MANG,
      admin: { position: "sidebar", description: "Quyết định công cụ được mời cuối bài và bài liên quan." },
    },
    { name: "chuyen_muc", label: "Chuyên mục", type: "relationship", relationTo: "chuyen-muc", hasMany: true, admin: { position: "sidebar" } },
    { name: "the", label: "Thẻ", type: "text", hasMany: true, maxRows: 12, admin: { position: "sidebar" } },
    {
      name: "ky_ten", label: "Chữ ký trên bài", type: "select", required: true, defaultValue: "ban_bien_tap",
      access: { update: truongChuBien },
      options: [
        { label: "Ban biên tập · Chủ biên duyệt xuất bản", value: "ban_bien_tap" },
        { label: "Chuyên gia là tác giả (tự viết)", value: "tac_gia" },
        { label: "Chuyên gia thẩm định (đã đọc và duyệt)", value: "tham_dinh" },
      ],
      admin: { position: "sidebar", description: "Không ghi chuyên gia là tác giả/thẩm định bài họ chưa đọc (EEAT-1)." },
    },
    {
      name: "tac_gia", label: "Tác giả", type: "relationship", relationTo: "tac-gia",
      access: { update: truongChuBien },
      admin: { position: "sidebar", condition: (_, s) => s?.ky_ten === "tac_gia" },
    },
    {
      name: "nguoi_tham_dinh", label: "Người thẩm định", type: "relationship", relationTo: "tac-gia",
      access: { update: truongChuBien },
      admin: { position: "sidebar", condition: (_, s) => s?.ky_ten === "tham_dinh" },
    },
    {
      name: "ngay_tham_dinh", label: "Ngày thẩm định", type: "date",
      access: { update: truongChuBien },
      admin: { position: "sidebar", condition: (_, s) => s?.ky_ten === "tham_dinh", date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" } },
    },
    {
      name: "xac_nhan_tham_dinh", label: "Chuyên gia đã đọc toàn bài và đồng ý đứng tên", type: "checkbox",
      access: { update: truongChuBien, read: truongNoiBo },
      admin: { position: "sidebar", condition: (_, s) => s?.ky_ten === "tham_dinh" },
    },
    {
      name: "publishedAt", label: "Ngày xuất bản", type: "date",
      admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" } },
    },
    {
      name: "bai_lien_quan", label: "Bài liên quan", type: "relationship", relationTo: "bai-viet", hasMany: true, maxRows: 4,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: { position: "sidebar", description: "Để trống = tự lấy bài cùng mảng." },
    },
    {
      name: "diem_kiem_dinh", label: "Điểm kiểm định", type: "number", min: 0, max: 100,
      access: { read: truongNoiBo }, admin: { position: "sidebar", readOnly: true, hidden: true },
    },
    {
      name: "ghi_chu_kiem_dinh", type: "textarea",
      access: { read: truongNoiBo }, admin: { hidden: true, readOnly: true },
    },
    { name: "slug_cu", type: "text", hasMany: true, admin: { hidden: true, readOnly: true } },
  ],
};

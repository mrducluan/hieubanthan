// Bài viết — nguồn nội dung cho /blog/{slug} trên web.
// Nháp tự lưu, lịch xuất bản, lịch sử phiên bản; kiểm định SEO/GEO/E-E-A-T chạy ngay khi gõ (khung bên phải)
// và chạy lại ở máy chủ trước khi lưu: có LỖI CHẶN thì không xuất bản được.
import { kiemDauVao, soanNhap } from "../lib/soan-nhap";
import { vectoBai, vectoVan, xepHang, type Vecto } from "../kiem-dinh/vecto";
import { trangNoiBo } from "../lib/lien-ket";
import {
  BlocksFeature, EXPERIMENTAL_TableFeature, FixedToolbarFeature, HeadingFeature, HorizontalRuleFeature,
  InlineToolbarFeature, LinkFeature, lexicalEditor, lexicalHTMLField,
} from "@payloadcms/richtext-lexical";
import { MetaDescriptionField, MetaImageField, MetaTitleField, OverviewField, PreviewField } from "@payloadcms/plugin-seo/fields";
import { APIError, slugField, type CollectionBeforeChangeHook, type CollectionBeforeValidateHook, type CollectionConfig } from "payload";
import { chiChuBien, daDangNhap, laNguoiViet, daXuatBanHoacNoiBo, docPhienBan, laChuBien, laCongTacVien, suaBai, taoBai, truongBienTap, truongChuBien, truongNoiBo } from "../access";
import { KHOI } from "../blocks";
import { lamMoiKhiDoiBai, lamMoiKhiXoaBai } from "../hooks/lamMoiWeb";
import { chuanHoaDuLieu, kiemDinhBai, slugViet, TIEU_DE_TAM, type BaiKiem } from "../kiem-dinh/kiem-dinh";
import { boChuyenHtml } from "../lib/html";
import { kiemTrung } from "../lib/trung-lap";
import { taoSlug } from "../lib/slug";
import { linkXemTruoc, webUrl } from "../lib/web";
import { coKhoaNotFair, dsNotFair, nhapBaiNotFair } from "../lib/notfair";

export const MANG = [
  { label: "Thần số học", value: "than_so" },
  { label: "Tử vi", value: "tu_vi" },
  { label: "Bát tự", value: "bat_tu" },
  { label: "Kinh Dịch", value: "kinh_dich" },
  { label: "Phong thuỷ", value: "phong_thuy" },
  { label: "Chung / văn hoá", value: "chung" },
];

/** Loại bài → kiểu schema.org trên web (NewsArticle cho tin tức: Google News / Discover; BlogPosting; Article cho hướng dẫn). */
export const LOAI_BAI = [
  { label: "Bài viết (blog)", value: "bai_viet" },
  { label: "Tin tức / sự kiện", value: "tin_tuc" },
  { label: "Hướng dẫn / cẩm nang", value: "huong_dan" },
];

export const TRANG_THAI_DUYET = [
  { label: "Đang viết", value: "dang_viet" },
  { label: "Gửi duyệt", value: "cho_duyet" },
  { label: "Cần sửa", value: "can_sua" },
  { label: "Đã duyệt", value: "da_duyet" },
];

const kiemDinhTruocKhiLuu: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const bai = { ...(originalDoc ?? {}), ...data } as BaiKiem & { _status?: string };
  const kq = kiemDinhBai(bai);
  const xuatBan = data._status === "published";
  const guiDuyet = data.trang_thai_duyet === "cho_duyet" && originalDoc?.trang_thai_duyet !== "cho_duyet";
  // CG-6: so trùng lặp chỉ khi xuất bản / gửi duyệt (không chạy mỗi lần tự lưu nháp).
  const trung = (xuatBan || guiDuyet) && !req.context?.boQuaKiemDinh
    ? await kiemTrung(req.payload, bai, { id: originalDoc?.id ?? null, congTacVien: laCongTacVien(req) })
    : [];
  const chan = [...kq.loi_chan, ...trung.filter((m) => m.chan)];
  const loi = chan.map((m) => m.thong_diep).join(" · ");
  if (xuatBan && chan.length && !req.context?.boQuaKiemDinh) {
    throw new APIError("Chưa xuất bản được — sửa các lỗi sau rồi bấm Xuất bản lại: " + loi, 400, null, true);
  }
  // Gửi duyệt cũng phải sạch lỗi chặn (Chủ biên không phải đọc bài chắc chắn bị chặn).
  if (guiDuyet && chan.length) {
    throw new APIError("Chưa gửi duyệt được — sửa các lỗi sau trước: " + loi, 400, null, true);
  }
  data.diem_kiem_dinh = kq.diem;
  data.ghi_chu_kiem_dinh = [...kq.muc, ...trung].filter((m) => m.muc_do !== "dat").map((m) => m.thong_diep).join("\n");
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
  if (!String(slug).trim() && String(tieuDe).trim() && !String(tieuDe).startsWith(TIEU_DE_TAM)) data.slug = slugViet(tieuDe);
  return data;
};

/** Bài tự lưu khi chưa gõ tiêu đề → tiêu đề tạm (danh sách bài hiện "(Chưa đặt tiêu đề)" thay vì "<No Tiêu đề>").
 *  Kiểm định coi tiêu đề tạm là trống → chặn xuất bản / gửi duyệt; slug chỉ sinh khi có tiêu đề thật. */
const tieuDeTam: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data;
  const t = data.tieu_de !== undefined ? data.tieu_de : originalDoc?.tieu_de;
  if (!String(t ?? "").trim()) data.tieu_de = TIEU_DE_TAM;
  return data;
};

/** NFC + gộp khoảng trắng + bỏ khoảng trắng trước dấu câu cho MỌI chuỗi của bài (kể cả cây Lexical). */
const chuanHoaTiengViet: CollectionBeforeValidateHook = ({ data }) => (data ? chuanHoaDuLieu(data) : data);

/** Người tạo bài + quy trình duyệt cộng tác viên (không tin dữ liệu gửi lên cho các trường này). */
const quyTrinhDuyet: CollectionBeforeChangeHook = ({ data, originalDoc, operation, req }) => {
  const u = req.user as { id?: number | string; collection?: string } | null;
  if (operation === "create") data.nguoi_tao = u?.collection === "bien-tap-vien" ? u.id : (data.nguoi_tao ?? null);
  else data.nguoi_tao = originalDoc?.nguoi_tao ?? null;
  if (laCongTacVien(req)) {
    const moi = data.trang_thai_duyet ?? "dang_viet", cu = originalDoc?.trang_thai_duyet ?? "dang_viet";
    // Cộng tác viên chỉ chuyển giữa "đang viết" và "gửi duyệt"; "cần sửa"/"đã duyệt" là việc của Chủ biên.
    if (moi !== cu && !["dang_viet", "cho_duyet"].includes(moi)) {
      throw new APIError("Chỉ Chủ biên được đánh dấu \"Cần sửa\" hoặc \"Đã duyệt\".", 403, null, true);
    }
    data.ghi_chu_duyet = originalDoc?.ghi_chu_duyet ?? null;
  }
  if (data._status === "published" && laChuBien(req)) data.trang_thai_duyet = "da_duyet";
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
    defaultColumns: ["tieu_de", "loai_bai", "mang", "trang_thai_duyet", "diem_kiem_dinh", "_status", "updatedAt"],
    listSearchableFields: ["tieu_de", "slug", "tu_khoa_chinh"],
    group: "Nội dung",
    description: "Bài hiện ở hieuban.com/blog/{đường dẫn}. Biên tập viên lưu nháp; Chủ biên bấm Xuất bản.",
    preview: (doc) => linkXemTruoc((doc as { slug?: string }).slug),
    pagination: { defaultLimit: 25 },
    // BLOG-3: bảng bài NotFair + nút "Nhập vào CMS để sửa" ở đầu danh sách bài.
    components: { beforeListTable: ["/components/NhapNotFair#NhapNotFair"] },
  },
  defaultPopulate: { tieu_de: true, slug: true, mo_ta_ngan: true, anh_bia: true, publishedAt: true },
  access: { read: daXuatBanHoacNoiBo, create: taoBai, update: suaBai, delete: chiChuBien, readVersions: docPhienBan },
  versions: {
    drafts: { autosave: { interval: 2000 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  endpoints: [
    {
      // BLOG-3: danh sách bài NotFair + bài nào đã nhập vào CMS (id). Ban biên tập xem được; máy đọc/cộng tác viên thì không.
      path: "/notfair", method: "get",
      handler: async (req) => {
        if (!laNguoiViet(req)) return Response.json({ loi: "Chỉ ban biên tập." }, { status: 403 });
        if (!coKhoaNotFair()) return Response.json({ co_khoa: false, ds: [] });
        try {
          const ds = await dsNotFair();
          const da = await req.payload.find({ collection: "bai-viet", where: { slug: { in: ds.map((p) => p.slug) } },
            limit: ds.length || 1, depth: 0, draft: true, overrideAccess: true, select: { slug: true, _status: true } });
          const theoSlug = new Map(da.docs.map((d) => [d.slug, d]));
          return Response.json({ co_khoa: true, ds: ds.map((p) => {
            const d = theoSlug.get(p.slug) as { id: number | string; _status?: string } | undefined;
            return { slug: p.slug, tieu_de: p.title, ngay: p.published_at, anh: p.image_url,
              url: `${webUrl()}/blog/${encodeURIComponent(p.slug)}`,
              id_cms: d?.id ?? null, trang_thai_cms: d?._status ?? null };
          }) });
        } catch (e) {
          return Response.json({ co_khoa: true, ds: [], loi: (e as Error).message }, { status: 502 });
        }
      },
    },
    {
      // BLOG-3: nhập một bài NotFair thành NHÁP cùng slug (ảnh tải vào Thư viện ảnh). Chỉ Quản trị/Chủ biên —
      // vì khi xuất bản, bản CMS thay bản NotFair ở đúng URL đối tác đang kiểm tra.
      path: "/nhap-notfair", method: "post",
      handler: async (req) => {
        if (!laChuBien(req)) return Response.json({ loi: "Chỉ Quản trị hoặc Chủ biên được nhập bài NotFair." }, { status: 403 });
        const body = (typeof req.json === "function" ? await req.json().catch(() => ({})) : {}) as { slug?: unknown };
        const slug = typeof body.slug === "string" ? body.slug.normalize("NFC").trim() : "";
        if (!slug || slug.length > 200) return Response.json({ loi: "Thiếu đường dẫn bài." }, { status: 422 });
        try {
          return Response.json({ ok: true, ...(await nhapBaiNotFair(req.payload, req, slug)) });
        } catch (e) {
          return Response.json({ loi: (e as Error).message }, { status: 502 });
        }
      },
    },
    {
      // CMS-4: gợi ý liên kết nội bộ khi viết — bài CMS đã xuất bản + trang kiến thức/công cụ của web, xếp theo độ giống
      // từ khoá với bài đang viết (luật cố định, không AI). Trả đường dẫn để người viết chèn link.
      path: "/goi-y-lien-ket", method: "post",
      handler: async (req) => {
        if (!daDangNhap(req) || req.user?.vai_tro === "may_doc") return Response.json({ loi: "Cần đăng nhập" }, { status: 403 });
        const body = (typeof req.json === "function" ? await req.json().catch(() => ({})) : {}) as Record<string, unknown>;
        const goc = vectoBai(body);
        if (!Object.keys(goc).length) return Response.json({ ds: [] });
        const [bai, trang] = await Promise.all([
          req.payload.find({ collection: "bai-viet", where: { _status: { equals: "published" } }, limit: 500, depth: 0,
            select: { tieu_de: true, slug: true, vecto: true }, overrideAccess: false, req }),
          trangNoiBo(),
        ]);
        const ung = [
          ...bai.docs.filter((b) => b.slug && b.vecto).map((b) => ({ id: `bai:${b.id}`, v: b.vecto as Vecto, tieu_de: b.tieu_de, url: `/blog/${b.slug}`, loai: "bai" })),
          ...trang.map((t) => ({ id: `trang:${t.url}`, v: vectoVan([[t.tieu_de, 4], [t.mo_ta ?? "", 1]]), tieu_de: t.tieu_de, url: t.url, loai: "trang" })),
        ];
        const boId = body.id != null ? `bai:${String(body.id)}` : undefined;
        return Response.json({ ds: xepHang(goc, ung, boId, 10).map(({ tieu_de, url, loai, diem }) => ({ tieu_de, url, loai, diem: Math.round(diem * 100) / 100 })) });
      },
    },
    {
      // CMS-2: Trợ lý AI soạn nháp một đoạn (cột phải). Người viết (kể cả cộng tác viên) dùng được; máy đọc thì không.
      path: "/soan-nhap", method: "post",
      handler: async (req) => {
        if (!daDangNhap(req) || req.user?.vai_tro === "may_doc") return Response.json({ loi: "Cần đăng nhập" }, { status: 403 });
        const body = (typeof req.json === "function" ? await req.json().catch(() => ({})) : {}) as Record<string, unknown>;
        const v = kiemDauVao(body);
        if (typeof v === "string") return Response.json({ loi: v }, { status: 422 });
        return Response.json(await soanNhap(v));
      },
    },
    {
      // Nút "Kiểm trùng" trong khung Kiểm định: POST /api/bai-viet/kiem-trung {id?, tra_loi_nhanh, noi_dung, hoi_dap}.
      // Chỉ tài khoản phòng biên tập (không máy đọc). Bài nháp người khác không lộ tiêu đề (danhGiaTrung).
      path: "/kiem-trung", method: "post",
      handler: async (req) => {
        if (!daDangNhap(req) || req.user?.vai_tro === "may_doc") return Response.json({ loi: "Cần đăng nhập" }, { status: 403 });
        const body = (typeof req.json === "function" ? await req.json().catch(() => ({})) : {}) as Record<string, unknown>;
        const id = typeof body.id === "number" || typeof body.id === "string" ? body.id : null;
        const muc = await kiemTrung(req.payload, body, { id, congTacVien: laCongTacVien(req) });
        return Response.json({ muc });
      },
    },
  ],
  hooks: {
    beforeValidate: [chuanHoaTiengViet, tieuDeTam, slugTuTieuDe],
    beforeChange: [quyTrinhDuyet, ngayXuatBan, giuSlugCu, kiemDinhTruocKhiLuu,
      // CMS-4: vectơ từ khoá cho "bài liên quan theo nghĩa" (web xếp hạng bằng cosine + idf). Luôn tính lại khi lưu.
      ({ data, originalDoc }) => ({ ...data, vecto: vectoBai({ ...(originalDoc ?? {}), ...data }) })],
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
              name: "canonical", label: "URL chuẩn (canonical) khác", type: "text", access: { create: truongBienTap, update: truongBienTap },
              admin: { description: "Để trống = chính bài này. Chỉ điền khi bài đăng lại từ trang khác của hieuban.com." },
              validate: (v: unknown) => !v || (typeof v === "string" && /^(\/|https:\/\/(www\.)?hieuban\.com\/)/.test(v))
                || "Chỉ nhận đường dẫn trong hieuban.com",
            },
            { name: "noindex", label: "Không cho Google lập chỉ mục (noindex)", type: "checkbox", defaultValue: false, access: { create: truongBienTap, update: truongBienTap } },
            {
              name: "dua_vao_llms", label: "Đưa vào llms.txt (gợi ý cho trợ lý AI)", type: "checkbox", defaultValue: true, access: { create: truongBienTap, update: truongBienTap },
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
    {
      name: "goi_y_lien_ket", type: "ui",
      admin: { position: "sidebar", components: { Field: "/components/GoiYLienKet#GoiYLienKet" } },
    },
    { name: "vecto", type: "json", admin: { hidden: true, readOnly: true } },
    {
      name: "tro_ly_ai", type: "ui",
      admin: { position: "sidebar", components: { Field: "/components/TroLyAI#TroLyAI" } },
    },
    slugField({ useAsSlug: "tieu_de", slugify: taoSlug }),
    {
      name: "trang_thai_duyet", label: "Duyệt bài", type: "select", required: true, defaultValue: "dang_viet",
      options: TRANG_THAI_DUYET, index: true, access: { read: truongNoiBo },
      admin: { position: "sidebar", description: "Cộng tác viên viết xong chọn \"Gửi duyệt\". Chủ biên đọc, ghi chỗ cần sửa hoặc duyệt rồi xuất bản." },
    },
    {
      name: "ghi_chu_duyet", label: "Ghi chú của Chủ biên", type: "textarea", maxLength: 2000,
      access: { read: truongNoiBo, update: truongChuBien },
      admin: { position: "sidebar", condition: (_, s) => Boolean(s?.ghi_chu_duyet) || s?.trang_thai_duyet !== "dang_viet" },
    },
    {
      name: "nguoi_tao", label: "Người tạo", type: "relationship", relationTo: "bien-tap-vien",
      access: { read: truongNoiBo }, index: true,
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "mang", label: "Mảng", type: "select", required: true, defaultValue: "chung", options: MANG,
      admin: { position: "sidebar", description: "Quyết định công cụ được mời cuối bài và bài liên quan." },
    },
    {
      name: "loai_bai", label: "Loại bài", type: "select", required: true, defaultValue: "bai_viet", options: LOAI_BAI,
      admin: { position: "sidebar", description: "Tin tức → schema NewsArticle (Google News/Discover), ghi rõ ngày giờ đăng và cập nhật." },
    },
    { name: "chuyen_muc", label: "Chuyên mục", type: "relationship", relationTo: "chuyen-muc", hasMany: true, admin: { position: "sidebar" } },
    { name: "the", label: "Thẻ", type: "text", hasMany: true, maxRows: 12, admin: { position: "sidebar" } },
    {
      name: "ky_ten", label: "Chữ ký trên bài", type: "select", required: true, defaultValue: "ban_bien_tap",
      access: { create: truongChuBien, update: truongChuBien },
      options: [
        { label: "Ban biên tập · Chủ biên duyệt xuất bản", value: "ban_bien_tap" },
        { label: "Chuyên gia là tác giả (tự viết)", value: "tac_gia" },
        { label: "Chuyên gia thẩm định (đã đọc và duyệt)", value: "tham_dinh" },
      ],
      admin: { position: "sidebar", description: "Không ghi chuyên gia là tác giả/thẩm định bài họ chưa đọc (EEAT-1)." },
    },
    {
      name: "tac_gia", label: "Tác giả", type: "relationship", relationTo: "tac-gia",
      access: { create: truongChuBien, update: truongChuBien },
      admin: { position: "sidebar", condition: (_, s) => s?.ky_ten === "tac_gia" },
    },
    {
      name: "nguoi_tham_dinh", label: "Người thẩm định", type: "relationship", relationTo: "tac-gia",
      access: { create: truongChuBien, update: truongChuBien },
      admin: { position: "sidebar", condition: (_, s) => s?.ky_ten === "tham_dinh" },
    },
    {
      name: "ngay_tham_dinh", label: "Ngày thẩm định", type: "date",
      access: { create: truongChuBien, update: truongChuBien },
      admin: { position: "sidebar", condition: (_, s) => s?.ky_ten === "tham_dinh", date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" } },
    },
    {
      name: "xac_nhan_tham_dinh", label: "Chuyên gia đã đọc toàn bài và đồng ý đứng tên", type: "checkbox",
      access: { create: truongChuBien, update: truongChuBien, read: truongNoiBo },
      admin: { position: "sidebar", condition: (_, s) => s?.ky_ten === "tham_dinh" },
    },
    {
      name: "publishedAt", label: "Ngày xuất bản", type: "date", access: { create: truongBienTap, update: truongBienTap },
      admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" } },
    },
    {
      name: "bai_lien_quan", label: "Bài liên quan", type: "relationship", relationTo: "bai-viet", hasMany: true, maxRows: 4,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: { position: "sidebar", description: "Để trống = tự lấy bài gần nghĩa nhất (từ khoá, thẻ, tiêu đề mục), ưu tiên cùng mảng." },
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
    {
      name: "nguon_goc", label: "Nguồn bài", type: "select", defaultValue: "cms", access: { read: truongNoiBo, update: () => false },
      options: [{ label: "Viết trong CMS", value: "cms" }, { label: "Nhập từ NotFair (bài trao đổi)", value: "notfair" }],
      admin: { position: "sidebar", readOnly: true, condition: (d) => d?.nguon_goc === "notfair",
        description: "Bài trao đổi: giữ nguyên các link của đối tác và dòng ghi nguồn cuối bài. Đường dẫn không đổi." },
    },
    // Link ra ngoài của bản NotFair gốc — kiểm định cảnh báo khi bị xoá (BLOG-3). Ghi lúc nhập, không sửa tay.
    { name: "notfair_lien_ket", type: "text", hasMany: true, access: { read: truongNoiBo, update: () => false },
      admin: { hidden: true, readOnly: true } },
  ],
};

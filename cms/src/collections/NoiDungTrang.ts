// ND-0 — "Trang website": lớp phủ nội dung theo URL (docs/KIEN-TRUC-NOI-DUNG-TRANG.md, mục 3.1 + mục 8).
// Mỗi URL công khai nhóm công cụ / tĩnh / pháp lý / chủ đề là MỘT tài liệu, do job "dong-bo-so-trang" tạo từ sổ trang
// của web (web/lib/so-trang.ts) — biên tập viên không tạo tay. Trang kiến thức KB không có tài liệu sẵn: muốn chỉnh
// riêng một URL thì tạo "ghi đè theo yêu cầu" (chỉ nhập đường dẫn, phải thuộc một mẫu cụm có thật).
// Ô để trống = web hiện chữ đang chạy trong code (mac_dinh, chỉ đọc). Pha ND-0/ND-1: web CHƯA đọc tài liệu này
// (trừ chân trang ở global Điều hướng) — các pha ND-2… mới nối từng nhóm trang.
// Quyền: nhóm pháp lý + mục "quy-trinh" của /gioi-thieu chỉ Quản trị/Chủ biên sửa (điều kiện ở access + hook, không chỉ
// ẩn nút); biên tập viên soạn nháp nhóm khác, Chủ biên xuất bản; cộng tác viên không thấy collection.
import { FixedToolbarFeature, HeadingFeature, LinkFeature, lexicalEditor, lexicalHTMLField } from "@payloadcms/richtext-lexical";
import {
  APIError, type CollectionAfterChangeHook, type CollectionAfterDeleteHook, type CollectionBeforeChangeHook,
  type CollectionConfig, type Field, type PayloadRequest, type Where,
} from "payload";
import { laChuBien, laCongTacVien, laNguoiViet, laNoiBo } from "../access";
import { KHOI_TRANG, truongKieuChu, VI_TRI_KHOI } from "../blocks/trang";
import { DUONG_TRONG_SITE, truongLienKet } from "../globals/DieuHuong";
import { chuanHoaDuLieu } from "../kiem-dinh/kiem-dinh";
import { boChuyenHtml } from "../lib/html";
import { coTrangKb, type NguonKb } from "../lib/kb-trang";
import { kiemTrang } from "../lib/noi-dung-trang";
import { regexMau } from "../lib/so-trang";
import { baoWebLamMoi, webUrl } from "../lib/web";

export const NHOM_TRANG = [
  { label: "Công cụ", value: "cong_cu" }, { label: "Trang tĩnh", value: "tinh" }, { label: "Pháp lý", value: "phap_ly" },
  { label: "Chủ đề kiến thức", value: "chu_de" }, { label: "Trang kiến thức (ghi đè)", value: "kien_thuc" },
  { label: "Tuổi hợp hướng (ghi đè)", value: "tuoi" }, { label: "Lá số mẫu (ghi đè)", value: "la_so_mau" },
  { label: "Khung blog", value: "blog_khung" },
];
/** Ô hệ thống: chỉ job đồng bộ (hoặc hook tạo ghi đè) được ghi. */
const HE_THONG = ["duong", "nhom", "ten", "mau", "tren_web", "o", "mac_dinh"] as const;
const NHOM_GHI_DE = new Set(["kien_thuc", "tuoi", "la_so_mau"]);

type Doc = Record<string, unknown> & { id?: number | string; duong?: string; nhom?: string; o?: unknown; muc?: unknown;
  _status?: string; ngay_hieu_luc?: string | null; loai_sua?: string; mac_dinh?: { ngay_hieu_luc?: string } | null };

const xuatBan = (d: unknown) => (d as { _status?: string } | undefined)?._status === "published";
const dongBo = (req: PayloadRequest) => Boolean(req.context?.dongBo);

/** Ô `o` (ô được phép ở URL này) quyết định tab nào hiện. Ghi đè trang KB / tài liệu đang tạo: chỉ khối. */
const cho = (o: string) => (data: Partial<Doc>) => {
  if (!data?.nhom || NHOM_GHI_DE.has(String(data.nhom))) return o.startsWith("khoi");
  return Array.isArray(data.o) && (data.o as string[]).includes(o);
};
const choKhoi = (data: Partial<Doc>) => ["khoi_tren", "khoi_duoi", "khoi_cuoi"].some((o) => cho(o)(data));

/** dd/mm/yyyy (mặc định trong code) hoặc ISO → mốc NGÀY (0h UTC). So theo ngày lịch: ô ngày "dayOnly" của Payload lưu
 *  12:00 UTC, nếu so cả giờ thì cùng ngày với ngày trong code vẫn bị coi là "mới hơn". */
const ngay = (v: unknown): number | null => {
  if (typeof v !== "string" || !v) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  const t = m ? Date.UTC(+m[3]!, +m[2]! - 1, +m[1]!) : Date.parse(v);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

// ------------------------------------------------------------------ hook

/** Ô hệ thống không nhận từ người sửa; tạo tay chỉ cho "ghi đè theo yêu cầu" một URL thuộc mẫu cụm có thật. */
const giuHeThong: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (dongBo(req)) return data;
  if (operation === "update") {
    for (const k of HE_THONG) data[k] = (originalDoc as Doc | undefined)?.[k] ?? null;
    return data;
  }
  const duong = String(data.duong ?? "").trim().replace(/\/+$/, "");
  const mau = await req.payload.find({ collection: "mau-cum", limit: 50, depth: 0, overrideAccess: true, req,
    where: { tren_web: { equals: true } } });
  const khop = mau.docs.find((m) => regexMau(String((m as { mau_duong?: string }).mau_duong)).test(duong));
  if (!khop) throw new APIError("Chỉ tạo ghi đè cho một trang thuộc mẫu cụm có thật (vd /kien-thuc/sao-cung/tu-vi-cung-menh). Trang công cụ, tĩnh, pháp lý, chủ đề đã có sẵn trong danh sách — bấm \"Đồng bộ ngay\" nếu chưa thấy.", 400, null, true);
  const m = khop as unknown as { id: number; nhom: string; o?: string[]; nguon_kb?: NguonKb };
  if (m.nguon_kb && (await coTrangKb(m.nguon_kb, duong.split("/").pop()!)) === false) {
    throw new APIError(`Không có trang ${duong} trên web (engine không tìm thấy).`, 400, null, true);
  }
  const trung = await req.payload.count({ collection: "noi-dung-trang", where: { duong: { equals: duong } }, overrideAccess: true, req });
  if (trung.totalDocs) throw new APIError(`Đã có tài liệu cho ${duong} — mở tài liệu đó để sửa.`, 400, null, true);
  Object.assign(data, { duong, nhom: m.nhom, ten: duong, mau: m.id, tren_web: true, o: m.o ?? ["khoi_tren", "khoi_duoi", "khoi_cuoi"], mac_dinh: {} });
  return data;
};

/** Pháp lý: chỉ Quản trị/Chủ biên. /gioi-thieu mục "quy-trinh" (ai biên soạn, ai thẩm định): chỉ Quản trị/Chủ biên.
 *  Neo (id) mục đã có không đổi được (link #neo từ chân trang, bài viết sẽ gãy). */
const quyenMuc: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (dongBo(req)) return data;
  const cu = (originalDoc ?? {}) as Doc;
  const chuBien = laChuBien(req);
  if (!chuBien && (cu.nhom === "phap_ly" || data.nhom === "phap_ly")) {
    throw new APIError("Trang pháp lý chỉ Quản trị hoặc Chủ biên được sửa.", 403, null, true);
  }
  type Muc = { id?: string; neo?: string; tieu_de?: string; noi_dung?: unknown };
  const moi = (Array.isArray(data.muc) ? data.muc : []) as Muc[];
  const truoc = (Array.isArray(cu.muc) ? cu.muc : []) as Muc[];
  for (const m of moi) {
    const c = truoc.find((x) => x.id && x.id === m.id);
    if (c?.neo && m.neo !== c.neo) throw new APIError(`Không đổi neo "#${c.neo}" đã có — link tới mục này sẽ gãy.`, 400, null, true);
    if (m.neo && !/^[a-z0-9-]{1,60}$/.test(m.neo)) throw new APIError("Neo chỉ gồm chữ thường không dấu, số, gạch ngang.", 400, null, true);
  }
  if (cu.duong === "/gioi-thieu" && !chuBien) {
    const qt = (ds: Muc[]) => JSON.stringify(ds.filter((x) => x.neo === "quy-trinh").map((x) => [x.tieu_de ?? null, x.noi_dung ?? null]));
    if (qt(moi) !== qt(truoc)) throw new APIError("Mục \"Ai biên soạn, ai thẩm định\" chỉ Quản trị hoặc Chủ biên được sửa.", 403, null, true);
  }
  // Trang pháp lý không có khối quảng bá.
  if (cu.nhom === "phap_ly") for (const vt of ["khoi_tren", "khoi_duoi", "khoi_cuoi"]) data[vt] = [];
  return data;
};

/** Pháp lý — hai loại sửa (mục 8.3): "sửa chữ" giữ ngày hiệu lực; "thay đổi nội dung" bắt buộc ngày hiệu lực MỚI, sau
 *  ngày của bản đang xuất bản (hoặc ngày đang ghi trong code nếu chưa xuất bản bản nào). */
const ngayHieuLuc: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const cu = (originalDoc ?? {}) as Doc;
  if (dongBo(req) || cu.nhom !== "phap_ly" || !cu.id) return data;
  const pb = await req.payload.findVersions({ collection: "noi-dung-trang", limit: 1, sort: "-updatedAt", depth: 0, overrideAccess: true, req,
    where: { and: [{ parent: { equals: cu.id } }, { "version._status": { equals: "published" } }] } });
  const dangXb = pb.docs[0]?.version?.ngay_hieu_luc ?? null;
  const moc = Math.max(ngay(dangXb) ?? 0, ngay(cu.mac_dinh?.ngay_hieu_luc) ?? 0);
  if ((data.loai_sua ?? "sua_chu") === "thay_doi_noi_dung") {
    const t = ngay(data.ngay_hieu_luc);
    if (!t || t <= moc) {
      throw new APIError(`"Thay đổi nội dung" cần ngày hiệu lực mới, sau ngày đang áp dụng (${new Date(moc).toLocaleDateString("vi-VN", { timeZone: "UTC" })}).`, 400, null, true);
    }
  } else {
    data.ngay_hieu_luc = dangXb;   // sửa chữ: giữ nguyên ngày hiệu lực đang áp dụng
  }
  return data;
};

const kiemDinh: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (req.context?.boQuaKiemDinh) return data;
  const d = { ...(originalDoc ?? {}), ...data } as Doc;
  const kq = kiemTrang(d, { mucNoiQuyTrinh: d.duong === "/gioi-thieu" || d.nhom === "phap_ly" });
  if (xuatBan(data) && kq.chan.length) {
    throw new APIError("Chưa xuất bản được — sửa các lỗi sau: " + kq.chan.map((m) => m.thong_diep).join(" · "), 400, null, true);
  }
  data.ghi_chu_kiem_dinh = kq.muc.map((m) => `${m.chan ? "⛔" : "⚠"} ${m.thong_diep}`).join("\n");
  const u = req.user as { id?: number | string; collection?: string } | null;
  if (u?.collection === "bien-tap-vien") data.nguoi_sua = u.id;
  return data;
};

/** Báo web xoá cache khi bản XUẤT BẢN đổi (lưu nháp không báo). */
export const lamMoiTrang: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (req.context?.boQuaLamMoi) return doc;
  const moi = doc as Doc, cu = (previousDoc ?? {}) as Doc;
  if (moi._status === "published" || cu._status === "published") await baoWebLamMoi("trang", null, moi.duong ?? cu.duong);
  return doc;
};
const lamMoiKhiXoa: CollectionAfterDeleteHook = async ({ doc }) => {
  await baoWebLamMoi("trang", null, (doc as Doc).duong);
  return doc;
};

// ------------------------------------------------------------------ trường

const docChi = (f: Field): Field => ({ ...f, access: { ...(f as { access?: object }).access, update: () => false } } as Field);

export const tabKhoi = (dieuKien: (d: Partial<Doc>) => boolean, voiCheDo: boolean) => ({
  label: "Khối thêm",
  admin: { condition: dieuKien, description: "Banner, video, đoạn văn, nút mời… đặt quanh nội dung trang (mỗi vị trí ≤ 6 khối)." },
  fields: [
    ...VI_TRI_KHOI.map((v): Field => ({
      name: v.name, label: v.label, type: "blocks", blocks: KHOI_TRANG, maxRows: 6,
      admin: { initCollapsed: true, condition: (d: Partial<Doc>) => !d?.nhom || cho(v.name)(d) },
    })),
    ...(voiCheDo ? [{
      name: "che_do_mau", label: "Khi trang có mẫu cụm", type: "group",
      admin: { condition: (d: Partial<Doc>) => !d?.nhom || NHOM_GHI_DE.has(String(d.nhom)),
        description: "Khối của mẫu cụm và khối riêng của trang này kết hợp thế nào (từng vị trí)." },
      fields: [{ type: "row", fields: (["tren", "duoi", "cuoi"] as const).map((v): Field => ({
        name: v, label: { tren: "Phía trên", duoi: "Phía dưới", cuoi: "Cuối trang" }[v], type: "select", defaultValue: "thay",
        admin: { width: "33%" },
        options: [{ label: "Thay khối mẫu (nếu trang có khối)", value: "thay" }, { label: "Thêm sau khối mẫu", value: "them_sau" },
          { label: "Ẩn khối mẫu ở trang này", value: "an_mau" }],
      })) }],
    } as Field] : []),
  ],
});

export const NoiDungTrang: CollectionConfig = {
  slug: "noi-dung-trang",
  labels: { singular: "Trang website", plural: "Trang website" },
  admin: {
    group: "Giao diện website",
    useAsTitle: "ten",
    defaultColumns: ["ten", "duong", "nhom", "tren_web", "_status", "updatedAt"],
    listSearchableFields: ["ten", "duong"],
    description: "Mỗi URL của hieuban.com là một dòng (tự đồng bộ). Ô để trống = web hiện chữ đang có trong code. Trang kiến thức: dùng \"Mẫu cụm trang\", hoặc tạo ghi đè cho một URL.",
    hidden: ({ user }) => ["cong_tac_vien", "may_doc"].includes(String((user as { vai_tro?: string } | null)?.vai_tro)),
    preview: (doc) => (typeof doc.duong === "string" && DUONG_TRONG_SITE.test(doc.duong) ? `${webUrl()}${doc.duong}` : null),
    components: { beforeListTable: ["/components/DongBoSoTrang#DongBoSoTrang"] },
    pagination: { defaultLimit: 50 },
  },
  versions: { drafts: { autosave: { interval: 2000 }, schedulePublish: true }, maxPerDoc: 0 }, // 0 = giữ mọi phiên bản (quyết định 8.3: pháp lý giữ bản cũ; tự lưu chỉ cập nhật một bản nháp)
  access: {
    read: ({ req }): boolean | Where => {
      if (laCongTacVien(req)) return false;
      return laNoiBo(req) ? true : { _status: { equals: "published" } };
    },
    create: ({ req, data }) => laChuBien(req) || (laNguoiViet(req) && !xuatBan(data)),
    // Biên tập viên: nháp, trừ nhóm pháp lý — điều kiện lọc ở DB (không sửa được tài liệu pháp lý dù đoán id).
    update: ({ req, data }): boolean | Where => {
      if (laChuBien(req)) return true;
      if (!laNguoiViet(req) || xuatBan(data)) return false;
      return { nhom: { not_equals: "phap_ly" } };
    },
    delete: ({ req }) => laChuBien(req),
    readVersions: ({ req }) => laNguoiViet(req),
  },
  hooks: {
    beforeValidate: [({ data }) => (data ? chuanHoaDuLieu(data) : data)],
    beforeChange: [giuHeThong, quyenMuc, ngayHieuLuc, kiemDinh],
    afterChange: [lamMoiTrang],
    afterDelete: [lamMoiKhiXoa],
  },
  endpoints: [
    {
      // Nút "Đồng bộ ngay" trên danh sách: đọc sổ trang của web rồi đồng bộ (như job hằng ngày). Quản trị/Chủ biên.
      path: "/dong-bo", method: "post",
      handler: async (req) => {
        if (!laChuBien(req)) return Response.json({ loi: "Chỉ Quản trị hoặc Chủ biên." }, { status: 403 });
        const { dongBoSoTrang, laySoTrang } = await import("../lib/so-trang");
        try {
          return Response.json({ ok: true, ...(await dongBoSoTrang(req.payload, await laySoTrang())) });
        } catch (e) {
          return Response.json({ loi: (e as Error).message }, { status: 502 });
        }
      },
    },
  ],
  fields: [
    {
      name: "duong", label: "Đường dẫn", type: "text", required: true, unique: true, index: true,
      access: { update: () => false },
      admin: { description: "Do đồng bộ tạo. Chỉ nhập tay khi tạo ghi đè cho một trang kiến thức (vd /kien-thuc/sao-cung/tu-vi-cung-menh)." },
      validate: (v: unknown) => (typeof v === "string" && DUONG_TRONG_SITE.test(v.trim())) || "Đường dẫn trong site, bắt đầu bằng /",
    },
    docChi({ name: "ten", label: "Tên trang", type: "text", admin: { readOnly: true } }),
    docChi({ name: "nhom", label: "Nhóm", type: "select", options: NHOM_TRANG, index: true, admin: { readOnly: true, position: "sidebar" } }),
    docChi({ name: "mau", label: "Mẫu cụm", type: "relationship", relationTo: "mau-cum", admin: { readOnly: true, position: "sidebar",
      condition: (d) => NHOM_GHI_DE.has(String(d?.nhom)) } }),
    docChi({ name: "tren_web", label: "Còn trên web", type: "checkbox", defaultValue: true, index: true,
      admin: { readOnly: true, position: "sidebar", description: "Bỏ dấu = URL đã gỡ khỏi web (không tự xoá tài liệu)." } }),
    docChi({ name: "o", label: "Ô được sửa", type: "json", admin: { hidden: true } }),
    {
      type: "ui", name: "xem_kb", label: "Nội dung kho tri thức",
      admin: { condition: (d) => NHOM_GHI_DE.has(String(d?.nhom)), components: { Field: "/components/XemTruocKb#XemTruocKb" } },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "SEO", admin: { condition: cho("seo") },
          fields: [
            { name: "tieu_de_seo", label: "Tiêu đề SEO", type: "text", maxLength: 70,
              admin: { description: "≤ 70 ký tự (kể cả hậu tố thương hiệu). Để trống = tiêu đề trong code." } },
            { name: "mo_ta_seo", label: "Mô tả SEO", type: "textarea", maxLength: 160, admin: { description: "≤ 160 ký tự. Để trống = mô tả trong code." } },
            { name: "anh_chia_se", label: "Ảnh chia sẻ (OG)", type: "upload", relationTo: "media" },
          ],
        },
        {
          label: "Đầu trang", admin: { condition: cho("dau_trang") },
          fields: [
            { name: "h1", label: "Tiêu đề trang (H1)", type: "text", maxLength: 120 },
            { name: "loi_dan", label: "Lời dẫn", type: "textarea", maxLength: 400 },
            truongKieuChu,
          ],
        },
        {
          label: "Giới thiệu & hỏi đáp", admin: { condition: cho("gioi_thieu"), description: "Phần \"Về công cụ\" cuối trang công cụ (Google + AI đọc được)." },
          fields: [
            { name: "doan", label: "Đoạn giới thiệu", type: "array", maxRows: 6, labels: { singular: "Đoạn", plural: "Đoạn" },
              fields: [{ name: "chu", label: "Đoạn văn", type: "textarea", required: true, maxLength: 800 }] },
            { name: "hoi_dap", label: "Hỏi đáp (FAQPage)", type: "array", maxRows: 10, labels: { singular: "Câu hỏi", plural: "Câu hỏi" },
              fields: [
                { name: "cau_hoi", label: "Câu hỏi", type: "text", required: true, maxLength: 160 },
                { name: "tra_loi", label: "Trả lời", type: "textarea", required: true, maxLength: 800 },
              ] },
            { name: "lien_ket", label: "Đọc thêm", type: "array", maxRows: 8, labels: { singular: "Liên kết", plural: "Liên kết" },
              fields: truongLienKet },
          ],
        },
        {
          label: "Mục văn bản", admin: { condition: cho("muc"), description: "Từng mục theo neo (#id). Neo đã có không đổi được." },
          fields: [
            {
              name: "loai_sua", label: "Lần lưu này là", type: "radio", defaultValue: "sua_chu",
              admin: { layout: "horizontal", condition: (d) => d?.nhom === "phap_ly",
                description: "Sửa chữ = chính tả, định dạng (giữ ngày hiệu lực). Thay đổi nội dung = bắt buộc ngày hiệu lực mới." },
              options: [{ label: "Sửa chữ", value: "sua_chu" }, { label: "Thay đổi nội dung", value: "thay_doi_noi_dung" }],
            },
            { name: "ngay_hieu_luc", label: "Ngày hiệu lực", type: "date",
              admin: { condition: (d) => d?.nhom === "phap_ly", date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" } } },
            {
              name: "muc", label: "Mục", type: "array", maxRows: 20, labels: { singular: "Mục", plural: "Mục" },
              admin: { initCollapsed: true },
              fields: [
                { name: "neo", label: "Neo (id, vd quyen)", type: "text", required: true, maxLength: 60 },
                { name: "tieu_de", label: "Tiêu đề mục (H2)", type: "text", required: true, maxLength: 120 },
                { name: "noi_dung", label: "Nội dung", type: "richText",
                  editor: lexicalEditor({ features: ({ rootFeatures }) => [
                    ...rootFeatures.filter((f) => !["relationship", "upload", "heading", "link", "checklist", "blocks"].includes(f.key)),
                    HeadingFeature({ enabledHeadingSizes: ["h3", "h4"] }), LinkFeature({ enabledCollections: ["bai-viet"] }), FixedToolbarFeature(),
                  ] }) },
                lexicalHTMLField({ htmlFieldName: "noi_dung_html", lexicalFieldName: "noi_dung", converters: boChuyenHtml }),
              ],
            },
          ],
        },
        tabKhoi(choKhoi, true),
        {
          label: "Mặc định trong code",
          fields: [docChi({ name: "mac_dinh", label: "Chữ đang chạy trong code (chỉ đọc — chép ra để sửa)", type: "json", admin: { readOnly: true } })],
        },
      ],
    },
    { name: "ghi_chu_kiem_dinh", label: "Kiểm định", type: "textarea",
      access: { read: ({ req }) => laNguoiViet(req) },   // hook kiemDinh ghi đè mỗi lần lưu
      admin: { readOnly: true, position: "sidebar", description: "⛔ = chặn xuất bản · ⚠ = nên xem lại." } },
    { name: "nguoi_sua", label: "Người sửa cuối", type: "relationship", relationTo: "bien-tap-vien",
      access: { read: ({ req }) => laNguoiViet(req) }, admin: { readOnly: true, position: "sidebar" } },
    { name: "ghi_chu_noi_bo", label: "Ghi chú nội bộ", type: "textarea", maxLength: 1000,
      access: { read: ({ req }) => laNguoiViet(req) }, admin: { position: "sidebar" } },
  ],
};


// ND-0 — "Mẫu cụm trang": một tài liệu cho cả cụm trang kiến thức dựng từ KB (vd 168 trang /tu-vi/sao-o-cung/{slug}),
// do job đồng bộ tạo từ sổ trang của web (mục 8.1 docs/KIEN-TRUC-NOI-DUNG-TRANG.md). CMS chỉ đặt KHỐI quanh nội dung KB
// (banner, video, đoạn biên tập, nút mời); chữ KB vẫn ở git — khung "Nội dung kho tri thức" xem trước CHỈ ĐỌC một trang
// mẫu của cụm + nút mở /quan-tri/tri-thuc/<tệp>. Chữ trong khối dùng được biến {tieu_de}… (web thay, thoát HTML).
import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook, type CollectionConfig, type Field, type Where } from "payload";
import { laChuBien, laCongTacVien, laNguoiViet, laNoiBo } from "../access";
import { chuanHoaDuLieu } from "../kiem-dinh/kiem-dinh";
import { xemKb, type NguonKb } from "../lib/kb-trang";
import { kiemTrang } from "../lib/noi-dung-trang";
import { regexMau } from "../lib/so-trang";
import { baoWebLamMoi, linkXemTrang } from "../lib/web";
import { locChu, locHinh, NHOM_TRANG, tabChu, tabHinh, tabKhoi } from "./NoiDungTrang";

const HE_THONG = ["mau_duong", "nhom", "ten", "bien", "o", "nguon_kb", "tren_web", "mac_dinh"] as const;
type Doc = Record<string, unknown> & { mau_duong?: string; bien?: unknown; _status?: string };
const xuatBan = (d: unknown) => (d as { _status?: string } | undefined)?._status === "published";
const docChi = (f: Field): Field => ({ ...f, access: { update: () => false } } as Field);

const giuHeThong: CollectionBeforeChangeHook = ({ data, originalDoc, operation, req }) => {
  if (req.context?.dongBo) return data;
  if (operation === "create") throw new APIError("Mẫu cụm do đồng bộ sổ trang tạo — không tạo tay.", 400, null, true);
  for (const k of HE_THONG) data[k] = (originalDoc as Doc | undefined)?.[k] ?? null;
  return data;
};

const kiemDinh: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (req.context?.boQuaKiemDinh) return data;
  const d = { ...(originalDoc ?? {}), ...data } as Doc;
  const kq = kiemTrang(d, { bien: Array.isArray(d.bien) ? (d.bien as string[]) : [] });
  if (xuatBan(data) && kq.chan.length) {
    throw new APIError("Chưa xuất bản được — sửa các lỗi sau: " + kq.chan.map((m) => m.thong_diep).join(" · "), 400, null, true);
  }
  data.ghi_chu_kiem_dinh = kq.muc.map((m) => `${m.chan ? "⛔" : "⚠"} ${m.thong_diep}`).join("\n");
  return data;
};

const lamMoi: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (req.context?.boQuaLamMoi) return doc;
  if (xuatBan(doc) || xuatBan(previousDoc)) await baoWebLamMoi("mau_cum");
  return doc;
};

export const MauCum: CollectionConfig = {
  slug: "mau-cum",
  labels: { singular: "Mẫu cụm trang", plural: "Mẫu cụm trang" },
  admin: {
    group: "Giao diện website",
    useAsTitle: "ten",
    defaultColumns: ["ten", "mau_duong", "tren_web", "_status", "updatedAt"],
    description: "Khối đặt quanh nội dung kiến thức cho CẢ CỤM trang (vd 168 trang \"sao ở cung\"). Chữ kiến thức sửa ở Kho tri thức (git).",
    hidden: ({ user }) => ["cong_tac_vien", "may_doc"].includes(String((user as { vai_tro?: string } | null)?.vai_tro)),
    pagination: { defaultLimit: 50 },
    // ND-6: web mở một trang ví dụ của cụm ở chế độ nháp.
    preview: (doc) => linkXemTrang(typeof doc.mau_duong === "string" ? doc.mau_duong : null),
  },
  versions: { drafts: { autosave: { interval: 2000 }, schedulePublish: true }, maxPerDoc: 30 },
  access: {
    read: ({ req }): boolean | Where => {
      if (laCongTacVien(req)) return false;
      return laNoiBo(req) ? true : { _status: { equals: "published" } };
    },
    create: ({ req }) => laChuBien(req),
    update: ({ req, data }) => laChuBien(req) || (laNguoiViet(req) && !xuatBan(data)),
    delete: ({ req }) => laChuBien(req),
    readVersions: ({ req }) => laNguoiViet(req),
  },
  hooks: {
    beforeValidate: [({ data }) => (data ? chuanHoaDuLieu(data) : data)],
    beforeChange: [giuHeThong, locChu, locHinh, kiemDinh],
    afterChange: [lamMoi],
    // Xoá mẫu cụm (Chủ biên) → web bỏ khối của cụm ngay, không chờ hạn cache 5 phút.
    afterDelete: [async ({ doc }) => { await baoWebLamMoi("mau_cum"); return doc; }],
  },
  endpoints: [
    {
      // Khung "Nội dung kho tri thức": GET /api/mau-cum/xem-kb?duong=/tu-vi/sao-o-cung/tu-vi-cung-menh
      // → chữ engine đang trả cho trang đó (chỉ đọc) + link tệp KB. Dùng cho cả mẫu cụm lẫn ghi đè một URL.
      path: "/xem-kb", method: "get",
      handler: async (req) => {
        if (!laNguoiViet(req)) return Response.json({ loi: "Cần đăng nhập ban biên tập." }, { status: 403 });
        const duong = String(new URL(req.url ?? "http://x").searchParams.get("duong") ?? "").slice(0, 200);
        const ds = await req.payload.find({ collection: "mau-cum", limit: 50, depth: 0, overrideAccess: true, req });
        const m = ds.docs.find((x) => regexMau(String(x.mau_duong)).test(duong)) as unknown as (Doc & { nguon_kb?: NguonKb }) | undefined;
        if (!m?.nguon_kb?.kieu) return Response.json({ loi: "Đường dẫn không thuộc mẫu cụm nào." }, { status: 404 });
        return Response.json(await xemKb(m.nguon_kb, duong.split("/").pop()!, duong));
      },
    },
  ],
  fields: [
    docChi({ name: "mau_duong", label: "Mẫu đường dẫn", type: "text", required: true, unique: true, admin: { readOnly: true } }),
    docChi({ name: "ten", label: "Tên cụm", type: "text", admin: { readOnly: true } }),
    docChi({ name: "nhom", label: "Nhóm", type: "select", options: NHOM_TRANG, admin: { readOnly: true, position: "sidebar" } }),
    docChi({ name: "tren_web", label: "Còn trên web", type: "checkbox", defaultValue: true, admin: { readOnly: true, position: "sidebar" } }),
    docChi({ name: "bien", label: "Biến dùng được trong chữ khối", type: "json", admin: { readOnly: true,
      description: "Gõ {ten_bien} trong chữ khối, web thay bằng giá trị của từng trang. Biến lạ giữ nguyên chữ." } }),
    docChi({ name: "o", label: "Vị trí khối", type: "json", admin: { hidden: true } }),
    docChi({ name: "nguon_kb", label: "Nguồn kho tri thức", type: "json", admin: { hidden: true } }),
    docChi({ name: "mac_dinh", label: "Chữ mặc định trong code", type: "json", admin: { hidden: true } }),
    // Cụm không dựng từ kho tri thức (trang con công cụ, tác giả) không có khung xem trước KB.
    { type: "ui", name: "xem_kb", label: "Nội dung kho tri thức", admin: { condition: (d) => Boolean((d?.nguon_kb as { kieu?: string } | undefined)?.kieu),
      components: { Field: "/components/XemTruocKb#XemTruocKb" } } },
    { type: "tabs", tabs: [tabChu, tabHinh, tabKhoi(() => true, false)] },
    { name: "ghi_chu_kiem_dinh", label: "Kiểm định", type: "textarea",
      access: { read: ({ req }) => laNguoiViet(req) },   // hook kiemDinh ghi đè mỗi lần lưu
      admin: { readOnly: true, position: "sidebar", description: "⛔ = chặn xuất bản · ⚠ = nên xem lại." } },
  ],
};

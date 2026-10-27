// CTA-2 — "Lối đi tiếp cuối trang": thẻ bù cho các khối lưới cuối trang (Kiến thức {mảng}, Bài viết liên quan / mới,
// Đọc tiếp cuối bài blog, thư viện /kien-thuc, khối bài viết trang đích) khi khối thiếu ô. Web lấy thẻ theo thứ tự:
// thẻ ưu tiên của chính URL (Trang website → "Lối đi tiếp") → cụm kiến thức cùng mảng (nếu bật) → nhóm của mảng ở đây →
// nhóm "Chung". Thẻ trùng link đã hiện trên trang tự bỏ. Để trống toàn bộ = web dùng bộ mặc định trong code
// (loi-di-tiep-mac-dinh.json — trùng web/lib/loi-di-tiep-mac-dinh.json).
// Chữ thẻ là chữ thuần, link chỉ trong site (DUONG_TRONG_SITE), qua luật ranh giới chung (vùng cấm, liên hệ, tên nội bộ).
import { APIError, type Field, type GlobalBeforeChangeHook, type GlobalConfig } from "payload";
import { ai, chiChuBien } from "../access";
import { lamMoiGlobal } from "../hooks/lamMoiWeb";
import { kiemRanhGioi } from "../kiem-dinh/kiem-dinh";
import { DUONG_TRONG_SITE } from "./DieuHuong";
import MAC_DINH from "./loi-di-tiep-mac-dinh.json";

export const TRU_LOI_DI_TIEP = [
  { label: "Thần số học (/than-so)", value: "/than-so" },
  { label: "Hợp đôi (/hop-doi)", value: "/hop-doi" },
  { label: "Tử vi (/tu-vi)", value: "/tu-vi" },
  { label: "Bát tự (/bat-tu)", value: "/bat-tu" },
  { label: "Kinh Dịch (/kinh-dich)", value: "/kinh-dich" },
  { label: "Phong thuỷ (/phong-thuy)", value: "/phong-thuy" },
  { label: "Chung — mọi trang (thư viện, Hôm nay…)", value: "chung" },
];
export const NHAN_THE = [
  { label: "Kiến thức", value: "kien_thuc" }, { label: "Công cụ", value: "cong_cu" }, { label: "Thư viện", value: "thu_vien" },
];
export const HINH_THE = [
  { label: "Thần số (vòng số)", value: "than-so" }, { label: "Tử vi (12 cung)", value: "tu-vi" },
  { label: "Bát tự (tứ trụ)", value: "bat-tu" }, { label: "Kinh Dịch (quẻ)", value: "kinh-dich" },
  { label: "Phong thuỷ (bát quái)", value: "phong-thuy" },
];

/** Một thẻ lối đi tiếp — dùng chung cho global này và ô "Lối đi tiếp" của từng URL (Trang website). */
export const truongTheLoiDi: Field[] = [
  {
    type: "row",
    fields: [
      { name: "duong", label: "Đường dẫn trong site (vd /hom-nay, /tu-vi#hop-tham)", type: "text", required: true, maxLength: 120,
        admin: { width: "50%" },
        validate: (v: unknown) => (typeof v === "string" && DUONG_TRONG_SITE.test(v)) || "Chỉ đường dẫn trong site, bắt đầu bằng \"/\"." },
      { name: "ten", label: "Tên thẻ", type: "text", required: true, maxLength: 60, admin: { width: "50%" } },
    ],
  },
  { name: "mo_ta", label: "Mô tả (2 dòng)", type: "textarea", required: true, maxLength: 180 },
  {
    type: "row",
    fields: [
      { name: "nhan", label: "Chip", type: "select", required: true, defaultValue: "kien_thuc", options: NHAN_THE, admin: { width: "50%" } },
      { name: "hinh", label: "Hình (thẻ có ảnh)", type: "select", required: true, defaultValue: "than-so", options: HINH_THE, admin: { width: "50%" } },
    ],
  },
];

/** Chữ trên thẻ qua luật ranh giới chung — lỗi chặn thì không lưu. */
export function kiemTheLoiDi(ds: { ten?: unknown; mo_ta?: unknown }[]): string[] {
  const van = ds.flatMap((t) => [t.ten, t.mo_ta]).filter((x): x is string => typeof x === "string").join("\n");
  return kiemRanhGioi(van).filter((m) => m.chan).map((m) => m.thong_diep);
}

const kiem: GlobalBeforeChangeHook = ({ data }) => {
  const the = ((data.nhom ?? []) as { the?: { ten?: unknown; mo_ta?: unknown }[] }[]).flatMap((n) => n.the ?? []);
  const loi = kiemTheLoiDi(the);
  if (loi.length) throw new APIError("Chưa lưu được — " + loi.join(" · "), 400, null, true);
  return data;
};

export const LoiDiTiep: GlobalConfig = {
  slug: "loi-di-tiep",
  label: "Lối đi tiếp cuối trang",
  admin: {
    group: "Giao diện website",
    description: "Thẻ bù cho khối cuối trang (Kiến thức {mảng}, Bài viết liên quan, Đọc tiếp…) khi khối thiếu ô — để hàng nào cũng kín, người đọc luôn có lối đi tiếp. Thứ tự lấy: thẻ ưu tiên của URL (Trang website → Lối đi tiếp) → cụm kiến thức cùng mảng → nhóm của mảng → nhóm Chung. Số lượt thấy / bấm từng thẻ: /quan-tri/tang-truong.",
  },
  access: { read: ai, update: chiChuBien },
  hooks: { beforeChange: [kiem], afterChange: [lamMoiGlobal] },
  fields: [
    {
      type: "row",
      fields: [
        { name: "bat", label: "Bù thẻ khi khối thiếu ô", type: "checkbox", defaultValue: true, admin: { width: "33%",
          description: "Tắt = khối co số cột theo số mục thật (không thẻ bù)." } },
        { name: "cum_truoc", label: "Cụm kiến thức cùng mảng đứng trước", type: "checkbox", defaultValue: true, admin: { width: "33%" } },
        { name: "tu_xep", label: "Tự xếp theo lượt bấm", type: "checkbox", defaultValue: false, admin: { width: "33%",
          description: "Bật = trong mỗi nhóm, thẻ có tỉ lệ bấm cao hơn (28 ngày, đủ mẫu) lên trước. Chưa đủ mẫu thì giữ thứ tự ở đây." } },
      ],
    },
    {
      name: "nhom", label: "Nhóm theo mảng", type: "array", maxRows: 7,
      labels: { singular: "Nhóm", plural: "Nhóm" },
      defaultValue: MAC_DINH.nhom,
      admin: { initCollapsed: true },
      fields: [
        { name: "tru", label: "Mảng (trang trụ)", type: "select", required: true, options: TRU_LOI_DI_TIEP },
        { name: "the", label: "Thẻ (theo thứ tự ưu tiên)", type: "array", maxRows: 8, labels: { singular: "Thẻ", plural: "Thẻ" },
          admin: { initCollapsed: true }, fields: truongTheLoiDi },
      ],
    },
  ],
};

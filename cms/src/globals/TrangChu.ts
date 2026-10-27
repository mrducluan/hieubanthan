// Trang chủ & banner hieuban.com — phần CHỮ/ẢNH hiển thị do ban biên tập quản lý:
//   • Dải thông báo đầu mọi trang (chuyển từ /quan-tri sang đây 2026-10-12: chữ hiển thị thuộc CMS;
//     con số kinh tế — mức thưởng Sao, giá — vẫn ở /quan-tri).
//   • Banner trên trang chủ (ảnh + chữ + nút), có lịch bật/tắt.
//   • Khối "Bài viết mới" trên trang chủ: tự lấy bài mới nhất, hoặc ghim tay.
import type { Field, GlobalConfig } from "payload";
import { ai, chiChuBien } from "../access";
import { lamMoiGlobal } from "../hooks/lamMoiWeb";
import { DUONG_TRONG_SITE } from "./DieuHuong";

const lich: Field[] = [
  { type: "row", fields: [
    { name: "tu_ngay", label: "Hiện từ (để trống = ngay)", type: "date",
      admin: { date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }, width: "50%" } },
    { name: "den_ngay", label: "Hiện đến (để trống = không hạn)", type: "date",
      admin: { date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }, width: "50%" } },
  ] },
];

const duongTuyChon = (ten: string, nhan: string): Field => ({
  name: ten, label: nhan, type: "text",
  validate: (v: unknown) => !v || (typeof v === "string" && DUONG_TRONG_SITE.test(v)) || "Đường dẫn trong site, bắt đầu bằng /",
});

export const TrangChu: GlobalConfig = {
  slug: "trang-chu",
  label: "Trang chủ & banner",
  admin: { group: "Giao diện website", description: "Dải thông báo, banner và khối bài viết trên hieuban.com. Có hiệu lực sau vài giây." },
  access: { read: ai, update: chiChuBien },
  hooks: { afterChange: [lamMoiGlobal] },
  fields: [
    {
      name: "thong_bao", label: "Dải thông báo đầu trang (mọi trang)", type: "group",
      admin: { description: "Một dòng chữ thuần (vd \"Tuần này mời bạn được 40 Sao\"). Tắt hoặc để trống = không hiện." },
      fields: [
        { name: "bat", label: "Bật", type: "checkbox", defaultValue: false },
        { name: "chu", label: "Nội dung", type: "text", maxLength: 160 },
        duongTuyChon("link", "Link khi bấm (để trống = không có link)"),
        ...lich,
      ],
    },
    {
      name: "banner", label: "Banner trang chủ", type: "group",
      admin: { description: "Khung nổi bật trên trang chủ, ngay dưới phần giới thiệu. Ảnh ngang (≥ 1200px), chữ ngắn." },
      fields: [
        { name: "bat", label: "Bật", type: "checkbox", defaultValue: false },
        { name: "nhan", label: "Nhãn nhỏ phía trên (vd \"Mới\", \"Sự kiện\")", type: "text", maxLength: 30 },
        { name: "tieu_de", label: "Tiêu đề", type: "text", maxLength: 90 },
        { name: "mo_ta", label: "Mô tả", type: "textarea", maxLength: 240 },
        { name: "anh", label: "Ảnh (tuỳ chọn)", type: "upload", relationTo: "media" },
        { type: "row", fields: [
          { name: "nut_chu", label: "Chữ trên nút", type: "text", maxLength: 30, admin: { width: "50%" } },
          { ...duongTuyChon("nut_link", "Link của nút"), admin: { width: "50%" } } as Field,
        ] },
        ...lich,
      ],
    },
    {
      name: "bai_viet", label: "Khối \"Bài viết mới\" trên trang chủ", type: "group",
      fields: [
        { name: "bat", label: "Bật", type: "checkbox", defaultValue: true },
        { name: "tieu_de", label: "Tiêu đề khối", type: "text", defaultValue: "Bài viết mới", maxLength: 60 },
        { name: "so_bai", label: "Số bài", type: "number", defaultValue: 3, min: 2, max: 6 },
        {
          name: "ghim", label: "Ghim bài (để trống = tự lấy bài mới nhất)", type: "relationship", relationTo: "bai-viet",
          hasMany: true, maxRows: 6, filterOptions: { _status: { equals: "published" } },
        },
      ],
    },
    {
      name: "bai_theo_mang", label: "Khối \"Bài viết liên quan\" ở trang công cụ & Huyền học/Kiến thức", type: "group",
      admin: { description: "Mỗi trang công cụ (Thần số, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Hợp đôi, Hôm nay) tự hiện bài CMS cùng MẢNG." },
      fields: [
        { name: "bat", label: "Bật", type: "checkbox", defaultValue: true },
        { name: "so_bai", label: "Số bài mỗi trang", type: "number", defaultValue: 3, min: 1, max: 6 },
      ],
    },
  ],
};

// ND — khối đặt quanh nội dung một URL ("Trang website" / "Mẫu cụm trang"): vị trí cố định (trên / dưới / cuối), mỗi
// vị trí tối đa 6 khối. Dùng lại 4 khối Lexical (ghi chú, mời dùng công cụ, trích dẫn, video) + 5 khối của Trang đích
// (thẻ công cụ, danh sách bài, hỏi đáp, lời mời, đoạn văn) + 3 khối mới (banner, ảnh, nút kêu gọi).
// "Cỡ chữ" chỉ là lựa chọn có sẵn (cỡ · căn · nền), web ánh xạ sang lớp CSS — không CSS/px tự do (mục 3.3 thiết kế).
import type { Block, Field } from "payload";
import { DUONG_TRONG_SITE } from "../globals/DieuHuong";
import { KHOI as KHOI_TRANG_DICH } from "../collections/TrangDich";
import { GhiChu, KeuGoiCongCu, TrichDan, Video } from "./index";

const duong = (bat: boolean) => (v: unknown) =>
  (!bat && !v) || (typeof v === "string" && DUONG_TRONG_SITE.test(v)) || "Đường dẫn trong site, bắt đầu bằng / (vd /than-so)";

/** Kiểu chữ có sẵn: cỡ · căn · nền nhấn. */
export const truongKieuChu: Field = {
  name: "kieu_chu", label: "Kiểu chữ", type: "group",
  admin: { description: "Chọn trong bộ có sẵn (theo hệ thiết kế, đúng cả hai giao diện Đêm sao / Giấy cổ)." },
  fields: [{
    type: "row", fields: [
      { name: "co", label: "Cỡ chữ", type: "select", defaultValue: "thuong", admin: { width: "33%" }, options: [
        { label: "Nhỏ", value: "nho" }, { label: "Thường", value: "thuong" }, { label: "Lớn", value: "lon" }, { label: "Rất lớn", value: "rat_lon" }] },
      { name: "can", label: "Căn lề", type: "select", defaultValue: "trai", admin: { width: "33%" }, options: [
        { label: "Trái", value: "trai" }, { label: "Giữa", value: "giua" }] },
      { name: "nen", label: "Nền nhấn", type: "select", defaultValue: "khong", admin: { width: "33%" }, options: [
        { label: "Không", value: "khong" }, { label: "Kính mờ", value: "nhan" }, { label: "Vàng", value: "vang" }, { label: "Ngọc", value: "ngoc" }] },
    ],
  }],
};

const lich: Field = { type: "row", fields: [
  { name: "tu_ngay", label: "Hiện từ (trống = ngay)", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
  { name: "den_ngay", label: "Hiện đến (trống = không hạn)", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
] };

export const Banner: Block = {
  slug: "banner",
  labels: { singular: "Banner", plural: "Banner" },
  fields: [
    { name: "nhan", label: "Nhãn nhỏ (vd \"Mới\")", type: "text", maxLength: 40 },
    { name: "tieu_de", label: "Tiêu đề", type: "text", required: true, maxLength: 90 },
    { name: "mo_ta", label: "Mô tả", type: "textarea", maxLength: 300 },
    { name: "anh", label: "Ảnh (tuỳ chọn)", type: "upload", relationTo: "media" },
    { type: "row", fields: [
      { name: "nut_chu", label: "Chữ trên nút", type: "text", maxLength: 40, admin: { width: "50%" } },
      { name: "nut_link", label: "Nút dẫn tới", type: "text", validate: duong(false), admin: { width: "50%" } },
    ] },
    lich,
    truongKieuChu,
  ],
};

/** ND-5 — ảnh đứng riêng (thay hình minh hoạ, ảnh chiến dịch…): ảnh từ thư viện Media, chú thích, link trong site. */
export const Anh: Block = {
  slug: "anh",
  labels: { singular: "Ảnh", plural: "Ảnh" },
  fields: [
    { name: "anh", label: "Ảnh", type: "upload", relationTo: "media", required: true,
      admin: { description: "Mô tả ảnh (alt) lấy từ ô \"Mô tả ảnh\" trong thư viện Media — bắt buộc cho người khiếm thị và Google." } },
    { name: "chu_thich", label: "Chú thích dưới ảnh", type: "text", maxLength: 200 },
    { type: "row", fields: [
      { name: "link", label: "Bấm ảnh dẫn tới (tuỳ chọn)", type: "text", validate: duong(false), admin: { width: "50%" } },
      { name: "co", label: "Độ rộng", type: "select", defaultValue: "vua", admin: { width: "50%" }, options: [
        { label: "Vừa (khung chữ)", value: "vua" }, { label: "Rộng (cả khung trang)", value: "rong" }, { label: "Nhỏ", value: "nho" }] },
    ] },
    lich,
  ],
};

export const NutMoi: Block = {
  slug: "nut_moi",
  labels: { singular: "Nút kêu gọi", plural: "Nút kêu gọi" },
  fields: [
    { name: "chu", label: "Chữ trên nút", type: "text", required: true, maxLength: 60 },
    { name: "link", label: "Dẫn tới", type: "text", required: true, validate: duong(true) },
    { name: "kieu", label: "Kiểu", type: "select", defaultValue: "chinh", options: [{ label: "Nút chính", value: "chinh" }, { label: "Nút phụ", value: "phu" }] },
    { name: "ma_do", label: "Mã đo (sự kiện cms_khoi_bam)", type: "text", maxLength: 40,
      admin: { description: "Chữ thường, số, gạch dưới (vd moi_ban_tet). Để so số bấm theo trang." },
      validate: (v: unknown) => !v || (typeof v === "string" && /^[a-z0-9_]{1,40}$/.test(v)) || "Chỉ chữ thường không dấu, số, gạch dưới." },
  ],
};

const tuTrangDich = (slug: string) => KHOI_TRANG_DICH.find((k) => k.slug === slug)!;

/** Bộ khối cho khoi_tren / khoi_duoi / khoi_cuoi. Không có "Đầu trang (hero)" — đầu trang là ô riêng của URL. */
export const KHOI_TRANG: Block[] = [
  Banner, Anh, NutMoi, GhiChu, KeuGoiCongCu, TrichDan, Video,
  ...["cong_cu", "bai_viet", "hoi_dap", "loi_moi", "van_ban"].map(tuTrangDich),
];

export const VI_TRI_KHOI = [
  { name: "khoi_tren", label: "Khối phía trên (dưới đầu trang)" },
  { name: "khoi_duoi", label: "Khối phía dưới (sau nội dung / kết quả)" },
  { name: "khoi_cuoi", label: "Khối cuối trang" },
] as const;

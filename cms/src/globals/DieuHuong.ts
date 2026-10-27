// Điều hướng chân trang hieuban.com (4 cột: Huyền học · Kiến thức · Về chúng tôi · Pháp lý — hoặc cột anh tự đặt).
// Mỗi liên kết trỏ tới: một trang trong site (đường dẫn), một bài viết CMS, hoặc một chuyên mục CMS.
// Để trống toàn bộ = web dùng menu mặc định trong code (MENU_MAC_DINH — giống hệt menu đang chạy).
// Thanh menu trên cùng: global riêng "Menu đầu trang" (globals/MenuDauTrang.ts).
// ND-1: thêm chữ của chân trang — khối thương hiệu (giới thiệu + 3 cam kết), lời miễn trừ, nhãn nút ủng hộ. Ô trống = web
// dùng chữ trong code (web/lib/menu-chan-trang.ts — e2e kiểm hai bản khớp). Đường dây khẩn cấp 115/113/111, dòng ©,
// thông tin đơn vị vận hành (env) giữ trong code — không sửa ở đây.
import { APIError, type Field, type GlobalBeforeChangeHook, type GlobalConfig } from "payload";
import { ai, chiChuBien, truongChuBien } from "../access";
import { lamMoiGlobal } from "../hooks/lamMoiWeb";
import { chuanHoaDuLieu, kiemRanhGioi } from "../kiem-dinh/kiem-dinh";

/** Đường dẫn trong site: bắt đầu bằng "/", không có khoảng trắng, không "//" (chặn link sang trang khác giả làm nội bộ). */
export const DUONG_TRONG_SITE = /^\/(?![/\\])[^\s\\]*$/;   // chặn //x và /\x (trình duyệt hiểu là link ngoài)

export const MENU_MAC_DINH: { ten: string; lien_ket: { nhan: string; duong_dan: string }[] }[] = [
  { ten: "Huyền học", lien_ket: [
    ["/than-so", "Thần số học"], ["/tu-vi", "Tử vi"], ["/bat-tu", "Bát tự"], ["/kinh-dich", "Kinh Dịch"],
    ["/phong-thuy", "Phong thuỷ"], ["/hop-doi", "Hợp đôi"], ["/huyen-hoc", "Tất cả các mảng"],
  ].map(([duong_dan, nhan]) => ({ nhan: nhan!, duong_dan: duong_dan! })) },
  { ten: "Kiến thức", lien_ket: [
    ["/kien-thuc", "Thư viện kiến thức"], ["/than-so/y-nghia-so", "Ý nghĩa các con số"], ["/kinh-dich/que", "64 quẻ Kinh Dịch"],
    ["/tu-vi/chinh-tinh", "14 chính tinh Tử vi"], ["/tu-dien", "Từ điển thuật ngữ"], ["/tu-vi/la-so-mau", "Lá số mẫu"],
    ["/phong-thuy/huong-hop-tuoi", "Hướng hợp tuổi"], ["/hop-doi/cap-so", "Số chủ đạo hợp nhau"], ["/blog", "Blog"],
  ].map(([duong_dan, nhan]) => ({ nhan: nhan!, duong_dan: duong_dan! })) },
  { ten: "Về chúng tôi", lien_ket: [
    ["/gioi-thieu", "Giới thiệu & phương pháp"], ["/tac-gia/duc-luan", "Chủ biên Đức Luân"], ["/gioi-thieu#nguon", "Nguồn tri thức"],
    ["/lien-he", "Liên hệ"], ["/lien-he#chu-de", "Góp ý, báo lỗi"], ["/tai-khoan", "Tài khoản"], ["/nap-sao", "Nạp Sao"],
  ].map(([duong_dan, nhan]) => ({ nhan: nhan!, duong_dan: duong_dan! })) },
  { ten: "Pháp lý", lien_ket: [
    ["/chinh-sach-rieng-tu", "Chính sách quyền riêng tư"], ["/dieu-khoan", "Điều khoản sử dụng"],
    ["/mien-tru-trach-nhiem", "Miễn trừ trách nhiệm"], ["/chinh-sach-rieng-tu#quyen", "Yêu cầu về dữ liệu cá nhân"],
  ].map(([duong_dan, nhan]) => ({ nhan: nhan!, duong_dan: duong_dan! })) },
];

/** Chữ chân trang đang chạy trong code (trùng web/lib/menu-chan-trang.ts — e2e/so-lieu-ngoai.spec.ts kiểm). */
export const CHAN_TRANG_MAC_DINH = {
  gioi_thieu: "Năm hệ thống văn hoá — thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.",
  cam_ket: [
    { chu: "Hồ sơ mặc định chỉ lưu trên máy bạn", bieu_tuong: "khien" },
    { chu: "Lá số tính trên hệ thống riêng; họ tên, ngày sinh không chuyển cho bên thứ ba", bieu_tuong: "may_chu" },
    { chu: "Không bán dữ liệu, không quảng cáo nhắm mục tiêu", bieu_tuong: "lap_lanh" },
  ],
  mien_tru: "Nội dung biên soạn từ thư tịch văn hoá cổ điển, để tham khảo và tự suy ngẫm, không phải dự báo. Nội dung không thay thế ý kiến chuyên môn về y tế, tâm lý, pháp lý, tài chính. Nội dung do Ban biên tập Hiểu Bản Thân biên soạn từ cổ thư và tài liệu tham khảo, chủ biên Đức Luân chịu trách nhiệm.",
  nhan_ung_ho: "Ủng hộ đội ngũ phát triển",
};

/** 8 biểu tượng cố định cho dòng cam kết (web ánh xạ sang biểu tượng lucide có sẵn). */
export const BIEU_TUONG_CAM_KET = [
  { label: "Khiên (bảo vệ)", value: "khien" }, { label: "Máy chủ", value: "may_chu" }, { label: "Lấp lánh", value: "lap_lanh" },
  { label: "Ổ khoá", value: "khoa" }, { label: "Bắt tay", value: "bat_tay" }, { label: "Sách", value: "sach" },
  { label: "Cân", value: "can" }, { label: "La bàn", value: "la_ban" },
];

/** Chữ chân trang: chặn vùng cấm, liên hệ gõ tay, tên nội bộ, tự nhận thẩm định (luật chung kiem-dinh.ts). */
const kiemChanTrang: GlobalBeforeChangeHook = ({ data }) => {
  const th = (data.thuong_hieu ?? {}) as { gioi_thieu?: string; cam_ket?: { chu?: string }[] };
  const van = [th.gioi_thieu, ...(th.cam_ket ?? []).map((c) => c?.chu), data.mien_tru, data.nhan_ung_ho]
    .filter((x): x is string => typeof x === "string").join("\n");
  const chan = kiemRanhGioi(van).filter((m) => m.chan);
  if (chan.length) throw new APIError("Chưa lưu được — " + chan.map((m) => m.thong_diep).join(" · "), 400, null, true);
  return data;
};

export const truongLienKet: Field[] = [
  { name: "nhan", label: "Chữ hiển thị", type: "text", required: true, maxLength: 60 },
  {
    name: "loai", label: "Trỏ tới", type: "radio", defaultValue: "duong_dan",
    options: [
      { label: "Trang trong site", value: "duong_dan" },
      { label: "Bài viết", value: "bai" },
      { label: "Chuyên mục", value: "chuyen_muc" },
    ],
    admin: { layout: "horizontal" },
  },
  {
    name: "duong_dan", label: "Đường dẫn (vd /tu-vi, /than-so/y-nghia-so)", type: "text",
    admin: { condition: (_, s) => (s?.loai ?? "duong_dan") === "duong_dan" },
    validate: (v: unknown, { siblingData }: { siblingData?: { loai?: string } }) =>
      (siblingData?.loai ?? "duong_dan") !== "duong_dan" || (typeof v === "string" && DUONG_TRONG_SITE.test(v))
        || "Nhập đường dẫn trong site, bắt đầu bằng / (vd /kien-thuc)",
  },
  {
    name: "bai", label: "Bài viết", type: "relationship", relationTo: "bai-viet",
    filterOptions: { _status: { equals: "published" } },
    admin: { condition: (_, s) => s?.loai === "bai" },
    validate: (v: unknown, { siblingData }: { siblingData?: { loai?: string } }) =>
      siblingData?.loai !== "bai" || Boolean(v) || "Chọn bài viết",
  },
  {
    name: "chuyen_muc", label: "Chuyên mục", type: "relationship", relationTo: "chuyen-muc",
    admin: { condition: (_, s) => s?.loai === "chuyen_muc" },
    validate: (v: unknown, { siblingData }: { siblingData?: { loai?: string } }) =>
      siblingData?.loai !== "chuyen_muc" || Boolean(v) || "Chọn chuyên mục",
  },
];

export const DieuHuong: GlobalConfig = {
  slug: "dieu-huong",
  label: "Điều hướng chân trang",
  admin: {
    group: "Giao diện website",
    description: "Các cột liên kết cuối mọi trang hieuban.com. Để trống = dùng menu mặc định. Đổi xong có hiệu lực sau vài giây.",
  },
  access: { read: ai, update: chiChuBien },
  hooks: { beforeValidate: [({ data }) => (data ? chuanHoaDuLieu(data) : data)], beforeChange: [kiemChanTrang], afterChange: [lamMoiGlobal] },
  fields: [
    {
      name: "cot", label: "Cột liên kết", type: "array", maxRows: 4,   // chân trang web dựng lưới 4 cột
      labels: { singular: "Cột", plural: "Cột" },
      defaultValue: MENU_MAC_DINH.map((c) => ({ ...c, lien_ket: c.lien_ket.map((l) => ({ ...l, loai: "duong_dan" })) })),
      admin: { initCollapsed: true, components: { RowLabel: "/components/NhanDong#NhanCot" } },
      fields: [
        { name: "ten", label: "Tên cột", type: "text", required: true, maxLength: 40 },
        {
          name: "lien_ket", label: "Liên kết", type: "array", maxRows: 15,
          labels: { singular: "Liên kết", plural: "Liên kết" },
          admin: { components: { RowLabel: "/components/NhanDong#NhanLienKet" } },
          fields: truongLienKet,
        },
      ],
    },
      {
      name: "thuong_hieu", label: "Khối thương hiệu (cột trái chân trang)", type: "group",
      admin: { description: "Để trống = chữ đang chạy trong code." },
      fields: [
        { name: "gioi_thieu", label: "Lời giới thiệu", type: "textarea", maxLength: 300, defaultValue: CHAN_TRANG_MAC_DINH.gioi_thieu },
        {
          name: "cam_ket", label: "Cam kết dữ liệu", type: "array", maxRows: 3,
          labels: { singular: "Cam kết", plural: "Cam kết" },
          defaultValue: CHAN_TRANG_MAC_DINH.cam_ket,
          admin: { description: "⚠ Đây là cam kết quyền riêng tư — phải khớp trang Chính sách quyền riêng tư. Tối đa 3 dòng." },
          fields: [{ type: "row", fields: [
            { name: "chu", label: "Chữ", type: "text", required: true, maxLength: 120, admin: { width: "70%" } },
            { name: "bieu_tuong", label: "Biểu tượng", type: "select", required: true, defaultValue: "khien", options: BIEU_TUONG_CAM_KET, admin: { width: "30%" } },
          ] }],
        },
      ],
    },
    {
      name: "mien_tru", label: "Lời miễn trừ (cuối mọi trang)", type: "textarea", required: true, maxLength: 600,
      defaultValue: CHAN_TRANG_MAC_DINH.mien_tru, access: { update: truongChuBien },
      admin: { description: "Bắt buộc, chỉ Chủ biên sửa. Đường dây khẩn cấp 115 · 113 · 111 luôn hiện ngay dưới (giữ trong code)." },
    },
    { name: "nhan_ung_ho", label: "Nhãn nút ủng hộ", type: "text", maxLength: 40, defaultValue: CHAN_TRANG_MAC_DINH.nhan_ung_ho },
    { type: "ui", name: "loi_tat", label: "Sửa nội dung các trang trong chân trang",
      admin: { components: { Field: "/components/LoiTatChanTrang#LoiTatChanTrang" } } },
  ],
};

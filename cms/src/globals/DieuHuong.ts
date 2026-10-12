// Điều hướng chân trang hieuban.com (4 cột: Khám phá · Kiến thức · Về chúng tôi · Pháp lý — hoặc cột anh tự đặt).
// Mỗi liên kết trỏ tới: một trang trong site (đường dẫn), một bài viết CMS, hoặc một chuyên mục CMS.
// Để trống toàn bộ = web dùng menu mặc định trong code (MENU_MAC_DINH — giống hệt menu đang chạy).
// Thanh điều hướng trên cùng (4 tab có biểu tượng) KHÔNG nằm ở đây: gắn với định tuyến công cụ, sửa sai là gãy trang.
import type { Field, GlobalConfig } from "payload";
import { ai, chiChuBien } from "../access";
import { lamMoiGlobal } from "../hooks/lamMoiWeb";

/** Đường dẫn trong site: bắt đầu bằng "/", không có khoảng trắng, không "//" (chặn link sang trang khác giả làm nội bộ). */
export const DUONG_TRONG_SITE = /^\/(?![/\\])[^\s\\]*$/;   // chặn //x và /\x (trình duyệt hiểu là link ngoài)

export const MENU_MAC_DINH: { ten: string; lien_ket: { nhan: string; duong_dan: string }[] }[] = [
  { ten: "Khám phá", lien_ket: [
    ["/than-so", "Thần số học"], ["/tu-vi", "Tử vi"], ["/bat-tu", "Bát tự"], ["/kinh-dich", "Kinh Dịch"],
    ["/phong-thuy", "Phong thuỷ"], ["/hop-doi", "Hợp đôi"],
  ].map(([duong_dan, nhan]) => ({ nhan: nhan!, duong_dan: duong_dan! })) },
  { ten: "Kiến thức", lien_ket: [
    ["/kien-thuc", "Thư viện kiến thức"], ["/kien-thuc/than-so", "Ý nghĩa các con số"], ["/kien-thuc/kinh-dich", "64 quẻ Kinh Dịch"],
    ["/kien-thuc/tu-vi", "14 chính tinh Tử vi"], ["/tu-dien", "Từ điển thuật ngữ"], ["/la-so-mau", "Lá số mẫu"],
    ["/phong-thuy/huong-hop-tuoi", "Hướng hợp tuổi"], ["/kien-thuc/hop-so", "Số chủ đạo hợp nhau"], ["/blog", "Blog"],
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
    name: "duong_dan", label: "Đường dẫn (vd /tu-vi, /kien-thuc/than-so)", type: "text",
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
  hooks: { afterChange: [lamMoiGlobal] },
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
  ],
};

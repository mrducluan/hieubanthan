// Menu đầu trang hieuban.com: mục cha (thanh trên máy tính + tab dưới điện thoại) và menu con (bảng thả xuống khi rê/bấm
// vào mục cha trên máy tính). Mỗi liên kết trỏ tới trang trong site, bài viết hoặc chuyên mục — như chân trang.
// Để trống = web dùng menu mặc định trong code (MENU_DAU_MAC_DINH — giống hệt menu đang chạy). Bản mặc định phải trùng
// web/lib/menu-dau-trang.ts (e2e so-lieu-ngoai.spec.ts kiểm hai bản khớp nhau).
// Mục cha đang sáng theo trang người dùng đang xem: trùng đường dẫn mục cha HOẶC bất kỳ menu con nào (vd đang ở /tu-vi
// → "Khám phá" sáng vì /tu-vi là menu con của Khám phá).
import type { GlobalConfig } from "payload";
import { ai, chiChuBien } from "../access";
import { lamMoiGlobal } from "../hooks/lamMoiWeb";
import { truongLienKet } from "./DieuHuong";

export const BIEU_TUONG = [
  { label: "Lấp lánh (Bản thân)", value: "lap_lanh" },
  { label: "Trái tim (Hợp đôi)", value: "trai_tim" },
  { label: "La bàn (Khám phá)", value: "la_ban" },
  { label: "Sách (Kiến thức)", value: "sach" },
  { label: "Tờ báo (Blog)", value: "bao" },
  { label: "Ngôi sao (Sao)", value: "sao" },
  { label: "Lịch (Hôm nay)", value: "lich" },
  { label: "Người (Tài khoản)", value: "nguoi" },
] as const;

type Lk = { nhan: string; duong_dan: string };
const lk = (duong_dan: string, nhan: string): Lk => ({ nhan, duong_dan });

export const MENU_DAU_MAC_DINH: (Lk & { bieu_tuong: string; di_dong: boolean; con: (Lk & { mo_ta: string })[] })[] = [
  { ...lk("/ban-than", "Bản thân"), bieu_tuong: "lap_lanh", di_dong: true, con: [
    { ...lk("/than-so", "Thần số học"), mo_ta: "Con số chủ đạo, biểu đồ ngày sinh, năm cá nhân" },
    { ...lk("/hom-nay", "Hôm nay của bạn"), mo_ta: "Ngày cá nhân, âm lịch và một câu tự soi mỗi ngày" },
    { ...lk("/xem-ngay-tot", "Xem ngày tốt"), mo_ta: "Hoàng đạo, giờ tốt, việc nên làm, tìm ngày đẹp" },
  ] },
  { ...lk("/hop-doi", "Hợp đôi"), bieu_tuong: "trai_tim", di_dong: true, con: [] },
  { ...lk("/kham-pha", "Khám phá"), bieu_tuong: "la_ban", di_dong: true, con: [
    { ...lk("/tu-vi", "Tử vi"), mo_ta: "Lá số 12 cung, đại hạn, lưu niên" },
    { ...lk("/bat-tu", "Bát tự"), mo_ta: "Tứ trụ, ngũ hành, thập thần" },
    { ...lk("/kinh-dich", "Kinh Dịch"), mo_ta: "Gieo quẻ, đọc lời hào" },
    { ...lk("/phong-thuy", "Phong thuỷ"), mo_ta: "Hướng nhà, mệnh quái, bố trí" },
    { ...lk("/xem-tuoi-lam-nha", "Tuổi làm nhà, cưới hỏi"), mo_ta: "Kim lâu, Hoang ốc, Tam tai, năm thuận" },
    { ...lk("/huong-xau-nam", "Hướng xấu theo năm"), mo_ta: "Thái Tuế, Tam Sát, Ngũ Hoàng" },
    { ...lk("/tuoi-xong-dat", "Tuổi xông đất"), mo_ta: "Tuổi hợp gia chủ, giờ đẹp mùng 1" },
    { ...lk("/kien-thuc", "Thư viện kiến thức"), mo_ta: "Nghĩa sao, quẻ, con số — tra cứu miễn phí" },
  ] },
  { ...lk("/blog", "Blog"), bieu_tuong: "bao", di_dong: false, con: [] },
  { ...lk("/tai-khoan", "Tài khoản"), bieu_tuong: "nguoi", di_dong: true, con: [
    { ...lk("/nap-sao", "Nạp Sao"), mo_ta: "Ví Sao, gói nạp" },
  ] },
];

export const MenuDauTrang: GlobalConfig = {
  slug: "menu-dau-trang",
  label: "Menu đầu trang",
  admin: {
    group: "Giao diện website",
    description: "Thanh menu trên cùng (máy tính) + tab dưới (điện thoại). Mục cha có thể có menu con thả xuống. Để trống = dùng menu mặc định. Đổi xong có hiệu lực sau vài giây.",
  },
  access: { read: ai, update: chiChuBien },
  hooks: { afterChange: [lamMoiGlobal] },
  fields: [
    {
      name: "muc", label: "Mục menu", type: "array", maxRows: 7,   // thanh trên máy tính vừa 7 mục
      labels: { singular: "Mục cha", plural: "Mục cha" },
      defaultValue: MENU_DAU_MAC_DINH.map(({ con, ...m }) => ({
        ...m, loai: "duong_dan", con: con.map((c) => ({ ...c, loai: "duong_dan" })),
      })),
      admin: { initCollapsed: true, components: { RowLabel: "/components/NhanDong#NhanLienKet" } },
      validate: (v: unknown) => {
        // validate riêng thay bộ kiểm mảng mặc định của Payload → tự kiểm lại maxRows (API cũng bị chặn, không chỉ admin).
        const ds = Array.isArray(v) ? (v as { di_dong?: boolean }[]) : [];
        if (ds.length > 7) return "Tối đa 7 mục cha (thanh trên máy tính chỉ vừa 7 mục).";
        return ds.filter((m) => m.di_dong).length <= 5 || "Tab dưới trên điện thoại chỉ vừa tối đa 5 mục — bỏ chọn bớt \"Hiện ở tab dưới\".";
      },
      fields: [
        ...truongLienKet,
        {
          type: "row",
          fields: [
            { name: "bieu_tuong", label: "Biểu tượng (tab dưới điện thoại)", type: "select", defaultValue: "la_ban",
              options: [...BIEU_TUONG], admin: { width: "50%" } },
            { name: "di_dong", label: "Hiện ở tab dưới trên điện thoại (tối đa 5)", type: "checkbox", defaultValue: true,
              admin: { width: "50%" } },
          ],
        },
        {
          name: "con", label: "Menu con (thả xuống)", type: "array", maxRows: 12,
          labels: { singular: "Menu con", plural: "Menu con" },
          admin: { initCollapsed: true, components: { RowLabel: "/components/NhanDong#NhanLienKet" },
            description: "Để trống = mục cha chỉ là một liên kết, không có bảng thả xuống." },
          fields: [
            ...truongLienKet,
            { name: "mo_ta", label: "Mô tả ngắn (một dòng dưới tên)", type: "text", maxLength: 80 },
          ],
        },
      ],
    },
  ],
};

// Menu đầu trang hieuban.com: mục cha (thanh trên máy tính + tab dưới điện thoại) và menu con (bảng thả xuống khi rê/bấm
// vào mục cha trên máy tính). Mỗi liên kết trỏ tới trang trong site, bài viết hoặc chuyên mục — như chân trang.
// Để trống = web dùng menu mặc định trong code (MENU_DAU_MAC_DINH — giống hệt menu đang chạy). Bản mặc định phải trùng
// web/lib/menu-dau-trang.ts (e2e so-lieu-ngoai.spec.ts kiểm hai bản khớp nhau).
// Mục cha đang sáng theo trang người dùng đang xem: trùng đường dẫn mục cha HOẶC bất kỳ menu con nào (vd đang ở /tu-vi
// → "Huyền học" sáng vì /tu-vi là menu con của Huyền học).
import type { GlobalConfig } from "payload";
import { ai, chiChuBien } from "../access";
import { lamMoiGlobal } from "../hooks/lamMoiWeb";
import { truongLienKet } from "./DieuHuong";

export const BIEU_TUONG = [
  { label: "Lấp lánh (Bản thân)", value: "lap_lanh" },
  { label: "Trái tim (Hợp đôi)", value: "trai_tim" },
  { label: "La bàn (Huyền học)", value: "la_ban" },
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
    { ...lk("/than-so", "Thần số học"), mo_ta: "Bốn số cốt lõi, Bản đồ con số, năm cá nhân" },
    { ...lk("/hom-nay", "Hôm nay của bạn"), mo_ta: "Ngày cá nhân, âm lịch và một câu tự soi mỗi ngày" },
    { ...lk("/xem-ngay-tot", "Xem ngày tốt"), mo_ta: "Hoàng đạo, giờ tốt, việc nên làm, tìm ngày đẹp" },
  ] },
  { ...lk("/hop-doi", "Hợp đôi"), bieu_tuong: "trai_tim", di_dong: true, con: [
    { ...lk("/hop-doi", "Hợp đôi thần số"), mo_ta: "Hai con số chủ đạo, không chấm điểm" },
    { ...lk("/tu-vi#hop-tham", "Xem lá số 2 người"), mo_ta: "Điểm hợp – khắc theo Tử vi, cách dung hoà" },
    { ...lk("/hop-doi/cap-so", "Số chủ đạo hợp nhau"), mo_ta: "45 cặp số, hợp ở đâu, vấp ở đâu" },
  ] },
  { ...lk("/huyen-hoc", "Huyền học"), bieu_tuong: "la_ban", di_dong: true, con: [
    { ...lk("/tu-vi", "Tử vi"), mo_ta: "Lá số 12 cung, 3 tháng tới, định giờ sinh" },
    { ...lk("/bat-tu", "Bát tự"), mo_ta: "Tứ trụ, ngũ hành, thập thần" },
    { ...lk("/kinh-dich", "Kinh Dịch"), mo_ta: "Gieo 3 đồng xu, quẻ đầu ngày, lời hào" },
    { ...lk("/phong-thuy", "Phong thuỷ"), mo_ta: "La bàn đo hướng, khảo sát nhà, bố trí" },
    { ...lk("/nhan-tuong", "Nhân tướng học"), mo_ta: "Tự soi gương 31 câu, bài đọc 8 chương, không cần ảnh" },
    // TR-1 menu: Tarot vào menu; 64 quẻ + Thư viện kiến thức nhường chỗ (migration tr_1_menu_tarot).
    { ...lk("/tarot", "Xem Tarot"), mo_ta: "Xáo bài, rút lá, 5 trải bài, 78 lá có nguồn" },
    { ...lk("/xem-tuoi-lam-nha", "Tuổi làm nhà, cưới hỏi"), mo_ta: "Kim lâu, Hoang ốc, Tam tai, năm thuận" },
    // TM-1: ba công cụ có bản theo năm ở menu "Năm" nhường chỗ cho cụm kiến thức lớn (migration tm_1_menu_huyen_hoc).
    { ...lk("/tu-vi/sao-o-cung", "Sao ở từng cung Tử vi"), mo_ta: "14 chính tinh ở 12 cung: sáng hãm, sao đi cùng" },
    { ...lk("/bat-tu/menh-theo-nam", "Sinh năm nào mệnh gì"), mo_ta: "Can chi, nạp âm, màu hợp, tuổi hợp 1950–2027" },
    { ...lk("/phong-thuy/huong-hop-tuoi", "Hướng nhà hợp tuổi"), mo_ta: "Bốn hướng tốt, xấu theo năm sinh" },
    { ...lk("/phong-thuy/dau-hieu", "Dấu hiệu trong nhà"), mo_ta: "23 điều nên rà: cửa, bếp, WC, cầu thang" },
  ] },
  // NAM-1/NAM-2: "{nam}" được web thay bằng năm đang mời xem (gõ {nam} trong chữ / đường dẫn của mục bất kỳ).
  { ...lk("/nam/{nam}", "Năm {nam}"), bieu_tuong: "lich", di_dong: true, con: [
    { ...lk("/thoi-gian-toi", "Thời gian tới của bạn"), mo_ta: "3 tháng, 12 tháng tới theo ngày sinh của bạn" },
    { ...lk("/nam/{nam}", "Năm {nam} con gì, mệnh gì"), mo_ta: "Tết, Tam tai, năm tuổi, 12 con giáp" },
    { ...lk("/nam/{nam}#theo-tuoi", "Tử vi năm {nam} theo tuổi"), mo_ta: "Từng năm sinh, nam mạng và nữ mạng" },
    { ...lk("/xem-sao-han/{nam}", "Sao hạn năm {nam}"), mo_ta: "Sao chiếu theo tuổi, nam và nữ" },
    { ...lk("/xem-tuoi-lam-nha/{nam}", "Tuổi làm nhà năm {nam}"), mo_ta: "Kim lâu, Hoang ốc, Tam tai từng tuổi" },
    { ...lk("/nam/{nam}/cuoi-hoi", "Cưới năm {nam} tuổi nào"), mo_ta: "Kim lâu theo tuổi cô dâu" },
    { ...lk("/nam/{nam}/sinh-con", "Sinh con năm {nam}"), mo_ta: "Tuổi bố mẹ hợp, xung với tuổi con" },
    { ...lk("/tuoi-xong-dat/{nam}", "Xông đất Tết {nam}"), mo_ta: "Tuổi hợp gia chủ, giờ đẹp mùng 1" },
    { ...lk("/phong-thuy/huong-xau-nam/{nam}", "Hướng xấu năm {nam}"), mo_ta: "Thái Tuế, Tam Sát, Ngũ Hoàng" },
    { ...lk("/lich-am/{nam}", "Lịch âm {nam}"), mo_ta: "Tết, tháng nhuận, mùng 1 và rằm" },
    { ...lk("/doi-lich-am-duong", "Đổi lịch âm dương"), mo_ta: "Đổi ngày âm ↔ dương theo lịch Việt Nam" },
    { ...lk("/nam", "Các năm khác"), mo_ta: "Năm âm lịch đang đi và năm tới" },
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

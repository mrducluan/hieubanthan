// Menu đầu trang mặc định (khi CMS chưa nối / lỗi / chậm / để trống). Phải trùng MENU_DAU_MAC_DINH trong
// cms/src/globals/MenuDauTrang.ts — e2e/so-lieu-ngoai.spec.ts kiểm hai bản khớp nhau.
export type BieuTuong = "lap_lanh" | "trai_tim" | "la_ban" | "sach" | "bao" | "sao" | "lich" | "nguoi";
export type MenuCon = { href: string; ten: string; mo_ta?: string };
export type MucMenu = { href: string; ten: string; bieu_tuong: BieuTuong; di_dong: boolean; con: MenuCon[] };

export const MENU_DAU_TRANG: MucMenu[] = [
  { href: "/ban-than", ten: "Bản thân", bieu_tuong: "lap_lanh", di_dong: true, con: [
    { href: "/than-so", ten: "Thần số học", mo_ta: "Con số chủ đạo, biểu đồ ngày sinh, năm cá nhân" },
    { href: "/hom-nay", ten: "Hôm nay của bạn", mo_ta: "Ngày cá nhân, âm lịch và một câu tự soi mỗi ngày" },
  ] },
  { href: "/hop-doi", ten: "Hợp đôi", bieu_tuong: "trai_tim", di_dong: true, con: [] },
  { href: "/kham-pha", ten: "Khám phá", bieu_tuong: "la_ban", di_dong: true, con: [
    { href: "/tu-vi", ten: "Tử vi", mo_ta: "Lá số 12 cung, đại hạn, lưu niên" },
    { href: "/bat-tu", ten: "Bát tự", mo_ta: "Tứ trụ, ngũ hành, thập thần" },
    { href: "/kinh-dich", ten: "Kinh Dịch", mo_ta: "Gieo quẻ, đọc lời hào" },
    { href: "/phong-thuy", ten: "Phong thuỷ", mo_ta: "Hướng nhà, mệnh quái, bố trí" },
    { href: "/kien-thuc", ten: "Thư viện kiến thức", mo_ta: "Nghĩa sao, quẻ, con số — tra cứu miễn phí" },
  ] },
  { href: "/blog", ten: "Blog", bieu_tuong: "bao", di_dong: false, con: [] },
  { href: "/tai-khoan", ten: "Tài khoản", bieu_tuong: "nguoi", di_dong: true, con: [
    { href: "/nap-sao", ten: "Nạp Sao", mo_ta: "Ví Sao, gói nạp" },
  ] },
];

/** Đang ở mục này: trùng đường dẫn mục cha hoặc một menu con (vd /tu-vi/... → "Khám phá"); /tai-khoan gồm cả /dang-nhap. */
export function dangOMuc(path: string, m: Pick<MucMenu, "href" | "con">): boolean {
  const ds = [m.href, ...m.con.map((c) => c.href), ...(m.href === "/tai-khoan" ? ["/dang-nhap"] : [])]
    .map((h) => h.split(/[?#]/)[0]!).filter((h) => h && h !== "/");
  return ds.some((k) => path === k || path.startsWith(k + "/"));
}

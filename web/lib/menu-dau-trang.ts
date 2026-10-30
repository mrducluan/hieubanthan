// Menu đầu trang mặc định (khi CMS chưa nối / lỗi / chậm / để trống). Phải trùng MENU_DAU_MAC_DINH trong
// cms/src/globals/MenuDauTrang.ts — e2e/so-lieu-ngoai.spec.ts kiểm hai bản khớp nhau.
export type BieuTuong = "lap_lanh" | "trai_tim" | "la_ban" | "sach" | "bao" | "sao" | "lich" | "nguoi";
export type MenuCon = { href: string; ten: string; mo_ta?: string };
export type MucMenu = { href: string; ten: string; bieu_tuong: BieuTuong; di_dong: boolean; con: MenuCon[] };

export const MENU_DAU_TRANG: MucMenu[] = [
  { href: "/ban-than", ten: "Bản thân", bieu_tuong: "lap_lanh", di_dong: true, con: [
    { href: "/than-so", ten: "Thần số học", mo_ta: "Con số chủ đạo, biểu đồ ngày sinh, năm cá nhân" },
    { href: "/hom-nay", ten: "Hôm nay của bạn", mo_ta: "Ngày cá nhân, âm lịch và một câu tự soi mỗi ngày" },
    { href: "/xem-ngay-tot", ten: "Xem ngày tốt", mo_ta: "Hoàng đạo, giờ tốt, việc nên làm, tìm ngày đẹp" },
  ] },
  { href: "/hop-doi", ten: "Hợp đôi", bieu_tuong: "trai_tim", di_dong: true, con: [] },
  { href: "/huyen-hoc", ten: "Huyền học", bieu_tuong: "la_ban", di_dong: true, con: [
    { href: "/tu-vi", ten: "Tử vi", mo_ta: "Lá số 12 cung, đại hạn, lưu niên" },
    { href: "/bat-tu", ten: "Bát tự", mo_ta: "Tứ trụ, ngũ hành, thập thần" },
    { href: "/kinh-dich", ten: "Kinh Dịch", mo_ta: "Gieo quẻ, đọc lời hào" },
    { href: "/phong-thuy", ten: "Phong thuỷ", mo_ta: "Hướng nhà, mệnh quái, bố trí" },
    { href: "/xem-tuoi-lam-nha", ten: "Tuổi làm nhà, cưới hỏi", mo_ta: "Kim lâu, Hoang ốc, Tam tai, năm thuận" },
    { href: "/phong-thuy/huong-xau-nam", ten: "Hướng xấu theo năm", mo_ta: "Thái Tuế, Tam Sát, Ngũ Hoàng" },
    { href: "/tuoi-xong-dat", ten: "Tuổi xông đất", mo_ta: "Tuổi hợp gia chủ, giờ đẹp mùng 1" },
    { href: "/xem-sao-han", ten: "Sao hạn theo tuổi", mo_ta: "La Hầu, Kế Đô, Thái Bạch… đọc bằng lời thường" },
    { href: "/kien-thuc", ten: "Thư viện kiến thức", mo_ta: "Nghĩa sao, quẻ, con số — tra cứu miễn phí" },
  ] },
  // NAM-1/NAM-2 (2026-10-30): menu lớn theo năm — {nam} thay bằng năm engine chọn (năm tới khi Tết sau còn ≤ 120 ngày,
  // không thì năm âm đang đi) lúc dựng trang → không phải sửa tay mỗi năm (`thayNamMenu`).
  { href: "/nam/{nam}", ten: "Năm {nam}", bieu_tuong: "lich", di_dong: true, con: [
    { href: "/thoi-gian-toi", ten: "3 tháng, 12 tháng tới của bạn", mo_ta: "Theo thần số, Tử vi, Bát tự của chính bạn" },
    { href: "/nam/{nam}", ten: "Năm {nam} con gì, mệnh gì", mo_ta: "Tết, Tam tai, năm tuổi, 12 con giáp" },
    { href: "/xem-sao-han/{nam}", ten: "Sao hạn năm {nam}", mo_ta: "Sao chiếu theo tuổi, nam và nữ" },
    { href: "/xem-tuoi-lam-nha/{nam}", ten: "Tuổi làm nhà năm {nam}", mo_ta: "Kim lâu, Hoang ốc, Tam tai từng tuổi" },
    { href: "/nam/{nam}/cuoi-hoi", ten: "Cưới năm {nam} tuổi nào", mo_ta: "Kim lâu theo tuổi cô dâu" },
    { href: "/nam/{nam}/sinh-con", ten: "Sinh con năm {nam}", mo_ta: "Tuổi bố mẹ hợp, xung với tuổi con" },
    { href: "/tuoi-xong-dat/{nam}", ten: "Xông đất Tết {nam}", mo_ta: "Tuổi hợp gia chủ, giờ đẹp mùng 1" },
    { href: "/phong-thuy/huong-xau-nam/{nam}", ten: "Hướng xấu năm {nam}", mo_ta: "Thái Tuế, Tam Sát, Ngũ Hoàng" },
    { href: "/lich-am/{nam}", ten: "Lịch âm {nam}", mo_ta: "Tết, tháng nhuận, mùng 1 và rằm" },
  ] },
  { href: "/blog", ten: "Blog", bieu_tuong: "bao", di_dong: false, con: [] },
  { href: "/tai-khoan", ten: "Tài khoản", bieu_tuong: "nguoi", di_dong: true, con: [
    { href: "/nap-sao", ten: "Nạp Sao", mo_ta: "Ví Sao, gói nạp" },
  ] },
];

/** Đang ở mục này: trùng đường dẫn mục cha hoặc một menu con (vd /tu-vi/... → "Huyền học"); /tai-khoan gồm cả /dang-nhap. */
export function dangOMuc(path: string, m: Pick<MucMenu, "href" | "con">): boolean {
  const ds = [m.href, ...m.con.map((c) => c.href), ...(m.href === "/tai-khoan" ? ["/dang-nhap"] : [])]
    .map((h) => h.split(/[?#]/)[0]!).filter((h) => h && h !== "/");
  return ds.some((k) => path === k || path.startsWith(k + "/"));
}

/** Chỉ MỘT mục sáng: mục khớp đường dẫn dài nhất (vd /blog là mục cha, /blog/chuyen-muc/x là con của mục khác → mục kia). */
export function mucDangO(path: string, ds: Pick<MucMenu, "href" | "con">[]): number {
  let tot = -1, dai = -1;
  ds.forEach((m, i) => {
    for (const h of [m.href, ...m.con.map((c) => c.href), ...(m.href === "/tai-khoan" ? ["/dang-nhap"] : [])]) {
      const k = h.split(/[?#]/)[0]!;
      if (k && k !== "/" && (path === k || path.startsWith(k + "/")) && k.length > dai) { tot = i; dai = k.length; }
    }
  });
  return tot;
}

/** NAM-1: thay "{nam}" trong chữ / đường dẫn menu (bản code và bản CMS) bằng năm đang mời xem. */
export function thayNamMenu(ds: MucMenu[], nam: number): MucMenu[] {
  const t = (x: string) => x.replaceAll("{nam}", String(nam));
  return ds.map((m) => ({ ...m, href: t(m.href), ten: t(m.ten),
    con: m.con.map((c) => ({ ...c, href: t(c.href), ten: t(c.ten), ...(c.mo_ta ? { mo_ta: t(c.mo_ta) } : {}) })) }));
}

/** Bản dự phòng khi chưa biết năm (khung chờ Suspense): "/{nam}" ở CUỐI đường dẫn bỏ đi (về trang gốc không theo năm:
 *  /nam, /xem-sao-han…); "{nam}" giữa đường dẫn (/nam/{nam}/cuoi-hoi) không có trang gốc → bỏ menu con đó. Không lộ "{nam}". */
export function boNamMenu(ds: MucMenu[]): MucMenu[] {
  const h = (x: string) => x.replace(/\/\{nam\}$/, "") || "/";
  const t = (x: string) => x.replaceAll(" {nam}", "").replaceAll("{nam}", "");
  return ds.map((m) => ({ ...m, href: h(m.href), ten: t(m.ten),
    con: m.con.filter((c) => !h(c.href).includes("{nam}"))
      .map((c) => ({ ...c, href: h(c.href), ten: t(c.ten), ...(c.mo_ta ? { mo_ta: t(c.mo_ta) } : {}) })) }));
}
export const MENU_DAU_DU_PHONG = boNamMenu(MENU_DAU_TRANG);

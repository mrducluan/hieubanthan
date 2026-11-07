// Menu đầu trang mặc định (khi CMS chưa nối / lỗi / chậm / để trống). Phải trùng MENU_DAU_MAC_DINH trong
// cms/src/globals/MenuDauTrang.ts — e2e/so-lieu-ngoai.spec.ts kiểm hai bản khớp nhau.
export type BieuTuong = "lap_lanh" | "trai_tim" | "la_ban" | "sach" | "bao" | "sao" | "lich" | "nguoi";
export type MenuCon = { href: string; ten: string; mo_ta?: string };
export type MucMenu = { href: string; ten: string; bieu_tuong: BieuTuong; di_dong: boolean; con: MenuCon[] };

export const MENU_DAU_TRANG: MucMenu[] = [
  { href: "/ban-than", ten: "Bản thân", bieu_tuong: "lap_lanh", di_dong: true, con: [
    { href: "/than-so", ten: "Thần số học", mo_ta: "Bốn số cốt lõi, Bản đồ con số, năm cá nhân" },
    { href: "/hom-nay", ten: "Hôm nay của bạn", mo_ta: "Ngày cá nhân, âm lịch và một câu tự soi mỗi ngày" },
    { href: "/xem-ngay-tot", ten: "Xem ngày tốt", mo_ta: "Hoàng đạo, giờ tốt, việc nên làm, tìm ngày đẹp" },
  ] },
  { href: "/hop-doi", ten: "Hợp đôi", bieu_tuong: "trai_tim", di_dong: true, con: [
    { href: "/hop-doi", ten: "Hợp đôi thần số", mo_ta: "Hai con số chủ đạo, không chấm điểm" },
    { href: "/tu-vi#hop-tham", ten: "Xem lá số 2 người", mo_ta: "Điểm hợp – khắc theo Tử vi, cách dung hoà" },
    { href: "/hop-doi/cap-so", ten: "Số chủ đạo hợp nhau", mo_ta: "45 cặp số, hợp ở đâu, vấp ở đâu" },
  ] },
  { href: "/huyen-hoc", ten: "Huyền học", bieu_tuong: "la_ban", di_dong: true, con: [
    { href: "/tu-vi", ten: "Tử vi", mo_ta: "Lá số 12 cung, 3 tháng tới, định giờ sinh" },
    { href: "/bat-tu", ten: "Bát tự", mo_ta: "Tứ trụ, ngũ hành, thập thần" },
    { href: "/kinh-dich", ten: "Kinh Dịch", mo_ta: "Gieo 3 đồng xu, quẻ đầu ngày, lời hào" },
    { href: "/phong-thuy", ten: "Phong thuỷ", mo_ta: "La bàn đo hướng, khảo sát nhà, bố trí" },
    // NT-1 (chủ dự án chốt 2026-11-06): Nhân tướng học nằm trong quy hoạch Huyền học; Từ điển nhường chỗ (≤ 12 mục con),
    // vẫn có ở chân trang, hub Huyền học và mọi trang công cụ.
    { href: "/nhan-tuong", ten: "Nhân tướng học", mo_ta: "Tự soi gương 31 câu, bài đọc 8 chương, không cần ảnh" },
    { href: "/xem-tuoi-lam-nha", ten: "Tuổi làm nhà, cưới hỏi", mo_ta: "Kim lâu, Hoang ốc, Tam tai, năm thuận" },
    // TM-1 (chủ dự án duyệt 2026-11-03): 3 công cụ đã có bản theo năm ở menu "Năm" (hướng xấu, xông đất, sao hạn) nhường
    // chỗ cho 3 cụm kiến thức lớn nhất chưa có lối vào menu. Ba công cụ vẫn ở menu Năm, hub Huyền học, chân trang.
    { href: "/tu-vi/sao-o-cung", ten: "Sao ở từng cung Tử vi", mo_ta: "14 chính tinh ở 12 cung: sáng hãm, sao đi cùng" },
    { href: "/kinh-dich/que", ten: "64 quẻ Kinh Dịch", mo_ta: "Ý nghĩa từng quẻ, lời hào, cách hiểu đơn giản" },
    { href: "/bat-tu/menh-theo-nam", ten: "Sinh năm nào mệnh gì", mo_ta: "Can chi, nạp âm, màu hợp, tuổi hợp 1950–2027" },
    { href: "/phong-thuy/huong-hop-tuoi", ten: "Hướng nhà hợp tuổi", mo_ta: "Bốn hướng tốt, xấu theo năm sinh" },
    { href: "/phong-thuy/dau-hieu", ten: "Dấu hiệu trong nhà", mo_ta: "23 điều nên rà: cửa, bếp, WC, cầu thang" },
    { href: "/kien-thuc", ten: "Thư viện kiến thức", mo_ta: "Nghĩa sao, quẻ, con số — tra cứu miễn phí" },
  ] },
  // NAM-1/NAM-2 (2026-10-30): menu lớn theo năm — {nam} thay bằng năm engine chọn (năm tới khi Tết sau còn ≤ 120 ngày,
  // không thì năm âm đang đi) lúc dựng trang → không phải sửa tay mỗi năm (`thayNamMenu`).
  { href: "/nam/{nam}", ten: "Năm {nam}", bieu_tuong: "lich", di_dong: true, con: [
    { href: "/thoi-gian-toi", ten: "Thời gian tới của bạn", mo_ta: "3 tháng, 12 tháng tới theo ngày sinh của bạn" },
    { href: "/nam/{nam}", ten: "Năm {nam} con gì, mệnh gì", mo_ta: "Tết, Tam tai, năm tuổi, 12 con giáp" },
    { href: "/nam/{nam}#theo-tuoi", ten: "Tử vi năm {nam} theo tuổi", mo_ta: "Từng năm sinh, nam mạng và nữ mạng" },
    { href: "/xem-sao-han/{nam}", ten: "Sao hạn năm {nam}", mo_ta: "Sao chiếu theo tuổi, nam và nữ" },
    { href: "/xem-tuoi-lam-nha/{nam}", ten: "Tuổi làm nhà năm {nam}", mo_ta: "Kim lâu, Hoang ốc, Tam tai từng tuổi" },
    { href: "/nam/{nam}/cuoi-hoi", ten: "Cưới năm {nam} tuổi nào", mo_ta: "Kim lâu theo tuổi cô dâu" },
    { href: "/nam/{nam}/sinh-con", ten: "Sinh con năm {nam}", mo_ta: "Tuổi bố mẹ hợp, xung với tuổi con" },
    { href: "/tuoi-xong-dat/{nam}", ten: "Xông đất Tết {nam}", mo_ta: "Tuổi hợp gia chủ, giờ đẹp mùng 1" },
    { href: "/phong-thuy/huong-xau-nam/{nam}", ten: "Hướng xấu năm {nam}", mo_ta: "Thái Tuế, Tam Sát, Ngũ Hoàng" },
    { href: "/lich-am/{nam}", ten: "Lịch âm {nam}", mo_ta: "Tết, tháng nhuận, mùng 1 và rằm" },
    { href: "/doi-lich-am-duong", ten: "Đổi lịch âm dương", mo_ta: "Đổi ngày âm ↔ dương theo lịch Việt Nam" },
    { href: "/nam", ten: "Các năm khác", mo_ta: "Năm âm lịch đang đi và năm tới" },
  ] },
  { href: "/blog", ten: "Blog", bieu_tuong: "bao", di_dong: false, con: [] },
  { href: "/tai-khoan", ten: "Tài khoản", bieu_tuong: "nguoi", di_dong: true, con: [
    { href: "/nap-sao", ten: "Nạp Sao", mo_ta: "Ví Sao, gói nạp" },
  ] },
];

/** TM-1: trang thuộc một mục cha nhưng không có dòng menu con riêng (vd /xem-sao-han, /tuoi-xong-dat — menu con của chúng
 *  nằm ở "Năm" dưới dạng /…/{nam}, nhưng trang gốc là công cụ của hub Huyền học). Chỉ dùng để làm sáng mục cha. */
const THUOC_THEM: Record<string, string[]> = { "/tai-khoan": ["/dang-nhap"], "/huyen-hoc": ["/xem-sao-han", "/tuoi-xong-dat", "/tarot"] };   // TR-1: /tarot chưa vào menu (Huyền học đã 12 mục) → vẫn sáng mục cha
const duongCua = (m: Pick<MucMenu, "href" | "con">) => [m.href, ...m.con.map((c) => c.href), ...(THUOC_THEM[m.href] ?? [])];

/** Đang ở mục này: trùng đường dẫn mục cha hoặc một menu con (vd /tu-vi/... → "Huyền học"); /tai-khoan gồm cả /dang-nhap. */
export function dangOMuc(path: string, m: Pick<MucMenu, "href" | "con">): boolean {
  // Link có "#" (vd /tu-vi#hop-tham dưới Hợp đôi) chỉ là lối tắt tới một khối — không làm mục cha sáng cả trang gốc.
  const ds = duongCua(m)
    .filter((h) => !h.includes("#")).map((h) => h.split("?")[0]!).filter((h) => h && h !== "/");
  return ds.some((k) => path === k || path.startsWith(k + "/"));
}

/** Blog để trống menu con (mặc định, hoặc CMS không đặt) → menu con = chuyên mục có bài, nhiều bài trước.
 *  Biên tập đã tự đặt menu con cho Blog ở CMS thì giữ nguyên. Mô tả: mô tả chuyên mục (cắt ~60 ký tự) hoặc số bài. */
export function ganChuyenMucBlog(menu: MucMenu[], ds: { slug: string; ten: string; mo_ta?: string | null; so: number }[]): MucMenu[] {
  if (!ds.length) return menu;
  const moTa = (c: (typeof ds)[number]) => {
    const t = (c.mo_ta ?? "").replace(/\s+/g, " ").trim();
    const dem = `${c.so} bài viết`;
    return t ? `${t.length > 60 ? `${t.slice(0, 59).replace(/\s+\S*$/, "")}…` : t} · ${dem}` : dem;
  };
  return menu.map((m) => m.href === "/blog" && !m.con.length
    ? { ...m, con: ds.slice(0, 12).map((c) => ({ href: `/blog/chuyen-muc/${encodeURIComponent(c.slug)}`, ten: c.ten, mo_ta: moTa(c) })) }
    : m);
}

/** Chỉ MỘT mục sáng: mục khớp đường dẫn dài nhất (vd /blog là mục cha, /blog/chuyen-muc/x là con của mục khác → mục kia). */
export function mucDangO(path: string, ds: Pick<MucMenu, "href" | "con">[]): number {
  let tot = -1, dai = -1;
  ds.forEach((m, i) => {
    for (const h of duongCua(m)) {
      if (h.includes("#")) continue;
      const k = h.split("?")[0]!;
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

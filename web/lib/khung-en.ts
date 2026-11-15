// EN-ALL giai đoạn 1 việc 1 — chữ + cấu trúc KHUNG trang (menu đầu trang, tab dưới, chân trang) cho bản tiếng Anh.
// Một khung cho hai ngôn ngữ: bản Anh dùng ĐÚNG các component khung của bản Việt (ThanhTren, TabDuoi, ThanhMang,
// KhungChanTrang); file này chỉ cấp CHỮ tiếng Anh và lọc chỉ giữ mục có bản Anh đã mở (`banAnh` của lib/duong-en —
// bảng đường dẫn một nguồn). Mở thêm một trang ở bảng là menu / chân trang tự hiện mục đó, không sửa ở đây.
// Chữ menu bản Việt vẫn từ CMS "Menu đầu trang"; chữ bản Anh ở đây cho tới khi CMS có localization (giai đoạn 10).
// Thuần dữ liệu — dùng được ở máy chủ lẫn trình duyệt.
import { banAnh } from "@/lib/duong-en";
import type { MucMenu } from "@/lib/menu-dau-trang";
import type { CotChanTrang } from "@/lib/menu-chan-trang";

/** Chữ tiếng Anh của từng mục menu đầu trang, theo ĐƯỜNG DẪN VIỆT của mục (đường dẫn có "{nam}" giữ nguyên mẫu).
 *  Khoá mục cha có tiền tố "cha:" (cùng đường dẫn với một menu con vd "/hop-doi" vừa là mục cha vừa là menu con).
 *  e2e/en-khung.spec.ts kiểm mọi mục của MENU_DAU_TRANG đều có chữ ở đây — thêm mục menu bản Việt mà quên bản Anh là test đỏ. */
export const TEN_MENU_EN: Readonly<Record<string, { ten: string; mo_ta?: string }>> = {
  "cha:/ban-than": { ten: "Me" },
  "/than-so": { ten: "Numerology", mo_ta: "Your four core numbers, number map, personal year" },
  "/hom-nay": { ten: "Your day", mo_ta: "Personal day, lunar date and one question to reflect on" },
  "/xem-ngay-tot": { ten: "Auspicious dates", mo_ta: "Lucky hours, what suits the day, find a good date" },
  "cha:/hop-doi": { ten: "Compatibility" },
  "/hop-doi": { ten: "Numerology compatibility", mo_ta: "Two Life Path numbers, no score" },
  "/tu-vi#hop-tham": { ten: "Compare two charts", mo_ta: "Where two charts meet and how to meet halfway" },
  "/hop-doi/cap-so": { ten: "Number pairs", mo_ta: "45 pairs: where they click, where they clash" },
  "cha:/huyen-hoc": { ten: "Chinese Metaphysics" },
  "/tu-vi": { ten: "Zi Wei Dou Shu", mo_ta: "Twelve-palace chart, the next three months" },
  "/bat-tu": { ten: "BaZi", mo_ta: "Four Pillars, Five Elements, Ten Gods" },
  "/kinh-dich": { ten: "I Ching", mo_ta: "Toss three coins, hexagram of the day, line texts" },
  "/phong-thuy": { ten: "Feng Shui", mo_ta: "Compass reading, home check, room layout" },
  "/nhan-tuong": { ten: "Face reading", mo_ta: "A guided look in the mirror, eight-chapter reading, no photo needed" },
  "/tarot": { ten: "Tarot", mo_ta: "Shuffle, draw, seven spreads, 78 sourced cards" },
  "/xem-tuoi-lam-nha": { ten: "Building and wedding years", mo_ta: "Vietnamese customs: Kim Lau, Hoang Oc, Tam Tai" },
  "/tu-vi/sao-o-cung": { ten: "Stars in each palace", mo_ta: "14 main stars across 12 palaces" },
  "/bat-tu/menh-theo-nam": { ten: "Element by birth year", mo_ta: "Stem and branch, Na Yin, colours, 1950–2027" },
  "/phong-thuy/huong-hop-tuoi": { ten: "Best directions by birth year", mo_ta: "Your four good and four weaker directions" },
  "/phong-thuy/dau-hieu": { ten: "Signs in the home", mo_ta: "23 things to check: doors, kitchen, bathroom, stairs" },
  "cha:/nam/{nam}": { ten: "Year {nam}" },
  "/thoi-gian-toi": { ten: "Your year ahead", mo_ta: "The next 3 and 12 months from your birth date" },
  "/nam/{nam}": { ten: "{nam}: animal and element", mo_ta: "Lunar New Year, Tam Tai, your zodiac year" },
  "/nam/{nam}#theo-tuoi": { ten: "{nam} by birth year", mo_ta: "Each birth year, for men and women" },
  "/xem-sao-han/{nam}": { ten: "Yearly star {nam}", mo_ta: "A Vietnamese custom: the star of the year by age" },
  "/xem-tuoi-lam-nha/{nam}": { ten: "Building a house in {nam}", mo_ta: "Vietnamese customs by birth year" },
  "/nam/{nam}/cuoi-hoi": { ten: "Wedding in {nam}", mo_ta: "Kim Lau by the bride's age" },
  "/nam/{nam}/sinh-con": { ten: "Having a baby in {nam}", mo_ta: "Parents' and child's birth years" },
  "/tuoi-xong-dat/{nam}": { ten: "First-footer for Tet {nam}", mo_ta: "A Vietnamese New Year custom" },
  "/phong-thuy/huong-xau-nam/{nam}": { ten: "Afflicted directions {nam}", mo_ta: "Tai Sui, Three Killings, Five Yellow" },
  "/lich-am/{nam}": { ten: "Lunar calendar {nam}", mo_ta: "New Year, leap month, new and full moons" },
  "/doi-lich-am-duong": { ten: "Lunar–solar converter", mo_ta: "Convert dates both ways" },
  "/nam": { ten: "Other years", mo_ta: "The current lunar year and the next" },
  "cha:/blog": { ten: "Blog" },
  "cha:/tai-khoan": { ten: "Account" },
  "/nap-sao": { ten: "Stars", mo_ta: "Your Stars balance" },
};

/** Khoá mẫu của một mục (trước khi thay năm): giữ nguyên đường dẫn. */
const tenMuc = (khoa: string) => TEN_MENU_EN[khoa];

/** Menu đầu trang bản Anh từ menu MẪU bản Việt (MENU_DAU_TRANG, chưa thay "{nam}"): chỉ giữ mục có bản Anh đã mở,
 *  đường dẫn đổi sang URL Anh, chữ từ TEN_MENU_EN.
 *  Mục cha mà trang của chính nó chưa mở: còn đúng một menu con đã mở → đưa menu con đó lên làm mục trên cùng (không
 *  bảng thả xuống một dòng); nhiều hơn → mục cha trỏ tới menu con đầu; không còn gì → bỏ mục cha. */
export function menuEn(mau: readonly MucMenu[]): MucMenu[] {
  const ra: MucMenu[] = [];
  for (const m of mau) {
    const con = m.con.flatMap((c) => {
      const href = banAnh(c.href);
      const t = tenMuc(c.href);
      return href && t && !href.includes("{nam}") ? [{ href, ten: t.ten, ...(t.mo_ta ? { mo_ta: t.mo_ta } : {}) }] : [];
    });
    const hrefCha = banAnh(m.href);
    const tCha = tenMuc(`cha:${m.href}`);
    if (hrefCha && tCha && !hrefCha.includes("{nam}")) { ra.push({ ...m, href: hrefCha, ten: tCha.ten, con }); continue; }
    if (con.length === 1) { ra.push({ ...m, href: con[0]!.href, ten: con[0]!.ten, con: [] }); continue; }
    if (con.length > 1 && tCha) ra.push({ ...m, href: con[0]!.href, ten: tCha.ten, con });
  }
  // Trùng đường dẫn mục trên cùng (hai mục cha cùng rút về một trang) → giữ mục đầu.
  return ra.filter((m, i) => ra.findIndex((x) => x.href === m.href) === i);
}

/** Chân trang bản Anh: bốn cột, mỗi dòng là ĐƯỜNG DẪN VIỆT + chữ Anh; chỉ hiện dòng có bản Anh đã mở, cột trống bị bỏ.
 *  Liệt kê sẵn cả trang chưa mở — mở ở bảng đường dẫn là tự hiện. */
const COT_EN: readonly CotChanTrang[] = [
  { ten: "Explore", ds: [
    ["/than-so", "Numerology"], ["/tarot", "Tarot"], ["/bat-tu", "BaZi (Four Pillars)"], ["/tu-vi", "Zi Wei Dou Shu"],
    ["/kinh-dich", "I Ching"], ["/phong-thuy", "Feng Shui"], ["/nhan-tuong", "Face reading"], ["/hop-doi", "Compatibility"],
    ["/huyen-hoc", "All topics"], ["/hom-nay", "Your day"], ["/thoi-gian-toi", "Your year ahead"],
    ["/xem-ngay-tot", "Auspicious dates"], ["/doi-lich-am-duong", "Lunar–solar converter"],
  ] },
  { ten: "Learn", ds: [
    ["/kien-thuc", "Library"], ["/than-so/y-nghia-so", "Life Path numbers"], ["/tarot/la-bai", "The 78 tarot cards"],
    ["/kinh-dich/que", "The 64 hexagrams"], ["/tu-vi/chinh-tinh", "The 14 main stars"], ["/tu-dien", "Glossary"], ["/blog", "Blog"],
  ] },
  { ten: "About us", ds: [
    ["/gioi-thieu", "About and method"], ["/tac-gia", "Editorial team"], ["/lien-he", "Contact"],
  ] },
  { ten: "Legal", ds: [
    ["/chinh-sach-rieng-tu", "Privacy policy"], ["/dieu-khoan", "Terms of use"], ["/mien-tru-trach-nhiem", "Disclaimer"],
  ] },
];

export function cotChanTrangEn(): CotChanTrang[] {
  return COT_EN.map((c) => ({ ten: c.ten, ds: c.ds.flatMap(([vi, ten]) => { const en = banAnh(vi); return en ? [[en, ten] as const] : []; }) }))
    .filter((c) => c.ds.length);
}

/** Chữ cố định của khung (thanh trên, menu điện thoại, chân trang, hộp cookie). Bản Việt giữ ĐÚNG chữ cũ từng ký tự
 *  (chụp HTML trang Việt trước / sau — scripts/chup-html.mjs — bắt mọi lệch). */
export const CHU_KHUNG = {
  vi: {
    ten_site: "Hiểu Bản Thân", ve_trang_chu: "Hiểu Bản Thân — trang chủ", dieu_huong: "Điều hướng chính", mo_menu: "Mở menu",
    mo_menu_con: (ten: string) => `Mở menu ${ten}`, menu: "Menu", menu_day_du: "Menu đầy đủ", cac_muc: (ten: string) => `Các mục ${ten}`,
    trang: " trang", lien_ket_cuoi: "Liên kết cuối trang", mang_xa_hoi: "Mạng xã hội", tren: (ten: string) => `Hiểu Bản Thân trên ${ten}`,
    ma_so: "Mã số", bo_cong_thuong: "ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG", ban_quyen: (nam: number) => `© ${nam} Hiểu Bản Thân (hieuban.com). Bảo lưu mọi quyền.`,
    tuy_chon_cookie: "Tuỳ chọn cookie", doi_ngon_ngu: "",
    cookie_hoi: "Đồng ý cookie đo lường",
    cookie_loi: "Cho phép chúng tôi dùng Google Analytics (cookie đo lường) để biết trang nào hữu ích? Không gửi họ tên, ngày giờ sinh; không quảng cáo. Bạn đổi ý bất cứ lúc nào ở chân trang.",
    cookie_chi_tiet: "Chi tiết", cookie_tu_choi: "Từ chối", cookie_dong_y: "Đồng ý",
  },
  en: {
    ten_site: "Hieuban", ve_trang_chu: "Hieuban — home", dieu_huong: "Main navigation", mo_menu: "Open menu",
    mo_menu_con: (ten: string) => `Open the ${ten} menu`, menu: "Menu", menu_day_du: "Full menu", cac_muc: (ten: string) => `${ten} sections`,
    trang: " pages", lien_ket_cuoi: "Footer links", mang_xa_hoi: "Social media", tren: (ten: string) => `Hieuban on ${ten}`,
    ma_so: "Registration no.", bo_cong_thuong: "REGISTERED WITH VIETNAM'S MINISTRY OF INDUSTRY AND TRADE",
    ban_quyen: (nam: number) => `© ${nam} Hieuban (hieuban.com). All rights reserved.`,
    tuy_chon_cookie: "Cookie settings", doi_ngon_ngu: "Tiếng Việt",
    cookie_hoi: "Consent to analytics cookies",
    cookie_loi: "May we use Google Analytics (analytics cookies) to learn which pages help? We never send your name or birth date, and we show no ads. You can change your mind at any time from the footer.",
    cookie_chi_tiet: "Details", cookie_tu_choi: "Decline", cookie_dong_y: "Accept",
  },
} as const;

/** Chữ chân trang bản Anh (bản Việt: lib/menu-chan-trang.ts + CMS "Điều hướng chân trang"). */
export const GIOI_THIEU_CHAN_TRANG_EN = "Numerology, tarot and the Chinese metaphysical traditions in one profile. Transparent calculations and named sources — for reflection, not for verdicts.";
export const CAM_KET_CHAN_TRANG_EN = [
  { chu: "Your profile stays on your device by default", bieu_tuong: "khien" },
  { chu: "Charts are calculated on our own system; your name and birth date are never passed to third parties", bieu_tuong: "may_chu" },
  { chu: "We do not sell data and we do not run targeted ads", bieu_tuong: "lap_lanh" },
] as const;
export const MIEN_TRU_CHAN_TRANG_EN = "Written from classical texts and named reference books, for reflection and self-understanding — not a prediction. Nothing here replaces professional medical, psychological, legal or financial advice. Prepared by the Hieuban editorial team; editor-in-chief Duc Luan.";

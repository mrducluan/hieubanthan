// ND-7 — bảng chữ các cụm trang con của công cụ (trang theo ngày / tháng / năm / năm sinh) — một bảng cho CẢ CỤM, sửa ở
// CMS → Mẫu cụm trang → tab "Chữ trên trang"; muốn riêng một URL thì tạo ghi đè. {bien} = giá trị của từng trang.
// Tiêu đề trình duyệt + mô tả SEO của các trang này vẫn dựng trong code (đồng bộ với sitemap/rà SEO).
import type { BangChu } from "@/lib/chu-trang";

const D = "Đầu trang", C = "Cuối trang";
const cuoiLich: BangChu = {
  "cuoi.chu": { nhom: C, nhan: "Đoạn cuối trang (trước link)", toi_da: 300,
    mac_dinh: "Hoàng lịch tính theo giờ Việt Nam, bảng nghi/kỵ theo sách Hiệp kỷ biện phương thư, kèm ngày kiêng dân gian Việt. Cách đọc, giờ hoàng đạo, ngày Tam nương và câu hỏi thường gặp:" },
  "cuoi.link": { nhom: C, nhan: "Chữ link về trang chính", mac_dinh: "Xem ngày tốt hôm nay", toi_da: 60 },
};

export const CHU_NGAY = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Hoàng lịch", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({ngay} = dd/mm/yyyy)", mac_dinh: "Ngày {ngay} tốt hay xấu?", toi_da: 120 },
  ...cuoiLich,
} as const satisfies BangChu;

export const CHU_THANG = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ trên tiêu đề", mac_dinh: "Xem ngày tốt", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({thang}, {nam})", mac_dinh: "Lịch ngày tốt tháng {thang}/{nam}", toi_da: 120 },
  "dau.mo_ta": { nhom: D, nhan: "Lời dẫn", mac_dinh: "Bấm vào một ngày để xem giờ hoàng đạo, việc nên làm và nên kiêng.", toi_da: 300 },
  "dep.tieu_de": { nhom: "Ngày đẹp trong tháng", nhan: "Tiêu đề mục", mac_dinh: "Ngày hoàng đạo có trực tốt trong tháng", toi_da: 100 },
  "dep.mo_ta": { nhom: "Ngày đẹp trong tháng", nhan: "Giải thích dưới tiêu đề", toi_da: 400,
    mac_dinh: "Hoàng đạo, trực Thành/Khai/Định/Mãn/Trừ, không rơi vào Tam nương, Nguyệt kỵ, Dương công. Việc cụ thể (cưới hỏi, khai trương…) nên bấm vào ngày để xem mục nên/kiêng." },
  ...cuoiLich,
} as const satisfies BangChu;

export const CHU_LAM_NHA_CON = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi} tuổi, {can_chi_nam} năm làm)", mac_dinh: "Tuổi {can_chi} · năm {can_chi_nam}", en: "Born {can_chi} · year {can_chi_nam}", toi_da: 80 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam_sinh}, {nam})", mac_dinh: "Tuổi {nam_sinh} làm nhà năm {nam} được không?", en: "Born in {nam_sinh}: can you build a house in {nam}?", toi_da: 120 },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Tính cho chính xác theo ngày sinh của bạn:", en: "Work it out from your full date of birth:", toi_da: 120 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ xem tuổi làm nhà", en: "the house-building age tool", toi_da: 60 },
  "cuoi.nam_sau": { nhom: C, nhan: "Link năm sau ({nam_sau})", mac_dinh: "năm {nam_sau}", en: "{nam_sau}", toi_da: 40 },
} as const satisfies BangChu;

export const CHU_XONG_DAT_CON = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi_nam} Tết, {can_chi} gia chủ)", mac_dinh: "Tết {can_chi_nam} · gia chủ {can_chi}", en: "Lunar New Year {can_chi_nam} · host born {can_chi}", toi_da: 80 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam}, {nam_sinh})", mac_dinh: "Tuổi xông đất năm {nam} cho gia chủ sinh năm {nam_sinh}", en: "First-footer for Lunar New Year {nam}: host born in {nam_sinh}", toi_da: 120 },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Tính theo ngày sinh đầy đủ của gia chủ:", en: "Work it out from the host's full date of birth:", toi_da: 120 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ xem tuổi xông đất", en: "the first-footer tool", toi_da: 60 },
  // SEO-M: link chéo cùng năm / cùng tuổi.
  "xem.mung_mot": { nhom: C, nhan: "Link ngày mùng 1 Tết ({nam})", mac_dinh: "Mùng 1 Tết {nam} tốt xấu thế nào", en: "Is the first day of Lunar New Year {nam} a good day?", toi_da: 60 },
  "xem.han_nam": { nhom: C, nhan: "Link hướng xấu năm ({nam})", mac_dinh: "Hướng xấu năm {nam}", en: "Annual afflictions {nam}", toi_da: 60 },
  "xem.lam_nha": { nhom: C, nhan: "Link tuổi làm nhà ({nam_sinh}, {nam})", mac_dinh: "Tuổi {nam_sinh} làm nhà năm {nam}", en: "Born {nam_sinh}: building a house in {nam}", toi_da: 60 },
  "xem.bang_nam": { nhom: C, nhan: "Link bảng xông đất cả năm ({nam})", mac_dinh: "Bảng xông đất Tết {nam} mọi tuổi", en: "First-footer table for Lunar New Year {nam}", toi_da: 60 },
} as const satisfies BangChu;

export const CHU_HAN_NAM_CON = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi} = can chi năm)", mac_dinh: "Năm {can_chi}", en: "Year {can_chi}", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Hướng xấu năm {nam}: nên tránh động thổ hướng nào?", en: "Annual afflictions {nam}: which directions to leave undisturbed?", toi_da: 120 },
  "cuoi.lam_nha": { nhom: C, nhan: "Link xem tuổi làm nhà ({nam})", mac_dinh: "Xem tuổi làm nhà năm {nam}", en: "House-building age for {nam}", toi_da: 60 },
  // SEO-M: link chéo cùng năm.
  "cuoi.bang_lam_nha": { nhom: C, nhan: "Link bảng tuổi làm nhà ({nam})", mac_dinh: "Tuổi làm nhà năm {nam}", en: "House-building ages {nam}", toi_da: 60 },
  "cuoi.bang_xong_dat": { nhom: C, nhan: "Link bảng xông đất ({nam})", mac_dinh: "Tuổi xông đất Tết {nam}", en: "First-footer ages for Lunar New Year {nam}", toi_da: 60 },
  "cuoi.lich_am": { nhom: C, nhan: "Link lịch âm năm ({nam})", mac_dinh: "Lịch âm năm {nam}", en: "Lunar calendar {nam}", toi_da: 60 },
} as const satisfies BangChu;

// SEO-L1 — trang trụ theo năm (bảng 46 tuổi 1960–2005).
export const CHU_LAM_NHA_NAM = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi} = can chi năm)", mac_dinh: "Năm {can_chi}", en: "Year {can_chi}", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Tuổi nào làm nhà, cưới hỏi năm {nam}?", en: "Which birth years can build a house or marry in {nam}?", toi_da: 120 },
  "bang.tieu_de": { nhom: "Bảng", nhan: "Tiêu đề bảng", mac_dinh: "Kim lâu, Hoang ốc, Tam tai năm {nam} theo năm sinh", en: "Kim Lau, Hoang Oc and Tam Tai in {nam} by birth year", toi_da: 120 },
  "bang.mo_ta": { nhom: "Bảng", nhan: "Giải thích dưới bảng", toi_da: 300,
    mac_dinh: "Bấm vào năm sinh để xem chi tiết: năm thuận gần nhất, cách dân gian mượn tuổi, hướng nên giữ yên trong năm.", en: "Choose a birth year for the details: the nearest clear year, how families borrow an age, and the directions to leave undisturbed this year." },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Sinh tháng 1, đầu tháng 2 hoặc muốn tính theo ngày sinh đầy đủ:", en: "Born in January or early February, or want it worked out from your full date of birth?", toi_da: 160 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ xem tuổi làm nhà", en: "the house-building age tool", toi_da: 60 },
} as const satisfies BangChu;

export const CHU_XONG_DAT_NAM = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi} = can chi năm)", mac_dinh: "Tết {can_chi}", en: "Lunar New Year {can_chi}", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Tuổi nào xông đất Tết {nam} hợp gia chủ?", en: "Who should first-foot your home at Lunar New Year {nam}?", toi_da: 120 },
  "bang.tieu_de": { nhom: "Bảng", nhan: "Tiêu đề bảng", mac_dinh: "Tuổi hợp xông đất theo năm sinh gia chủ", en: "Suitable first-footers by the host's birth year", toi_da: 120 },
  "bang.mo_ta": { nhom: "Bảng", nhan: "Giải thích dưới bảng", toi_da: 300,
    mac_dinh: "Mỗi dòng ghi 3 tuổi hợp nhất. Bấm năm sinh gia chủ để xem lý do, tuổi nên tránh và giờ đẹp mùng 1.", en: "Each row lists the three best-suited birth years. Choose the host's birth year for the reasons, the ages to avoid and the good hours on the first day." },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Tính theo ngày sinh đầy đủ của gia chủ:", en: "Work it out from the host's full date of birth:", toi_da: 160 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ xem tuổi xông đất", en: "the first-footer tool", toi_da: 60 },
} as const satisfies BangChu;

// MT-ĐS B3 — bảng sao hạn theo năm (một trang cho mọi tuổi, hai giới).
export const CHU_SAO_HAN_NAM = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi} = can chi năm)", mac_dinh: "Năm {can_chi} · tục lệ theo tuổi", en: "Year {can_chi} · a custom by age", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Sao hạn năm {nam} theo tuổi — nam và nữ", en: "Yearly stars {nam} by birth year, for men and women", toi_da: 120 },
  "bang.tieu_de": { nhom: "Bảng", nhan: "Tiêu đề bảng", mac_dinh: "Sao hạn từng tuổi sinh 1960–2005", en: "Yearly star for each birth year 1960–2005", toi_da: 120 },
  "bang.mo_ta": { nhom: "Bảng", nhan: "Giải thích dưới bảng", toi_da: 300,
    mac_dinh: "Tuổi mụ tính theo năm âm lịch. Bấm tên sao để đọc lời đời thường và việc nên làm. Không có hạn nào định sẵn chuyện gì.", en: "Lunar age is counted by the lunar year. Choose a star to read it in plain words with things worth doing. No star decides in advance what will happen." },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Tính theo ngày sinh đầy đủ (sinh trước Tết tuổi thuộc năm trước):", en: "Work it out from your full date of birth (born before Lunar New Year counts as the previous year):", toi_da: 160 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ xem sao hạn", en: "the yearly star tool", toi_da: 60 },
} as const satisfies BangChu;

// SEO-L2 — ngày tốt theo việc trong tháng.
export const CHU_VIEC_THANG = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({thang_am} = khoảng âm lịch)", mac_dinh: "Hoàng lịch · {thang_am}", toi_da: 120 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({viec}, {thang}, {nam})", mac_dinh: "Ngày tốt {viec} tháng {thang} năm {nam}", toi_da: 120 },
  "ds.tieu_de": { nhom: "Danh sách", nhan: "Tiêu đề danh sách", mac_dinh: "Các ngày tốt trong tháng", toi_da: 100 },
  "viec_khac.tieu_de": { nhom: "Việc khác", nhan: "Tiêu đề", mac_dinh: "Ngày tốt cho việc khác tháng {thang}/{nam}", toi_da: 100 },
  ...cuoiLich,
} as const satisfies BangChu;

// SEO-L5 — lịch âm cả năm.
export const CHU_LICH_AM_NAM = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi})", mac_dinh: "Năm {can_chi}", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Lịch âm năm {nam}: Tết, tháng nhuận, các tháng âm lịch", toi_da: 120 },
  "bang.tieu_de": { nhom: "Bảng", nhan: "Tiêu đề bảng", mac_dinh: "Các tháng âm lịch năm {nam}", toi_da: 100 },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Đổi một ngày cụ thể giữa âm lịch và dương lịch:", toi_da: 160 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ đổi lịch âm dương", toi_da: 60 },
} as const satisfies BangChu;

// NAM-1 (2026-10-30) — trang trụ "Năm {năm}" + hai trang con. Biến: {nam}, {can_chi}.
export const CHU_NAM = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi})", mac_dinh: "Năm {can_chi} · lịch, tuổi, tập quán", en: "Year {can_chi} · calendar, age, custom", toi_da: 80 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam}, {can_chi})", mac_dinh: "Năm {nam} {can_chi}: năm con gì, mệnh gì, tuổi nào cần lưu ý", en: "Lunar year {nam} ({can_chi}): zodiac animal, element and signs to watch", toi_da: 120 },
  "ca_nhan.tieu_de": { nhom: "Của riêng bạn", nhan: "Tiêu đề khối mời xem riêng", mac_dinh: "Năm {nam} của riêng bạn", en: "Your own {nam}", toi_da: 80 },
  "ca_nhan.mo_ta": { nhom: "Của riêng bạn", nhan: "Lời mời", toi_da: 240,
    mac_dinh: "Nhập ngày sinh để xem 3 tháng tới, 12 tháng tới và năm {nam} theo thần số, Tử vi, Bát tự của chính bạn — không phải lời chung theo con giáp.", en: "Enter your date of birth to read the months ahead and {nam} from your own numerology, Zi Wei Dou Shu and BaZi, not a general reading by zodiac sign." },
  "ca_nhan.nut": { nhom: "Của riêng bạn", nhan: "Chữ nút", mac_dinh: "Xem năm {nam} của tôi", en: "Read my {nam}", toi_da: 40 },
  "con_giap.tieu_de": { nhom: "Bảng", nhan: "Tiêu đề bảng 12 con giáp", mac_dinh: "12 con giáp trong năm {can_chi}", en: "The 12 zodiac signs in the {can_chi} year", toi_da: 100 },
  "con_giap.mo_ta": { nhom: "Bảng", nhan: "Giải thích dưới tiêu đề bảng", toi_da: 300,
    mac_dinh: "Quan hệ địa chi của từng con giáp với năm và năm Tam tai — tập quán dân gian để tham khảo, giống nhau cho mọi người cùng con giáp, không định sẵn chuyện tốt xấu.", en: "How each sign's earthly branch relates to the year, and the Tam Tai years: a folk custom to consult, the same for everyone of that sign, not a verdict on what will happen." },
  "tra.tieu_de": { nhom: "Tra theo tuổi", nhan: "Tiêu đề khối tra cứu", mac_dinh: "Tra năm {nam} theo tuổi", en: "Look up {nam} by birth year", toi_da: 80 },
  "moc.tieu_de": { nhom: "Mốc", nhan: "Tiêu đề mốc lễ", mac_dinh: "Các mốc trong năm âm lịch {nam}", en: "Key dates of lunar year {nam}", toi_da: 80 },
} as const satisfies BangChu;

export const CHU_NAM_SINH_CON = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi})", mac_dinh: "Năm {can_chi} · tập quán theo tuổi", en: "Year {can_chi} · custom by age", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Sinh con năm {nam} hợp tuổi bố mẹ nào?", en: "A baby born in {nam}: which parents' signs go well?", toi_da: 120 },
  "bang.tieu_de": { nhom: "Bảng", nhan: "Tiêu đề bảng", mac_dinh: "Tuổi bố mẹ với con sinh năm {nam}", en: "Parents' birth years and a child born in {nam}", toi_da: 100 },
  "bang.mo_ta": { nhom: "Bảng", nhan: "Giải thích dưới tiêu đề bảng", toi_da: 300,
    mac_dinh: "Nhóm theo quan hệ địa chi giữa tuổi bố/mẹ và tuổi con; cột mệnh ghi quan hệ nạp âm để đọc thêm. Không cộng điểm, không xếp hạng.", en: "Grouped by how the parent's earthly branch relates to the child's; the element column shows the Na Yin relationship for further reading. No scores, no ranking." },
} as const satisfies BangChu;

export const CHU_NAM_CUOI_HOI = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi})", mac_dinh: "Năm {can_chi} · Kim lâu theo tuổi cô dâu", en: "Year {can_chi} · Kim Lau by the bride's age", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Cưới năm {nam}: tuổi nào không phạm Kim lâu?", en: "Marrying in {nam}: which brides' ages are clear of Kim Lau?", toi_da: 120 },
  "bang.tieu_de": { nhom: "Bảng", nhan: "Tiêu đề bảng", mac_dinh: "Tuổi cô dâu cưới năm {nam}", en: "Bride's birth year for a wedding in {nam}", toi_da: 100 },
  "ngay.tieu_de": { nhom: "Ngày cưới", nhan: "Tiêu đề khối ngày tốt", mac_dinh: "Chọn ngày cưới trong năm {nam}", en: "Choosing a wedding date in {nam}", toi_da: 80 },
} as const satisfies BangChu;

// NAM-3 — "Tử vi năm {nam} tuổi {can_chi} {nam_sinh}". Biến: {nam}, {can_chi_nam}, {can_chi}, {nam_sinh}.
export const CHU_NAM_TUOI = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi_nam})", mac_dinh: "Năm {can_chi_nam} · đọc theo năm sinh", en: "Year {can_chi_nam} · read by birth year", toi_da: 80 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam}, {can_chi}, {nam_sinh})", mac_dinh: "Tử vi năm {nam} tuổi {can_chi} {nam_sinh} — nam mạng và nữ mạng", en: "The {nam} year for people born in {nam_sinh} ({can_chi}), men and women", toi_da: 120 },
  "diem_nhan.tieu_de": { nhom: "Điểm nhấn", nhan: "Tiêu đề khối điểm nhấn", mac_dinh: "Điểm nhấn năm {nam} với tuổi {can_chi}", en: "Highlights of {nam} for the {can_chi} sign", toi_da: 100 },
  "sao.tieu_de": { nhom: "Sao năm", nhan: "Tiêu đề khối sao", mac_dinh: "Sao năm {nam} theo tục: nam mạng và nữ mạng", en: "Yearly star for {nam} by custom: men and women", toi_da: 100 },
  "ca_nhan.tieu_de": { nhom: "Của riêng bạn", nhan: "Tiêu đề khối mời", mac_dinh: "Năm {nam} của riêng bạn — từ ngày giờ sinh, không chỉ theo con giáp", en: "Your own {nam}, from your date and time of birth, not just your sign", toi_da: 100 },
  "ca_nhan.mo_ta": { nhom: "Của riêng bạn", nhan: "Lời mời", toi_da: 260,
    mac_dinh: "Nhập ngày giờ sinh để xem năm {nam} của riêng bạn: 3 tháng tới, 12 tháng tới, Lộc – Kỵ của năm rơi vào mảng đời nào trên lá số.", en: "Set up your own chart to see where the year's prosperity and obstacle stars land among the areas of your life." },
  "ca_nhan.nut": { nhom: "Của riêng bạn", nhan: "Chữ nút", mac_dinh: "Xem năm {nam} của tôi", en: "Read my {nam}", toi_da: 40 },
} as const satisfies BangChu;

// Ý3 — "Sinh ở {ten}: lập lá số thế nào" (cụm trang người Việt sinh ở nước ngoài). Biến: {ten}, {nuoc}, {nam}.
export const CHU_SINH_NN = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({ten} = tên nước)", mac_dinh: "Người Việt sinh ở {ten}", en: "Vietnamese born in {ten}", toi_da: 80 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({ten})", mac_dinh: "Sinh ở {ten}: lập lá số Tử vi, Bát tự thế nào cho đúng giờ?", en: "Born in {ten}: which time to use for a Zi Wei Dou Shu or BaZi chart?", toi_da: 120 },
  "bang.tieu_de": { nhom: "Bảng thành phố", nhan: "Tiêu đề bảng múi giờ từng thành phố", mac_dinh: "Múi giờ và giờ mùa hè từng thành phố năm {nam}", en: "Time zone and daylight saving time by city, {nam}", toi_da: 120 },
  "lich_su.tieu_de": { nhom: "Lịch sử giờ mùa hè", nhan: "Tiêu đề bảng lịch sử", mac_dinh: "Năm bạn sinh có giờ mùa hè không?", en: "Was daylight saving time in force the year you were born?", toi_da: 100 },
  "lich_am.tieu_de": { nhom: "Lịch âm", nhan: "Tiêu đề khối lịch âm Việt – Trung", mac_dinh: "Ngày âm trong sổ gia đình theo lịch Việt hay lịch Trung Quốc?", en: "Is the lunar date in your family records Vietnamese or Chinese?", toi_da: 120 },
  "huong_dan.tieu_de": { nhom: "Hướng dẫn", nhan: "Tiêu đề khối hướng dẫn nhập", mac_dinh: "Nhập hồ sơ cho người sinh ở {ten}", en: "Entering a profile for someone born in {ten}", toi_da: 100 },
  "cuoi.nut": { nhom: C, nhan: "Chữ nút lập lá số", mac_dinh: "Lập lá số với nơi sinh {ten}", en: "Set up a chart born in {ten}", toi_da: 60 },
} as const satisfies BangChu;

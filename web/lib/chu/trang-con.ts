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
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi} tuổi, {can_chi_nam} năm làm)", mac_dinh: "Tuổi {can_chi} · năm {can_chi_nam}", toi_da: 80 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam_sinh}, {nam})", mac_dinh: "Tuổi {nam_sinh} làm nhà năm {nam} được không?", toi_da: 120 },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Tính cho chính xác theo ngày sinh của bạn:", toi_da: 120 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ xem tuổi làm nhà", toi_da: 60 },
  "cuoi.nam_sau": { nhom: C, nhan: "Link năm sau ({nam_sau})", mac_dinh: "năm {nam_sau}", toi_da: 40 },
} as const satisfies BangChu;

export const CHU_XONG_DAT_CON = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi_nam} Tết, {can_chi} gia chủ)", mac_dinh: "Tết {can_chi_nam} · gia chủ {can_chi}", toi_da: 80 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam}, {nam_sinh})", mac_dinh: "Tuổi xông đất năm {nam} cho gia chủ sinh năm {nam_sinh}", toi_da: 120 },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Tính theo ngày sinh đầy đủ của gia chủ:", toi_da: 120 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ xem tuổi xông đất", toi_da: 60 },
  // SEO-M: link chéo cùng năm / cùng tuổi.
  "xem.mung_mot": { nhom: C, nhan: "Link ngày mùng 1 Tết ({nam})", mac_dinh: "Mùng 1 Tết {nam} tốt xấu thế nào", toi_da: 60 },
  "xem.han_nam": { nhom: C, nhan: "Link hướng xấu năm ({nam})", mac_dinh: "Hướng xấu năm {nam}", toi_da: 60 },
  "xem.lam_nha": { nhom: C, nhan: "Link tuổi làm nhà ({nam_sinh}, {nam})", mac_dinh: "Tuổi {nam_sinh} làm nhà năm {nam}", toi_da: 60 },
  "xem.bang_nam": { nhom: C, nhan: "Link bảng xông đất cả năm ({nam})", mac_dinh: "Bảng xông đất Tết {nam} mọi tuổi", toi_da: 60 },
} as const satisfies BangChu;

export const CHU_HAN_NAM_CON = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi} = can chi năm)", mac_dinh: "Năm {can_chi}", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Hướng xấu năm {nam}", toi_da: 120 },
  "cuoi.lam_nha": { nhom: C, nhan: "Link xem tuổi làm nhà ({nam})", mac_dinh: "Xem tuổi làm nhà năm {nam}", toi_da: 60 },
  // SEO-M: link chéo cùng năm.
  "cuoi.bang_lam_nha": { nhom: C, nhan: "Link bảng tuổi làm nhà ({nam})", mac_dinh: "Tuổi làm nhà năm {nam}", toi_da: 60 },
  "cuoi.bang_xong_dat": { nhom: C, nhan: "Link bảng xông đất ({nam})", mac_dinh: "Tuổi xông đất Tết {nam}", toi_da: 60 },
  "cuoi.lich_am": { nhom: C, nhan: "Link lịch âm năm ({nam})", mac_dinh: "Lịch âm năm {nam}", toi_da: 60 },
} as const satisfies BangChu;

// SEO-L1 — trang trụ theo năm (bảng 46 tuổi 1960–2005).
export const CHU_LAM_NHA_NAM = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi} = can chi năm)", mac_dinh: "Năm {can_chi}", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Tuổi nào làm nhà, cưới hỏi năm {nam}?", toi_da: 120 },
  "bang.tieu_de": { nhom: "Bảng", nhan: "Tiêu đề bảng", mac_dinh: "Kim lâu, Hoang ốc, Tam tai năm {nam} theo năm sinh", toi_da: 120 },
  "bang.mo_ta": { nhom: "Bảng", nhan: "Giải thích dưới bảng", toi_da: 300,
    mac_dinh: "Bấm vào năm sinh để xem chi tiết: năm thuận gần nhất, cách dân gian mượn tuổi, hướng nên giữ yên trong năm." },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Sinh tháng 1, đầu tháng 2 hoặc muốn tính theo ngày sinh đầy đủ:", toi_da: 160 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ xem tuổi làm nhà", toi_da: 60 },
} as const satisfies BangChu;

export const CHU_XONG_DAT_NAM = {
  "dau.nhan_tren": { nhom: D, nhan: "Dòng nhỏ ({can_chi} = can chi năm)", mac_dinh: "Tết {can_chi}", toi_da: 60 },
  "dau.tieu_de": { nhom: D, nhan: "Tiêu đề H1 ({nam})", mac_dinh: "Tuổi xông đất Tết {nam} hợp với gia chủ", toi_da: 120 },
  "bang.tieu_de": { nhom: "Bảng", nhan: "Tiêu đề bảng", mac_dinh: "Tuổi hợp xông đất theo năm sinh gia chủ", toi_da: 120 },
  "bang.mo_ta": { nhom: "Bảng", nhan: "Giải thích dưới bảng", toi_da: 300,
    mac_dinh: "Mỗi dòng ghi 3 tuổi hợp nhất. Bấm năm sinh gia chủ để xem lý do, tuổi nên tránh và giờ đẹp mùng 1." },
  "cuoi.chu": { nhom: C, nhan: "Chữ trước link công cụ", mac_dinh: "Tính theo ngày sinh đầy đủ của gia chủ:", toi_da: 160 },
  "cuoi.link": { nhom: C, nhan: "Chữ link công cụ", mac_dinh: "công cụ xem tuổi xông đất", toi_da: 60 },
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

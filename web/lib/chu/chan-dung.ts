// EN-ALL GĐ 8 — chữ cố định của hai công cụ ghép nhiều môn: Chân dung tổng hợp (app/chan-dung/ChanDung.tsx +
// components/chan-dung/MaTranBaCach.tsx) và Thời gian tới (app/thoi-gian-toi/ThoiGianToi.tsx). /en/portrait, /en/year-ahead
// là rewrite của trang Việt — CÙNG component. `mac_dinh` = ĐÚNG chữ bản Việt cũ từng ký tự; `en` viết từ nghĩa. Tên mảng,
// tên môn, lời các chương do engine trả theo ngôn ngữ. Đoạn có <b> / link ở bản Việt: `en` dùng `*…*` cho chữ nhấn.
import type { BangChu, MucChu } from "@/lib/chu-trang";

const m = (nhom: string, mac_dinh: string, en: string, toi_da = 700): MucChu => ({ nhom, nhan: mac_dinh.slice(0, 80), mac_dinh, en, toi_da });

const C = "Chân dung", T = "Ma trận", G = "Thời gian tới";

export const CHU_CHAN_DUNG_UI = {
  "cd.dang_ghep_ba": m(C, "Đang ghép ba cách nhìn: Tử vi, Bát tự và *{so} nét* bạn đã tự quan sát ở Nhân tướng học.", "Combining three views: Zi Wei Dou Shu, BaZi and the *{so} features* you observed in face reading."),
  "cd.dang_ghep_hai": m(C, "Đang ghép hai lá số.", "Combining your two charts."),
  "cd.lam_khao_sat": m(C, "Làm khảo sát gương mặt", "Do the face reading survey"),
  "cd.lam_khao_sat_sau": m(C, "(5 phút, không cần ảnh) để có cách nhìn thứ ba.", "(5 minutes, no photo needed) to add a third view."),
  "cd.ten": m(C, "chân dung tổng hợp", "combined portrait"),
  "cd.cuoi_hoi": m(C, "Mảng nào ba cách cùng thấy mà bạn thấy đúng với mình nhất?", "Of the areas the three views agree on, which feels most true to you?"),

  "mt.eyebrow": m(T, "Ba cách nhìn, một con người", "Three views, one person"),
  "mt.tieu_de": m(T, "Mảng nào các cách xem cùng thấy?", "Which areas do the views agree on?"),
  "mt.mo_ta": m(T, "Mức của từng cách lấy từ chính bài đọc của cách đó — không cộng điểm, không chấm bạn. Bấm một dòng để tới chương tương ứng.", "Each level comes from that system's own reading — nothing is added up and you are not scored. Tap a row to jump to its chapter."),
  "mt.mang": m(T, "Mảng", "Area"),
  "mt.ket": m(T, "Kết", "Result"),
  "mt.cung_thay": m(T, "{so} cách cùng thấy", "{so} views agree"),
  "mt.khac": m(T, "nhìn khác nhau", "different sides"),
  "mt.thieu": m(T, "chưa đủ cách xem", "not enough views yet"),
  "mt.thieu_nt": m(T, "Cột Nhân tướng còn trống —", "The face reading column is still empty —"),
  "mt.thieu_nt_link": m(T, "làm khảo sát gương mặt", "do the face reading survey"),
  "mt.thieu_nt_sau": m(T, "(5 phút, không cần ảnh) rồi quay lại để có cách nhìn thứ ba.", "(5 minutes, no photo needed), then come back for a third view."),
  "muc.thuan": m(T, "Thuận lợi", "Favourable"), "muc.can_bang": m(T, "Cân bằng", "Balanced"), "muc.can_chu_dong": m(T, "Cần lưu ý", "Needs care"),
} as const satisfies BangChu;

export const CHU_THOI_GIAN_UI = {
  "tg.nut_nhap": m(G, "Xem thời gian tới của tôi", "Show my year ahead"),
  "tg.chon_nam": m(G, "Chọn năm", "Choose the year"),
  "tg.xem_cho": m(G, "Xem cho {ten} ·", "Reading for {ten} ·"),
  "tg.nam_dang_di": m(G, "Năm âm lịch đang đi ({nam})", "Current lunar year ({nam})"),
  "tg.nam_toi": m(G, "Năm tới ({nam})", "Next year ({nam})"),
  "tg.bo_sung": m(G, "Đang đọc theo ngày sinh: thần số, con giáp, ngày đẹp{pt} và tập quán theo tuổi. Thêm *giờ sinh{gt}, nơi sinh* để mỗi tháng có thêm lá số Tử vi và Bát tự của riêng bạn{hm} — tháng nào nhiều cách cùng thuận, tháng nào nên đi chậm.",
    "Reading from your birth date: numerology, zodiac sign, good days{pt} and the customs tied to your age. Add your *birth time{gt} and place of birth* so each month also gets your own Zi Wei Dou Shu and BaZi reading{hm} — which months several views agree are favourable, and which to take slowly."),
  "tg.bo_sung_pt": m(G, ", góc nhà hợp bạn (phong thuỷ)", ", the corner of your home that suits you (feng shui)"),
  "tg.bo_sung_gt": m(G, ", giới tính", ", sex"),
  "tg.bo_sung_hm": m(G, ", cùng góc nhà hợp mệnh", ", plus the corner of your home that suits you"),
  "tg.cap_nhat": m(G, "Cập nhật hồ sơ", "Update my details"),
  "tg.bo_sung_nut": m(G, "Bổ sung hồ sơ", "Add these details"),
  "tg.ten": m(G, "thời gian tới", "year ahead"),
} as const satisfies BangChu;

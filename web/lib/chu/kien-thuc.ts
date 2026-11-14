// EN-ALL GĐ 3d — chữ cố định của TRANG KIẾN THỨC dùng chung mọi mảng (trang cụm components/kien-thuc/TrangChuDe.tsx,
// trang một mục TrangKienThuc.tsx, mục lục cụm DanhSachCum / BoLocCum, dòng tác giả DongTacGia, "Trả lời nhanh"
// components/seo/TraLoiNhanh.tsx, hình minh hoạ components/minh-hoa/MinhHoa.tsx + dải QR). Trước đây viết thẳng trong
// component; nay một bảng có chiều `en` để trang Anh (rewrite của trang Việt) dùng CÙNG component. `mac_dinh` = ĐÚNG chữ bản
// Việt cũ từng ký tự (bản Việt không đổi); `en` viết từ nghĩa, không dịch sát. Chưa đưa lên CMS — đổi chữ bằng PR.
// Nội dung bài (tiêu đề, mục, hỏi đáp, nguồn) là của engine — không ở đây. Tên riêng (can, hành, nạp âm) do engine trả mã +
// `ten_hien` (lib/ten-hien.ts).
import type { BangChu } from "@/lib/chu-trang";

const B = "Trang một mục", C = "Trang cụm", L = "Mục lục cụm", T = "Dòng tác giả", H = "Hình minh hoạ", M = "Lời mời cuối bài";

export const CHU_KIEN_THUC = {
  // ---------------------------------------------------------------- "Trả lời nhanh" (trang cụm + trang tra cứu)
  "tln.nhan": { nhom: C, nhan: "Nhãn khối trả lời nhanh", mac_dinh: "Trả lời nhanh", en: "Quick answer" },

  // ---------------------------------------------------------------- trang một mục
  "bai.dang": { nhom: B, nhan: "Chữ trước ngày đăng", mac_dinh: "Đăng", en: "Published" },
  "bai.cap_nhat": { nhom: B, nhan: "Chữ trước ngày cập nhật", mac_dinh: "Cập nhật", en: "Updated" },
  "bai.chuyen_gia_bien_soan": { nhom: B, nhan: "Nhãn bài chuyên gia tự viết", mac_dinh: "Chuyên gia biên soạn", en: "Written by an expert" },
  "bai.da_tham_dinh": { nhom: B, nhan: "Nhãn bài đã thẩm định", mac_dinh: "Đã thẩm định", en: "Expert reviewed" },
  "bai.muc_gap": { nhom: B, nhan: "Dòng dưới tiêu đề mục gập", mac_dinh: "Cách đọc riêng của một trường phái, chưa được đối chiếu rộng — bấm để xem.", en: "One school's own reading, not yet widely cross-checked — tap to open." },
  "bai.bien_tap": { nhom: B, nhan: "Nhãn phần ban biên tập bổ sung", mac_dinh: "Ban biên tập bổ sung", en: "Added by the editorial team" },
  "bai.hoi_dap": { nhom: B, nhan: "Tiêu đề hỏi đáp", mac_dinh: "Câu hỏi thường gặp", en: "Frequently asked questions" },
  "bai.doc_tiep": { nhom: B, nhan: "Tiêu đề link đọc tiếp", mac_dinh: "Đọc tiếp", en: "Keep reading" },
  "bai.nguon": { nhom: B, nhan: "Tiêu đề nguồn", mac_dinh: "Nguồn", en: "Sources" },
  "bai.mien_tru": { nhom: B, nhan: "Câu miễn trừ cuối bài", mac_dinh: "Tham khảo văn hoá và tự suy ngẫm — không phải dự báo, không thay thế tư vấn y tế, pháp lý, tài chính.", en: "Cultural reference and self-reflection — not a prediction, and no substitute for medical, legal or financial advice." },
  "bai.tat_ca": { nhom: B, nhan: "Bản Anh: chữ trước link về trang cụm", mac_dinh: "Xem cả cụm:", en: "Browse all:" },
  "bai.anh_dai_dien": { nhom: B, nhan: "Chú thích ảnh đại diện trong JSON-LD", mac_dinh: "Tóm tắt: {tieu_de}", en: "Summary: {tieu_de}" },

  // ---------------------------------------------------------------- lời mời cuối bài (theo loại trang + nút theo công cụ)
  "moi.chung": { nhom: M, nhan: "Lời mời mặc định (đoạn *nhấn*)", mac_dinh: "Đọc chung chung chỉ là điểm bắt đầu. Xem con số, lá số của *chính bạn* — có từng bước tính để tự kiểm.", en: "A general reading is only a starting point. See the numbers and chart of *your own* birth — every step of the calculation is shown so you can check it." },
  "moi.thap_than": { nhom: M, nhan: "Lời mời — trang thập thần", mac_dinh: "Tứ trụ của bạn có những thập thần nào, đậm hay nhạt? Nhập ngày giờ sinh để lập tứ trụ.", en: "Which of the Ten Gods appear in your own Four Pillars, and are they strong or faint? Enter your birth date and time to set up your chart." },
  "moi.nhat_chu": { nhom: M, nhan: "Lời mời — trang nhật chủ", mac_dinh: "Nhật chủ của bạn là can nào, thân mạnh hay yếu? Nhập ngày giờ sinh để lập tứ trụ.", en: "Which stem is your Day Master, and does your chart run strong or weak? Enter your birth date and time to set up your Four Pillars." },
  "moi.menh_nam": { nhom: M, nhan: "Lời mời — trang mệnh theo năm", mac_dinh: "Ngoài mệnh theo năm sinh, ngũ hành trong tứ trụ của bạn thiếu đủ thế nào? Nhập ngày giờ sinh để xem.", en: "Beyond your birth-year element, how are the five elements balanced in your own Four Pillars? Enter your birth date and time to see." },
  "moi.dau_hieu": { nhom: M, nhan: "Lời mời — trang dấu hiệu nhà", mac_dinh: "Nhà bạn có dấu hiệu này không, nên xử lý gì trước, việc nào không tốn tiền? Khảo sát nhà miễn phí.", en: "Does your home have this sign, what should you deal with first, and what can you fix for free? Survey your home — it's free." },
  "moi.que": { nhom: M, nhan: "Lời mời — trang quẻ Kinh Dịch", mac_dinh: "Đang phân vân một việc? Gieo một quẻ cho đúng việc đó, nhận câu trả lời bằng lời thường.", en: "Unsure about something right now? Cast a hexagram for that one matter and get an answer in plain words." },
  "moi.nut_kinh_dich": { nhom: M, nhan: "Nút mời — Kinh Dịch", mac_dinh: "Gieo quẻ cho việc của tôi", en: "Cast a hexagram for my question" },
  "moi.nut_phong_thuy": { nhom: M, nhan: "Nút mời — Phong thuỷ", mac_dinh: "Xem nhà của tôi", en: "Check my home" },
  "moi.nut_bat_tu": { nhom: M, nhan: "Nút mời — Bát tự", mac_dinh: "Lập lá số Bát tự của tôi", en: "Set up my BaZi chart" },
  "bai.khi": { nhom: "Bài", nhan: "Trích dẫn cổ thư — nhãn trước điều kiện trên lá số", mac_dinh: "Câu này nói về lá số khi", en: "Applies to charts with" },
  "bai.chu_thich": { nhom: "Bài", nhan: "Trích dẫn cổ thư — nhãn chú thích chữ", mac_dinh: "Chú thích: ", en: "Note: " },
  "moi.nut_tu_vi": { nhom: M, nhan: "Nút mời — Tử vi", mac_dinh: "Lập lá số Tử vi của tôi", en: "Set up my Zi Wei chart" },
  "moi.nut_chung": { nhom: M, nhan: "Nút mời mặc định", mac_dinh: "Xem của tôi", en: "See mine" },

  // ---------------------------------------------------------------- mục lục cụm dài (DanhSachCum + BoLocCum)
  "ml.rong": { nhom: L, nhan: "Không trang nào khớp bộ lọc", mac_dinh: "Không có trang nào khớp. Thử tên ngắn hơn hoặc bỏ bớt lọc.", en: "No page matches. Try a shorter name or clear a filter." },
  "ml.loc_nhanh": { nhom: L, nhan: "Nhãn ô lọc ({tong})", mac_dinh: "Lọc nhanh trong {tong} trang", en: "Quick filter across {tong} pages" },
  "ml.vi_du": { nhom: L, nhan: "Gợi ý trong ô lọc ({vi_du})", mac_dinh: "Gõ tên, ví dụ: {vi_du}", en: "Type a name, for example: {vi_du}" },
  "ml.muc_luc": { nhom: L, nhan: "Tên vùng chip nhóm ({nhom})", mac_dinh: "Mục lục {nhom}", en: "Contents {nhom}" },
  "ml.loc": { nhom: L, nhan: "Tên vùng chip lọc ({nhom})", mac_dinh: "Lọc {nhom}", en: "Filter {nhom}" },
  "ml.dang_hien": { nhom: L, nhan: "Số trang đang hiện ({so})", mac_dinh: "Đang hiện {so} trang.", en: "Showing {so} pages." },
  "ml.bo_loc": { nhom: L, nhan: "Nút bỏ lọc", mac_dinh: "Bỏ lọc", en: "Clear filters" },

  // ---------------------------------------------------------------- dòng tác giả (EEAT-1 / BM-1)
  // Bản Anh: bài do ban biên tập chuyển thể từ bản Việt — KHÔNG ghi chuyên gia là tác giả / người thẩm định bản Anh.
  "tg.tac_gia": { nhom: T, nhan: "Bài chuyên gia tự viết — chữ trước tên", mac_dinh: "Tác giả: ", en: "Author: " },
  "tg.tham_dinh": { nhom: T, nhan: "Bài đã thẩm định — chữ trước tên", mac_dinh: "Biên soạn & thẩm định: ", en: "Written and reviewed by " },
  "tg.ban_bien_tap_duyet": { nhom: T, nhan: "Ban biên tập + chủ biên duyệt xuất bản (trước tên)", mac_dinh: "Ban biên tập Hiểu Bản Thân biên soạn · Chủ biên ", en: "Compiled by the Hieuban editorial team · Editor-in-chief " },
  "tg.duyet_sau": { nhom: T, nhan: "Ban biên tập + chủ biên duyệt xuất bản (sau tên)", mac_dinh: " duyệt xuất bản", en: " approved publication" },
  "tg.ban_bien_tap": { nhom: T, nhan: "Ban biên tập + chủ biên (trước tên)", mac_dinh: "Ban biên tập Hiểu Bản Thân · Chủ biên: ", en: "Hieuban editorial team · Editor-in-chief: " },
  "tg.tu_bien_soan": { nhom: T, nhan: "Trạng thái: chuyên gia tự biên soạn", mac_dinh: "Chuyên gia tự biên soạn", en: "Written by the expert" },
  "tg.da_tham_dinh": { nhom: T, nhan: "Trạng thái: đã thẩm định (trước ngày)", mac_dinh: "Đã thẩm định · ", en: "Reviewed · " },
  "tg.nguon": { nhom: T, nhan: "Trạng thái: biên soạn từ nguồn", mac_dinh: "Biên soạn từ cổ thư và tài liệu tham khảo, ghi rõ nguồn và trường phái", en: "Drawn from classical texts and reference books, with sources and schools named" },
  "tg.quy_trinh": { nhom: T, nhan: "Link quy trình biên soạn", mac_dinh: "Quy trình biên soạn", en: "How we write" },
  "tg.ban_viet": { nhom: T, nhan: "Bản Anh: bản Việt đã được chuyên gia đọc ({ten}, {ngay})", mac_dinh: "Bản tiếng Việt do {ten} thẩm định ngày {ngay}.", en: "The Vietnamese edition was reviewed by {ten} on {ngay}." },
  "tg.ban_viet_tac_gia": { nhom: T, nhan: "Bản Anh: bản Việt do chuyên gia tự viết ({ten})", mac_dinh: "Bản tiếng Việt do {ten} tự biên soạn.", en: "The Vietnamese edition was written by {ten}." },
  "tg.vai_tro": { nhom: T, nhan: "Bản Anh: vai trò chủ biên", mac_dinh: "Người sáng lập · Chủ biên nội dung", en: "Founder · Editor-in-chief" },
  "tg.tom_tat": { nhom: T, nhan: "Bản Anh: tóm tắt chủ biên", mac_dinh: "Hơn 15 năm nghiên cứu thần số học, Tử vi, Bát tự, Phong thuỷ và Kinh Dịch.", en: "More than 15 years studying numerology, Zi Wei Dou Shu, BaZi, feng shui and the I Ching." },
  "tg.ten_chu_bien": { nhom: T, nhan: "Bản Anh: tên chủ biên viết không dấu", mac_dinh: "Đức Luân", en: "Duc Luan" },

  // ---------------------------------------------------------------- hình minh hoạ + dải QR
  "mh.qr_moi": { nhom: H, nhan: "Dòng mời quét dưới hình", mac_dinh: "Quét để mở bài này", en: "Scan to open this page" },
  "mh.qr_aria": { nhom: H, nhan: "Tên mã QR ({url})", mac_dinh: "Mã QR mở {url}", en: "QR code that opens {url}" },
  "mh.qh_1": { nhom: H, nhan: "Thập thần — vòng: đồng hành (ngắn)", mac_dinh: "Ta", en: "Self" },
  "mh.qh_2": { nhom: H, nhan: "Thập thần — vòng: ta sinh (ngắn)", mac_dinh: "Ta sinh", en: "Output" },
  "mh.qh_3": { nhom: H, nhan: "Thập thần — vòng: ta khắc (ngắn)", mac_dinh: "Ta khắc", en: "Wealth" },
  "mh.qh_4": { nhom: H, nhan: "Thập thần — vòng: khắc ta (ngắn)", mac_dinh: "Khắc ta", en: "Power" },
  "mh.qh_5": { nhom: H, nhan: "Thập thần — vòng: sinh ta (ngắn)", mac_dinh: "Sinh ta", en: "Resource" },
  "mh.qh_dai_1": { nhom: H, nhan: "Thập thần — chú thích: đồng hành", mac_dinh: "Ta (đồng hành)", en: "the same element as you" },
  "mh.qh_dai_2": { nhom: H, nhan: "Thập thần — chú thích: ta sinh", mac_dinh: "Ta sinh", en: "the element you produce" },
  "mh.qh_dai_3": { nhom: H, nhan: "Thập thần — chú thích: ta khắc", mac_dinh: "Ta khắc", en: "the element you control" },
  "mh.qh_dai_4": { nhom: H, nhan: "Thập thần — chú thích: khắc ta", mac_dinh: "Khắc ta", en: "the element that controls you" },
  "mh.qh_dai_5": { nhom: H, nhan: "Thập thần — chú thích: sinh ta", mac_dinh: "Sinh ta", en: "the element that produces you" },
  "mh.cung_ad": { nhom: H, nhan: "Thập thần — cùng âm dương", mac_dinh: "cùng âm dương", en: "same polarity" },
  "mh.khac_ad": { nhom: H, nhan: "Thập thần — khác âm dương", mac_dinh: "khác âm dương", en: "opposite polarity" },
  "mh.thap_than": { nhom: H, nhan: "Thập thần — chú thích hình ({ten}, {qh}, {ad})", mac_dinh: "{ten}: {qh}, {ad} với nhật chủ", en: "{ten}: {qh}, {ad} to the Day Master" },
  "mh.duong": { nhom: H, nhan: "Dương", mac_dinh: "dương", en: "Yang" },
  "mh.am": { nhom: H, nhan: "Âm", mac_dinh: "âm", en: "Yin" },
  "mh.nhat_chu": { nhom: H, nhan: "Nhật chủ — chú thích hình ({can}, {hanh}, {ad})", mac_dinh: "Nhật chủ {can} — hành {hanh} {ad} trong vòng ngũ hành", en: "Day Master {can} — {ad} {hanh} in the five-element cycle" },
  "mh.nhat_chu_giua": { nhom: H, nhan: "Nhật chủ — chữ giữa vòng ({hanh}, {ad})", mac_dinh: "{hanh} {ad}", en: "{ad} {hanh}" },
  "mh.menh": { nhom: H, nhan: "Mệnh năm — chú thích hình ({can_chi}, {nap_am}, {han}, {hanh})", mac_dinh: "Tuổi {can_chi}, mệnh {nap_am} ({han}) — hành {hanh} trong vòng ngũ hành", en: "{can_chi} year, Na Yin {nap_am} ({han}) — {hanh} in the five-element cycle" },
  "mh.sao": { nhom: H, nhan: "Sao Tử vi — chú thích hình ({ten}, {han}, {hanh})", mac_dinh: "Sao {ten} ({han}), hành {hanh}", en: "{ten} ({han}), {hanh} element" },
  "mh.sao_duoi": { nhom: H, nhan: "Sao Tử vi — chữ dưới hình ({ten}, {hanh})", mac_dinh: "{ten} · {hanh}", en: "{ten} · {hanh}" },
  "mh.cung": { nhom: H, nhan: "Cung Tử vi — chú thích hình ({cung})", mac_dinh: "Cung {cung} — vị trí trong vòng 12 cung Tử vi", en: "The {cung} — its place in the ring of 12 palaces" },
  "mh.sao_cung": { nhom: H, nhan: "Sao ở cung — chú thích hình ({ten}, {han}, {cung})", mac_dinh: "Sao {ten} ({han}) ở cung {cung} — vòng 12 cung Tử vi", en: "{ten} ({han}) in the {cung} — the ring of 12 palaces" },
  "mh.hoa_cung": { nhom: H, nhan: "Hoá ở cung — chú thích hình ({hoa}, {han}, {cung})", mac_dinh: "Hoá {hoa} ({han}) ở cung {cung} — vòng 12 cung Tử vi", en: "Hua {hoa} ({han}) in the {cung} — the ring of 12 palaces" },
  "mh.hoa_nho": { nhom: H, nhan: "Hoá ở cung — chữ nhỏ giữa vòng ({hoa})", mac_dinh: "Hoá {hoa}", en: "Hua {hoa}" },
  // EN-ALL GĐ 6: hình quẻ Kinh Dịch.
  "mh.que": { nhom: H, nhan: "Hình quẻ — chú thích ({so} = số quẻ)", mac_dinh: "Hình quẻ {so} Kinh Dịch — sáu hào, đọc từ dưới lên", en: "Hexagram {so} of the I Ching — six lines, read from the bottom up" },
  // EN-ALL GĐ 5: hình dấu hiệu nhà (Phong thuỷ).
  "mh.dh_tot": { nhom: H, nhan: "Dấu hiệu nhà — dấu hiệu tốt", mac_dinh: "dấu hiệu tốt", en: "a good sign" },
  "mh.dh_veto": { nhom: H, nhan: "Dấu hiệu nhà — nên xử lý trước", mac_dinh: "nên xử lý trước", en: "deal with this first" },
  "mh.dh_de_y": { nhom: H, nhan: "Dấu hiệu nhà — cần để ý", mac_dinh: "dấu hiệu cần để ý", en: "a sign worth checking" },
  "mh.dh_hay_gap": { nhom: H, nhan: "Dấu hiệu nhà — hay gặp ở ({ds})", mac_dinh: ", hay gặp ở {ds}", en: ", often found in the {ds}" },
  "mh.dh_cua": { nhom: H, nhan: "Dấu hiệu nhà — chữ cửa chính", mac_dinh: "cửa chính", en: "front door" },
  "mh.dh_tot_nho": { nhom: H, nhan: "Dấu hiệu nhà — nhãn trên hình (tốt)", mac_dinh: "✓ dấu hiệu tốt", en: "✓ a good sign" },
  "mh.dh_veto_nho": { nhom: H, nhan: "Dấu hiệu nhà — nhãn trên hình (xử lý trước)", mac_dinh: "! nên xử lý trước", en: "! deal with this first" },
} as const satisfies BangChu;

// Menu chân trang mặc định (khi CMS chưa nối / lỗi / chậm). Phải trùng MENU_MAC_DINH trong
// cms/src/globals/DieuHuong.ts — e2e/so-lieu-ngoai.spec.ts kiểm hai bản khớp nhau.
export type CotChanTrang = { ten: string; ds: readonly (readonly [string, string])[] };

// FOOTER-2 (chủ dự án 2026-11-22): 4 cột theo CỤM TỪ KHOÁ — Huyền học (trang trụ, chữ link = cách người ta tìm) · Lịch &
// tuổi (từ khoá mùa vụ / theo năm) · Kiến thức (mỗi môn một cụm lớn) · Về chúng tôi (E-E-A-T + pháp lý). Bỏ link trùng URL
// (#neo), trang noindex (Tài khoản, Nạp Sao), trang đã có ở menu đầu (Hôm nay, Thời gian tới, Bản đồ đội ngũ).
// TRU_CHAN_TRANG: CMS không cho lưu chân trang thiếu trang trụ nào (cms/src/globals/DieuHuong.ts `thieuTru`).
export const TRU_CHAN_TRANG = ["/than-so", "/tu-vi", "/bat-tu", "/kinh-dich", "/phong-thuy", "/nhan-tuong", "/tarot", "/ky-mon", "/chiem-tinh", "/hop-doi", "/huyen-hoc"] as const;
export const COT_CHAN_TRANG: readonly CotChanTrang[] = [
  { ten: "Huyền học", ds: [
    ["/than-so", "Thần số học"], ["/tu-vi", "Xem Tử vi"], ["/bat-tu", "Xem Bát tự (Tứ trụ)"], ["/kinh-dich", "Gieo quẻ Kinh Dịch"],
    ["/phong-thuy", "Phong thuỷ nhà ở"], ["/nhan-tuong", "Xem tướng mặt"], ["/tarot", "Xem bài Tarot"], ["/ky-mon", "Kỳ Môn Độn Giáp"],
    ["/chiem-tinh", "Chiêm tinh phương Tây"], ["/hop-doi", "Xem hợp đôi"], ["/huyen-hoc", "Tất cả các môn huyền học"],
  ] },
  { ten: "Lịch & tuổi", ds: [
    ["/xem-ngay-tot", "Xem ngày tốt"], ["/lich-am", "Lịch âm các năm"], ["/doi-lich-am-duong", "Đổi lịch âm dương"], ["/nam", "Năm nay con gì, mệnh gì"],
    ["/bat-tu/menh-theo-nam", "Sinh năm nào mệnh gì"], ["/xem-tuoi-lam-nha", "Tuổi làm nhà, cưới hỏi"], ["/tuoi-xong-dat", "Tuổi xông đất"], ["/xem-sao-han", "Sao hạn theo tuổi"],
    ["/phong-thuy/huong-hop-tuoi", "Hướng nhà hợp tuổi"], ["/phong-thuy/huong-xau-nam", "Hướng xấu theo năm"],
  ] },
  { ten: "Kiến thức", ds: [
    ["/than-so/y-nghia-so", "Ý nghĩa các con số"], ["/tu-vi/chinh-tinh", "14 chính tinh Tử vi"], ["/bat-tu/thap-than", "Thập thần Bát tự"], ["/kinh-dich/que", "64 quẻ Kinh Dịch"],
    ["/phong-thuy/dau-hieu", "Dấu hiệu phong thuỷ trong nhà"], ["/nhan-tuong/bo-vi", "Bộ vị tướng mặt"], ["/tarot/la-bai", "78 lá bài Tarot"], ["/hop-doi/cap-so", "Số chủ đạo hợp nhau"],
    ["/tu-dien", "Từ điển thuật ngữ"], ["/kien-thuc", "Thư viện kiến thức"], ["/blog", "Blog"],
  ] },
  { ten: "Về chúng tôi", ds: [
    ["/gioi-thieu", "Giới thiệu & phương pháp"], ["/tac-gia", "Đội ngũ biên soạn"], ["/tac-gia/duc-luan", "Chủ biên Đức Luân"], ["/lien-he", "Liên hệ"],
    ["/goi-xem", "Các gói xem"], ["/chinh-sach-rieng-tu", "Chính sách quyền riêng tư"], ["/dieu-khoan", "Điều khoản sử dụng"], ["/mien-tru-trach-nhiem", "Miễn trừ trách nhiệm"],
    ["/chinh-sach-rieng-tu#quyen", "Yêu cầu về dữ liệu cá nhân"],
  ] },
];


// ND-1 — chữ chân trang mặc định (CMS trống / lỗi / chậm). Phải trùng CHAN_TRANG_MAC_DINH trong
// cms/src/globals/DieuHuong.ts — e2e/so-lieu-ngoai.spec.ts kiểm. 115/113/111, dòng ©, thông tin đơn vị giữ trong ChanTrang.
export const GIOI_THIEU_CHAN_TRANG = "Thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot, Kỳ Môn, Chiêm tinh — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.";
export const CAM_KET_CHAN_TRANG = [
  { chu: "Hồ sơ mặc định chỉ lưu trên máy bạn", bieu_tuong: "khien" },
  { chu: "Lá số tính trên hệ thống riêng; họ tên, ngày sinh không chuyển cho bên thứ ba", bieu_tuong: "may_chu" },
  { chu: "Không bán dữ liệu, không quảng cáo nhắm mục tiêu", bieu_tuong: "lap_lanh" },
] as const;
export const MIEN_TRU_CHAN_TRANG = "Nội dung biên soạn từ thư tịch văn hoá cổ điển, để tham khảo và tự suy ngẫm, không phải dự báo. Nội dung không thay thế ý kiến chuyên môn về y tế, tâm lý, pháp lý, tài chính. Nội dung do Ban biên tập Hiểu Bản Thân biên soạn từ cổ thư và tài liệu tham khảo, chủ biên Đức Luân chịu trách nhiệm.";
export const NHAN_UNG_HO_CHAN_TRANG = "Ủng hộ đội ngũ phát triển";

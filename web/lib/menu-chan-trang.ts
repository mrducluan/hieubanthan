// Menu chân trang mặc định (khi CMS chưa nối / lỗi / chậm). Phải trùng MENU_MAC_DINH trong
// cms/src/globals/DieuHuong.ts — e2e/so-lieu-ngoai.spec.ts kiểm hai bản khớp nhau.
export type CotChanTrang = { ten: string; ds: readonly (readonly [string, string])[] };

export const COT_CHAN_TRANG: readonly CotChanTrang[] = [
  { ten: "Huyền học", ds: [
    ["/than-so", "Thần số học"], ["/tu-vi", "Tử vi"], ["/bat-tu", "Bát tự"], ["/kinh-dich", "Kinh Dịch"],
    ["/phong-thuy", "Phong thuỷ"], ["/nhan-tuong", "Nhân tướng học"], ["/tarot", "Tarot"], ["/ky-mon", "Kỳ Môn Độn Giáp"],
    ["/hop-doi", "Hợp đôi"], ["/huyen-hoc", "Tất cả các mảng"],
    ["/hom-nay", "Hôm nay của bạn"], ["/thoi-gian-toi", "Thời gian tới của bạn"], ["/nam", "Xem theo năm"],
    ["/xem-ngay-tot", "Xem ngày tốt"], ["/xem-tuoi-lam-nha", "Tuổi làm nhà, cưới hỏi"],
  ] },
  { ten: "Kiến thức", ds: [
    ["/kien-thuc", "Thư viện kiến thức"], ["/than-so/y-nghia-so", "Ý nghĩa các con số"], ["/kinh-dich/que", "64 quẻ Kinh Dịch"],
    ["/tu-vi/chinh-tinh", "14 chính tinh Tử vi"], ["/tarot/la-bai", "78 lá bài Tarot"], ["/tu-dien", "Từ điển thuật ngữ"], ["/tu-vi/la-so-mau", "Lá số mẫu"],
    ["/phong-thuy/huong-hop-tuoi", "Hướng hợp tuổi"], ["/hop-doi/cap-so", "Số chủ đạo hợp nhau"], ["/tuoi-xong-dat", "Tuổi xông đất"],
    ["/xem-sao-han", "Sao hạn theo tuổi"], ["/doi-lich-am-duong", "Đổi lịch âm dương"], ["/blog", "Blog"],
  ] },
  { ten: "Về chúng tôi", ds: [
    ["/gioi-thieu", "Giới thiệu & phương pháp"], ["/tac-gia", "Đội ngũ biên soạn"], ["/tac-gia/duc-luan", "Chủ biên Đức Luân"], ["/gioi-thieu#nguon", "Nguồn tri thức"], ["/lien-he", "Liên hệ"],
    ["/lien-he#chu-de", "Góp ý, báo lỗi"], ["/ban-do-doi-ngu", "Bản đồ đội ngũ (Chủ DN)"], ["/tai-khoan", "Tài khoản"], ["/nap-sao", "Nạp Sao"], ["/goi-xem", "Các gói xem"],
  ] },
  { ten: "Pháp lý", ds: [
    ["/chinh-sach-rieng-tu", "Chính sách quyền riêng tư"], ["/dieu-khoan", "Điều khoản sử dụng"],
    ["/mien-tru-trach-nhiem", "Miễn trừ trách nhiệm"], ["/chinh-sach-rieng-tu#quyen", "Yêu cầu về dữ liệu cá nhân"],
  ] },
];


// ND-1 — chữ chân trang mặc định (CMS trống / lỗi / chậm). Phải trùng CHAN_TRANG_MAC_DINH trong
// cms/src/globals/DieuHuong.ts — e2e/so-lieu-ngoai.spec.ts kiểm. 115/113/111, dòng ©, thông tin đơn vị giữ trong ChanTrang.
export const GIOI_THIEU_CHAN_TRANG = "Thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot, Kỳ Môn — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.";
export const CAM_KET_CHAN_TRANG = [
  { chu: "Hồ sơ mặc định chỉ lưu trên máy bạn", bieu_tuong: "khien" },
  { chu: "Lá số tính trên hệ thống riêng; họ tên, ngày sinh không chuyển cho bên thứ ba", bieu_tuong: "may_chu" },
  { chu: "Không bán dữ liệu, không quảng cáo nhắm mục tiêu", bieu_tuong: "lap_lanh" },
] as const;
export const MIEN_TRU_CHAN_TRANG = "Nội dung biên soạn từ thư tịch văn hoá cổ điển, để tham khảo và tự suy ngẫm, không phải dự báo. Nội dung không thay thế ý kiến chuyên môn về y tế, tâm lý, pháp lý, tài chính. Nội dung do Ban biên tập Hiểu Bản Thân biên soạn từ cổ thư và tài liệu tham khảo, chủ biên Đức Luân chịu trách nhiệm.";
export const NHAN_UNG_HO_CHAN_TRANG = "Ủng hộ đội ngũ phát triển";

// Menu chân trang mặc định (khi CMS chưa nối / lỗi / chậm). Phải trùng MENU_MAC_DINH trong
// cms/src/globals/DieuHuong.ts — e2e/so-lieu-ngoai.spec.ts kiểm hai bản khớp nhau.
export type CotChanTrang = { ten: string; ds: readonly (readonly [string, string])[] };

export const COT_CHAN_TRANG: readonly CotChanTrang[] = [
  { ten: "Huyền học", ds: [
    ["/than-so", "Thần số học"], ["/tu-vi", "Tử vi"], ["/bat-tu", "Bát tự"], ["/kinh-dich", "Kinh Dịch"],
    ["/phong-thuy", "Phong thuỷ"], ["/hop-doi", "Hợp đôi"], ["/huyen-hoc", "Tất cả các mảng"],
  ] },
  { ten: "Kiến thức", ds: [
    ["/kien-thuc", "Thư viện kiến thức"], ["/than-so/y-nghia-so", "Ý nghĩa các con số"], ["/kinh-dich/que", "64 quẻ Kinh Dịch"],
    ["/tu-vi/chinh-tinh", "14 chính tinh Tử vi"], ["/tu-dien", "Từ điển thuật ngữ"], ["/tu-vi/la-so-mau", "Lá số mẫu"], ["/phong-thuy/huong-hop-tuoi", "Hướng hợp tuổi"],
    ["/hop-doi/cap-so", "Số chủ đạo hợp nhau"], ["/blog", "Blog"],
  ] },
  { ten: "Về chúng tôi", ds: [
    ["/gioi-thieu", "Giới thiệu & phương pháp"], ["/tac-gia/duc-luan", "Chủ biên Đức Luân"], ["/gioi-thieu#nguon", "Nguồn tri thức"], ["/lien-he", "Liên hệ"],
    ["/lien-he#chu-de", "Góp ý, báo lỗi"], ["/tai-khoan", "Tài khoản"], ["/nap-sao", "Nạp Sao"],
  ] },
  { ten: "Pháp lý", ds: [
    ["/chinh-sach-rieng-tu", "Chính sách quyền riêng tư"], ["/dieu-khoan", "Điều khoản sử dụng"],
    ["/mien-tru-trach-nhiem", "Miễn trừ trách nhiệm"], ["/chinh-sach-rieng-tu#quyen", "Yêu cầu về dữ liệu cá nhân"],
  ] },
];


// ND-1 — chữ chân trang mặc định (CMS trống / lỗi / chậm). Phải trùng CHAN_TRANG_MAC_DINH trong
// cms/src/globals/DieuHuong.ts — e2e/so-lieu-ngoai.spec.ts kiểm. 115/113/111, dòng ©, thông tin đơn vị giữ trong ChanTrang.
export const GIOI_THIEU_CHAN_TRANG = "Năm hệ thống văn hoá — thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ — trong một hồ sơ. Cách tính minh bạch, nguồn rõ ràng, để tự soi chứ không để phán.";
export const CAM_KET_CHAN_TRANG = [
  { chu: "Hồ sơ mặc định chỉ lưu trên máy bạn", bieu_tuong: "khien" },
  { chu: "Lá số tính trên hệ thống riêng; họ tên, ngày sinh không chuyển cho bên thứ ba", bieu_tuong: "may_chu" },
  { chu: "Không bán dữ liệu, không quảng cáo nhắm mục tiêu", bieu_tuong: "lap_lanh" },
] as const;
export const MIEN_TRU_CHAN_TRANG = "Nội dung biên soạn từ thư tịch văn hoá cổ điển, để tham khảo và tự suy ngẫm, không phải dự báo. Nội dung không thay thế ý kiến chuyên môn về y tế, tâm lý, pháp lý, tài chính. Nội dung do Ban biên tập Hiểu Bản Thân biên soạn từ cổ thư và tài liệu tham khảo, chủ biên Đức Luân chịu trách nhiệm.";
export const NHAN_UNG_HO_CHAN_TRANG = "Ủng hộ đội ngũ phát triển";

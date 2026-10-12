// Menu chân trang mặc định (khi CMS chưa nối / lỗi / chậm). Phải trùng MENU_MAC_DINH trong
// cms/src/globals/DieuHuong.ts — e2e/so-lieu-ngoai.spec.ts kiểm hai bản khớp nhau.
export type CotChanTrang = { ten: string; ds: readonly (readonly [string, string])[] };

export const COT_CHAN_TRANG: readonly CotChanTrang[] = [
  { ten: "Khám phá", ds: [
    ["/than-so", "Thần số học"], ["/tu-vi", "Tử vi"], ["/bat-tu", "Bát tự"], ["/kinh-dich", "Kinh Dịch"],
    ["/phong-thuy", "Phong thuỷ"], ["/hop-doi", "Hợp đôi"],
  ] },
  { ten: "Kiến thức", ds: [
    ["/kien-thuc", "Thư viện kiến thức"], ["/kien-thuc/than-so", "Ý nghĩa các con số"], ["/kien-thuc/kinh-dich", "64 quẻ Kinh Dịch"],
    ["/kien-thuc/tu-vi", "14 chính tinh Tử vi"], ["/tu-dien", "Từ điển thuật ngữ"], ["/la-so-mau", "Lá số mẫu"], ["/phong-thuy/huong-hop-tuoi", "Hướng hợp tuổi"],
    ["/kien-thuc/hop-so", "Số chủ đạo hợp nhau"], ["/blog", "Blog"],
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


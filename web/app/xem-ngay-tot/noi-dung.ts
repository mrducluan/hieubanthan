// HL-1 — phần giới thiệu + hỏi đáp (SEO) dùng chung cho /xem-ngay-tot và trang ngày/tháng.
import type { NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";
export const ND_XEM_NGAY: NoiDungCongCu = {
  duong: "/xem-ngay-tot",
  ten: "Xem ngày tốt",
  moTa: "Xem ngày tốt hôm nay theo lịch Việt: ngày hoàng đạo hay hắc đạo, trực, giờ hoàng đạo, việc nên làm và nên kiêng, tuổi xung, hướng xuất hành, tìm ngày đẹp cho cưới hỏi, khai trương, về nhà mới.",
  doan: [
    "Mỗi ngày có một vị thần trực theo vòng mười hai thần: sáu thần hoàng đạo (Thanh Long, Minh Đường, Kim Quỹ, Thiên Đức, Ngọc Đường, Tư Mệnh) và sáu thần hắc đạo. Trực (Kiến, Trừ, Mãn, Bình, Định, Chấp, Phá, Nguy, Thành, Thu, Khai, Bế) tính theo chi của ngày và tháng tiết khí.",
    "Danh sách việc nên làm và nên kiêng lấy theo bảng của sách Hiệp kỷ biện phương thư — sách chọn ngày được các bộ lịch vạn niên dùng phổ biến. Trang ghi thêm các ngày dân gian Việt hay kiêng: Tam nương, Nguyệt kỵ, Dương công kỵ nhật.",
    "Nếu bạn có hồ sơ ngày sinh trên máy, trang cho biết ngày đang xem xung, hợp hay bình thường với tuổi bạn (tuổi tính theo năm âm lịch Việt Nam), và khi tìm ngày đẹp sẽ tự bỏ những ngày xung tuổi. Ngày sinh chỉ dùng để tính, không được lưu.",
    "Hoàng lịch là tri thức văn hoá để tham khảo, không phải lời tiên đoán — việc quan trọng vẫn nên dựa trên chuẩn bị thực tế.",
  ],
  hoiDap: [
    { hoi: "Ngày hoàng đạo là gì?", dap: "Là ngày có một trong sáu thần tốt trực: Thanh Long, Minh Đường, Kim Quỹ, Thiên Đức, Ngọc Đường, Tư Mệnh. Sáu ngày còn lại trong vòng là hắc đạo (Thiên Hình, Chu Tước, Bạch Hổ, Thiên Lao, Huyền Vũ, Câu Trận)." },
    { hoi: "Giờ hoàng đạo tính thế nào?", dap: "Mỗi ngày có 12 canh giờ, mỗi canh hai tiếng. Vòng mười hai thần cũng xoay theo giờ, khởi từ chi của ngày, nên mỗi ngày luôn có sáu giờ hoàng đạo." },
    { hoi: "Ngày Tam nương, Nguyệt kỵ là ngày nào?", dap: "Tam nương là các ngày 3, 7, 13, 18, 22, 27 âm lịch; Nguyệt kỵ là ngày 5, 14, 23 âm lịch. Dân gian thường tránh khởi sự việc lớn như cưới hỏi, khai trương vào những ngày này." },
    { hoi: "Tuổi xung với ngày là gì?", dap: "Chi của ngày đối xung với chi năm sinh (ví dụ ngày Thân xung tuổi Dần). Sách lịch khuyên người tuổi xung cân nhắc khi chọn ngày đó cho việc lớn." },
    { hoi: "Tháng trong hoàng lịch tính theo âm lịch hay tiết khí?", dap: "Trực và thần sát tính theo tháng tiết khí (tháng đổi vào ngày Lập xuân, Kinh trập…), không theo mùng 1 âm lịch. Trang tính tiết khí theo giờ Việt Nam." },
  ],
  lienKet: [{ href: "/xem-tuoi-lam-nha", ten: "Tuổi làm nhà, cưới hỏi" }, { href: "/tuoi-xong-dat", ten: "Tuổi xông đất" },
    { href: "/phong-thuy/huong-xau-nam", ten: "Hướng xấu theo năm" }, { href: "/hom-nay", ten: "Hôm nay của bạn" }, { href: "/phong-thuy/huong-hop-tuoi", ten: "Tuổi nào hợp hướng nào" },
    { href: "/tu-dien", ten: "Từ điển thuật ngữ" }, { href: "/kham-pha", ten: "Khám phá huyền học" }],
};

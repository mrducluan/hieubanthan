import type { NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";

// SEO-L5 — giới thiệu + hỏi đáp mặc định của công cụ đổi lịch (CMS "Trang website" ghi đè được).
export const ND_DOI_LICH: NoiDungCongCu = {
  duong: "/doi-lich-am-duong",
  ten: "Đổi lịch âm dương",
  moTa: "Đổi ngày dương lịch sang âm lịch và ngược lại theo âm lịch Việt Nam (giờ Hà Nội), kèm can chi ngày, tháng, năm, tháng nhuận và chỗ lệch với lịch Trung Quốc.",
  doan: [
    "Âm lịch Việt Nam tính theo giờ Hà Nội (UTC+7) theo phép tính thiên văn: mùng 1 là ngày có điểm sóc (trăng non), tháng nhuận là tháng đầu tiên trong năm không chứa trung khí.",
    "Lịch Trung Quốc tính theo giờ Bắc Kinh (UTC+8), nên có năm Tết hai nước lệch nhau một ngày hoặc cả tháng (như năm 1985). Công cụ ghi rõ khi hai lịch khác nhau.",
    "Kết quả kèm can chi của ngày, tháng, năm và số ngày của tháng âm (29 hoặc 30) — tiện đối chiếu sổ tử vi, giấy tờ cũ hay chọn ngày giỗ, ngày rằm.",
  ],
  hoiDap: [
    { hoi: "Vì sao âm lịch Việt Nam và Trung Quốc có lúc khác nhau?", dap: "Hai lịch dùng múi giờ khác nhau (UTC+7 và UTC+8). Khi trăng non rơi vào khoảng 23:00–24:00 giờ Hà Nội, ngày mùng 1 hai bên lệch một ngày; có năm lệch cả tháng nhuận." },
    { hoi: "Tháng nhuận là gì?", dap: "Khoảng 3 năm âm lịch có một năm 13 tháng: tháng thêm vào gọi là tháng nhuận, lấy tên tháng ngay trước nó (ví dụ năm 2025 nhuận tháng 6)." },
    { hoi: "Ngày giỗ tính theo âm lịch thế nào khi năm đó không có tháng nhuận?", dap: "Người mất vào tháng nhuận thường làm giỗ vào tháng chính cùng tên những năm không nhuận. Đây là tập quán, mỗi gia đình có thể khác." },
  ],
  lienKet: [{ href: "/xem-ngay-tot", ten: "Xem ngày tốt" }, { href: "/hom-nay", ten: "Hôm nay của bạn" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
};

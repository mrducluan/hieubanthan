# Ghi chú cho chủ dự án — khối "Đối chiếu Hiệp Kỷ" và thẻ ngày lệch sách ở 2 chỗ

Khối "Đối chiếu ngày theo sách Hiệp Kỷ Biện Phương Thư" trên `/xem-ngay-tot` nay đọc **đúng giá trị thẻ ngày** của
trang (`calc.hoang_lich.ngay`): ngày âm, can chi ngày, chi tháng theo tiết (đổi từ ngày giao tiết), ngày Dương Công
kỵ, thần sát Tứ Ly, bảng Tam Sát (`calc.tuoi_dan_gian._TAM_SAT`). Năm can chi lấy theo Lập xuân (cùng mốc với chi
tháng). Hai chỗ dưới đây giá trị đang hiện **khác chữ trong chính sách Hiệp Kỷ**; hệ thống không tự chọn — chờ anh quyết.
Đổi bất kỳ chỗ nào là đổi đầu ra thẻ ngày (golden đầu ra bản Việt) → cần quyết định riêng.

## 1. Tứ Ly

- **Sách** (quyển 9 «日神按節氣取日數者»): «四離冬至夏至春分秋分各前一日» — một ngày trước Xuân phân, Hạ chí, Thu phân,
  Đông chí (tức 4 ngày mỗi năm, theo giờ giao tiết). Quyển 6 và quyển 10 giải thích cùng nghĩa.
- **Thẻ ngày** dùng cờ 四离 trong bảng thần sát vendor (`hoang_lich_vendor.DAY_SHEN_SHA`, tra theo tháng × can chi ngày).
- **Đo 2020–2025** (2.192 ngày): định nghĩa sách bắt 24 ngày; bảng vendor bắt 2 ngày (12/12/2020, 07/12/2021);
  **không ngày nào trùng nhau**. Bảng vendor gần như không bao giờ ra Tứ Ly đúng nghĩa sách.
- Hiện tại khối Hiệp Kỷ hiện theo bảng vendor (như thẻ ngày); định nghĩa sách tính sẵn ở trường nội bộ
  `tu_ly_theo_sach` của `calc.trach_nhat_hiep_ky` (không ra API).
- **Đề xuất của em**: thẻ ngày chuyển sang định nghĩa sách (tính bằng `tietkhi`, ngày giao tiết theo giờ Việt Nam), bỏ
  cờ 四离 của bảng vendor. Đổi khoảng 4 ngày / năm ở thẻ ngày, mục Kiêng và câu "Trả lời nhanh".

Tứ Tuyệt (một ngày trước Lập xuân, Lập hạ, Lập thu, Lập đông) bảng vendor không có, nên khối Hiệp Kỷ tính theo
định nghĩa sách — không có chỗ lệch.

## 2. Dương Công kỵ (楊公忌)

- **Sách** (quyển 36 «辨譌», mục 楊公忌): «正月十三二月十一以至七月初一二十九而終于十二月十九凡十三日» — tháng 7 có hai
  ngày **mùng 1** và 29. Sách giải thích đây chỉ là ngày sao Thất đếm từ đầu năm và bác việc kiêng.
- **Thẻ ngày** (`hoang_lich.DUONG_CONG`): tháng 7 là **mùng 8** và 29; áp cả tháng nhuận.
- **Đo 2020–2025**: lệch 12 ngày (mỗi năm mùng 1 và mùng 8 tháng 7). Có 3 ngày trong tháng nhuận được tính là Dương
  Công; sách không nói về tháng nhuận.
- Nhiều lịch dân gian Việt ghi "mùng 8 tháng 7" (có thể là chép lệch từ "mùng 1"). Khối Hiệp Kỷ hiện theo thẻ ngày.
- **Đề xuất của em**: đổi (8, 7) → (1, 7) theo sách, giữ hoặc bỏ tháng nhuận theo quyết định của anh.

## Đã sửa trong khối Hiệp Kỷ (không đổi thẻ ngày)

- Thập Ác Đại Bại: phép "điền thực" xét đủ ba chỗ trong câu sách «若太嵗月建太陽在寅則不為空» — Thái Tuế (chi năm, đổi
  ở Lập xuân), Nguyệt Kiến (chi tháng), **Thái Dương** (nguyệt tướng = cung Mặt Trời, đổi ở mỗi trung khí, tính từ kinh
  độ Mặt Trời của `tietkhi`).
- Tam Sát: cảnh báo cho cả ba hướng của vùng Tam Sát, không chỉ hướng giữa.
- Câu sách: lời án 無禄 nằm ở **quyển 5** (義例, lời «按»), không phải quyển 36; câu «修方若遇吉星…» là Hiệp Kỷ **dẫn lời
  Thông Thư** (quyển 8). Lời khuyên viết theo đúng chữ sách (Tứ Ly / Tứ Tuyệt: quyển 10 chỉ để việc cúng lễ, tắm gội,
  dọn dẹp, sửa nhỏ; Phạt nhật: «忌攻討征伐出軍掠地» → tránh khơi tranh chấp, đối đầu).

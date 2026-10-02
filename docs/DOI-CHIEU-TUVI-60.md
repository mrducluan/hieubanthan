# Đối chiếu 60 lá số Tử vi mẫu với `lasotuvi` (LS60, 2026-10-02)

**Mục đích:** có bộ lá số mẫu chuẩn để kiểm độ chính xác, đối chiếu cùng lúc hai máy độc lập có giấy phép MIT:

- engine của mình: iztro (phái Trung Châu), cộng thêm lớp lối Việt;
- `lasotuvi` (doanguyen): lối Việt, dùng lịch Hồ Ngọc Đức theo UTC+7.

**Cách làm:**

- 60 lá ngẫu nhiên cố định (seed 2026, sinh 1930–2025, đủ 12 giờ, nam và nữ).
- 12 lá chọn đúng vào những ngày lịch Việt khác lịch Trung Quốc.
- Golden nằm ở `engine/fixtures/golden/lasotuvi_60.json`, script sinh lại là `engine/fixtures/_generate_lasotuvi_60.py`.
- Test: `engine/tests/test_tuvi_lich_viet.py`, chạy trong CI.

## Lỗi tìm ra và đã sửa

**Lá số Tử vi dùng âm lịch Trung Quốc thay vì âm lịch Việt Nam.**

iztro tự đổi ngày dương sang âm theo lịch Trung Quốc (UTC+8). Giai đoạn 1930–2025 có **1.376 ngày trong 40 đợt** mà hai lịch khác nhau:

- tháng lệch một tháng (năm 1985: Tết Việt ngày 21/1, Tết Trung Quốc ngày 20/2);
- ngày 30 chỉ có ở lịch Việt;
- tháng nhuận lệch nhau.

Người sinh vào những ngày này bị lập sai tháng, kéo theo sai Mệnh, Thân, Cục và chính tinh. Ví dụ: 13/03/1985 lịch Việt là 22/2 Ất Sửu, còn iztro hiểu là 22/1.

Cách sửa (`engine/ziwei/an_sao.mjs`) **không viết lại phần an sao**:

- Engine Python tính âm lịch Việt Nam của ngày sinh và ngày xem hạn (Hồ Ngọc Đức; miền Nam 1960–1975 dùng UTC+8).
- Script Node chỉ thay **kết quả đổi lịch** của đúng hai ngày đó trong `lunar-lite`: tháng, ngày, nhuận, số ngày của tháng, can chi năm.
- Mọi quy tắc an sao vẫn là của iztro.
- `ENGINE_VERSION` tăng lên 0.1.4.

## Kết quả sau khi sửa (60 lá)

| Nhóm | Khớp |
|---|---|
| Vị trí 14 chính tinh | 826/840: 14 ô lệch đều thuộc **một lá sinh nửa sau tháng nhuận**, xem mục quy tắc tháng nhuận |
| Độ sáng chính tinh (lối Việt) | 780/780 |
| Mệnh / Thân | 59/60 (lá tháng nhuận) |
| Lộc Tồn, Kình Dương, Đà La, Địa Không, Địa Kiếp, Văn Xương, Văn Khúc, Thiên Mã, Hồng Loan, Thiên Hỷ, Cô Thần, Quả Tú, Thiên Khốc, Thiên Hư, Long Trì, Phụng Các, Ân Quang, Thiên Quan, Thiên Phúc, Phong Cáo, Đài Phụ, Thiên Đức, Nguyệt Đức | 60/60 |
| Tả Phù, Hữu Bật, Tam Thai, Bát Tọa, Thiên Hình, Thiên Diêu, Thiên Tài, Thiên Thọ, Thiên Thương, Thiên Sứ | 59/60 (lá tháng nhuận) |
| 12 lá rơi vào ngày lịch Việt khác lịch Trung Quốc | 12/12 (lá rơi nửa sau tháng nhuận chỉ kiểm sao an theo năm) |

## Khác trường phái (chưa đổi — chờ chủ dự án chốt)

| Điểm | iztro (Trung Châu, đang dùng) | lasotuvi (lối Việt) | Số lá khác / 60 |
|---|---|---|---|
| **Tháng nhuận, nửa sau (ngày > 15)** | Tính sang tháng sau | Tính như tháng chính | 1 |
| **Hoả Tinh, Linh Tinh** | Chiều an không đổi theo âm dương nam nữ | Đổi chiều theo âm dương nam nữ (sách Việt) | Hoả 31, Linh 38 |
| **Tứ hoá can Canh** | Thái Dương Lộc · Vũ Khúc Quyền · **Thái Âm Khoa · Thiên Đồng Kỵ** | Khoa và Kỵ đổi chỗ (Thiên Đồng Khoa · Thái Âm Kỵ) | 6 |
| **Tứ hoá can Nhâm, Khoa** | Tả Phù | Khác (bản Việt) | 4 |
| **Thiên Khôi / Thiên Việt** | Theo bảng Trung Châu | Khác ở can Đinh, Nhâm, Canh, Mậu | 22 |
| Thiên Quý, Phá Toái, Giải Thần | Theo iztro | Quy tắc khác | 49 / 44 / 58 |

**Đã cảnh báo:** người sinh nửa sau tháng nhuận nhận cờ `thang_nhuan`, nêu rõ quy tắc đang dùng và rằng phái khác có thể ra Mệnh, Cục, sao khác.

Ghi chú: kho `tuongotpho/tuvi` (không có giấy phép, nên chỉ tham khảo, không chép) cho rằng `lasotuvi` sai ở Khôi Việt, Tứ hoá can Canh, Phá Toái và Thai/Dưỡng, còn iztro đúng. Vì vậy những dòng khác phái trên **không** tự động đổi theo `lasotuvi`.

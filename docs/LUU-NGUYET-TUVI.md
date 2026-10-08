# Lưu nguyệt Tử vi — chọn phái và QC (TV-LN, 2026-10-08)

## Quyết định

- Chủ dự án chốt: **có chế độ chọn phái** cho người dùng; engine tính đúng phái đã chọn.
- Mặc định là **Đẩu Quân từ Thái Tuế**, phái phổ biến nhất và khớp iztro.
- Đổi phái chỉ đổi **cung của từng tháng**, không đổi lá số gốc.
- Không đổi kết quả cũ, nên **không tăng `ENGINE_VERSION`**.

## 5 phái

Chi đánh số Tý = 0 … Hợi = 11. "Thuận" là chiều kim đồng hồ trên lá số. Tháng Giêng tính như sau:

| Mã | Tên | Cách tính tháng Giêng | Nguồn |
|---|---|---|---|
| `dau_quan_thai_tue` (mặc định) | Đẩu Quân từ Thái Tuế | Coi cung chi năm xem là tháng Giêng, đếm **nghịch** tới tháng sinh. Coi cung đó là giờ Tý, đếm **thuận** tới giờ sinh. | Tử Vi Đẩu Số Toàn Thư (斗君，正月初一日管事), iztro 流月 |
| `dau_quan_tieu_han` | Đẩu Quân từ Tiểu hạn | Như trên, nhưng khởi đếm từ cung Tiểu hạn | Một số sách/trang tử vi Việt |
| `tieu_han` | Tháng Giêng tại Tiểu hạn | Cung Tiểu hạn | Cách xem nhanh lưu hành ở Việt Nam |
| `luu_nien` | Tháng Giêng tại cung lưu niên | Cung chi năm xem | Tuỳ chọn 流年命宮順數月 (phần mềm Đài Loan/HK) |
| `dia_chi_thang` | Theo địa chi tháng | Tháng Giêng ở Dần, tháng Hai ở Mão… | Tuỳ chọn 流月地支 |

Từ tháng Giêng, các tháng sau đi **thuận**, mỗi tháng một cung.

**Tháng nhuận** theo lựa chọn `thang_nhuan` đã có, áp cho cả tháng sinh và tháng xem:
- `thang_sau` (mặc định, giống iztro): ngày 1–15 tính như tháng chính, ngày 16 trở đi tính tháng sau.
- `thang_chinh`: cả tháng nhuận tính như tháng chính.

**Tứ hoá tháng** theo can tháng (Ngũ hổ độn), dùng bảng giống iztro. Can Canh và Nhâm giữ theo iztro, như quyết định 2026-10-02.

## Mỗi tháng engine trả về

- Khoảng ngày dương và can chi tháng.
- Cung gốc và chủ đề của cung.
- Chính tinh kèm độ sáng Nam phái, Tuần/Triệt, phụ tinh cát và sát.
- Tam phương tứ chính.
- Tứ hoá tháng: sao nằm ở cung nào, có rơi vào đúng cung tháng hoặc vào tam phương không.
- Cung tháng **trùng** hay **chiếu** cung đại hạn, lưu niên, tiểu hạn.
- Xu hướng, công thức công khai: (cát + Hoá Lộc tháng) − (sát + Hoá Kỵ gốc + Hoá Kỵ tháng), chỉ tính trong cung tháng.
- **Cung của tháng đó theo cả 5 phái**, để người dùng so sánh.

Thứ tự ưu tiên khi các lớp mâu thuẫn: đại hạn > lưu niên > tiểu hạn > lưu nguyệt.

## QC

| Kiểm tra | Kết quả |
|---|---|
| Công thức Đẩu Quân so với iztro 2.6.0 (MIT): 40 lá × 17 ngày xem. Có sinh/xem trong tháng nhuận nửa đầu và nửa sau, có sinh Tý muộn, có đủ 12 tháng. | **680/680 khớp** (`fixtures/golden/luu_nguyet_iztro.json`) |
| Tứ hoá theo can tháng so với iztro, đủ 10 can | Khớp |
| Lưu niên = cung chi năm xem, đối chiếu iztro | 680/680 |
| Ca tay: nam 17/05/1990 giờ Ngọ, năm Bính Ngọ. Thái Tuế Ngọ, nghịch 3 → Mão, thuận 6 → Dậu (Phu Thê). Tháng Giêng Canh Dần → Thái Âm hoá Khoa tại Phu Thê. | Đúng |
| Mỗi phái tính đúng công thức của phái đó trên toàn bộ 12 tháng | 5/5 phái |
| Năm có tháng nhuận (2025, nhuận 6): `thang_sau` tách hai nửa, `thang_chinh` giữ một tháng; ngày dương liền mạch | Đạt |
| Hỏi đáp: "tháng 3 âm năm sau", "tháng 5 dương lịch", "tháng này/tháng sau", "lưu nguyệt năm nay"; câu trả lời theo đúng phái người dùng chọn | Test hồi quy trong `test_hoi_dap_chuyen_gia.py` |
| E2E: chọn tháng, đổi phái → cung khác, hỏi về tháng | `e2e/tu-vi.spec.ts` |

Ba phái `dau_quan_tieu_han`, `tieu_han`, `luu_nien` **không có oracle mã nguồn mở**. Chúng được kiểm bằng ca tính tay và công thức. Khi có sách in ví dụ thì bổ sung golden.

## Giới hạn

- Lưu nguyệt là lớp **mỏng căn cứ nhất** của tử vi; skill gốc `tuvi-vn` không khuyến nghị dùng. Vì vậy:
  - giao diện luôn hiện thứ tự ưu tiên;
  - luôn có bảng so 5 phái;
  - không phán biến cố.
- Chưa an **sao lưu theo tháng** (lưu Kình Đà, lưu Lộc tồn tháng…): các phái dùng rất khác nhau. Hiện chỉ có tứ hoá tháng.
- Chưa có lưu nhật / lưu thời: skill gốc không cung cấp, và tỷ lệ tín hiệu trên nhiễu quá thấp.

# Khi nào miễn phí, khi nào cần Sao (ĐỀ XUẤT 2026-10-12, chờ chủ dự án chốt)

> **Khâu:** 4 · Nạp Sao, nhưng không được làm hỏng khâu 1–3 (thu hút, quay lại, mời bạn). **Đo bằng:** tỷ lệ người
> đọc xong bài đọc miễn phí → bấm phần trả Sao (`paywall_viewed`), tỷ lệ nạp lần đầu, ARPPU, chi phí AI / doanh thu
> < 20 %, và tỷ lệ quay lại ngày 7 **không giảm** sau khi bật thu.

## 1. Hiện trạng (đúng như code ngày 2026-10-12)

| Tính năng | Hiện tại | Chi phí biên mỗi lượt |
|---|---|---|
| Thần số: 4 số cốt lõi, bài đọc, biểu đồ, chu kỳ, Hôm nay | Miễn phí | ~0 (tính + tra kho) |
| Lá số Tử vi / Bát tự, độ sáng, vận hạn, lưu niên, lưu nguyệt | Miễn phí | ~0 |
| Kinh Dịch gieo quẻ + nghĩa quẻ/hào | Miễn phí | ~0 |
| Phong thuỷ mệnh quái, đo hướng, Huyền Không, khảo sát nhà | Miễn phí | ~0 |
| Hợp đôi + link mời | Miễn phí | ~0 |
| Trang kiến thức, từ điển, blog | Miễn phí (SEO) | ~0 |
| Hỏi đáp mỗi mảng (AI diễn đạt, rơi về mẫu khi hết lượt) | Miễn phí, trần 40 lượt/giờ/người (RL-1) | **có**: ~100–400đ/câu |
| **Luận giải toàn bộ** Tử vi / Bát tự | **10 Sao**, công tắc `luan_giai.thu_sao` **đang tắt** (miễn phí thử nghiệm) | có (nếu bật AI) |
| Gói nạp (migration 0012, chưa chạy) | 29k = 30 · 99k = 110 · 199k = 240 Sao | — |

Như vậy hôm nay **chưa có gì thu Sao**: công tắc tắt, chưa bật tài khoản (mục F), migration 0012 chưa chạy.

## 2. Nguyên tắc (giữ từ quyết định đã chốt + thực hành freemium)

1. **Phần tính toán và kho tri thức luôn miễn phí.** Đây là thứ kéo người dùng tới (SEO), làm họ quay lại mỗi ngày
   (Hôm nay) và mời bạn (hợp đôi). Khoá nó thì giết khâu 1–3.
2. **Sao chỉ trả cho thứ có chi phí biên thật hoặc giá trị đóng gói:** AI diễn đạt sâu, báo cáo dài theo chương,
   (sau này) ảnh phong thuỷ, PDF.
3. **Cho thấy trước, thu sau:** người dùng luôn thấy chương đầu + mục lục đầy đủ của báo cáo rồi mới gặp nút trả Sao.
   Không làm mờ dữ kiện tính toán (lá số luôn hiện đủ).
4. **Một lần trả, xem lại cả ngày** (đã có: khoá theo lá số + ngày). Không trừ khi engine lỗi (đã có).
5. **Không ép**: không đếm ngược giả, không "chỉ còn 2 suất", không doạ hạn. Hết Sao → gợi ý mời bạn (được Sao) ngang
   hàng với nạp.
6. **Sao tặng mỗi tháng** cho người có tài khoản để ai cũng dùng thử được phần trả phí (thói quen trước, tiền sau).

## 3. Ma trận đề xuất

| Tính năng | Khách (chưa đăng nhập) | Có tài khoản | Trả Sao |
|---|---|---|---|
| Mọi phép tính, lá số, quẻ, hướng, Hôm nay, hợp đôi cơ bản, kiến thức | ✅ | ✅ | — |
| Hỏi đáp AI mỗi mảng | 3 câu/ngày | 10 câu/ngày | sau đó **1 Sao/câu** |
| Kinh Dịch chế độ `day_du`, Tử vi `chi_tiet` (AI dài) | xem thử 1 lần/ngày | 1 lần/ngày | sau đó **2 Sao/lượt** |
| Luận giải toàn bộ Tử vi / Bát tự | chương 1 + mục lục | chương 1 + mục lục | **10 Sao** cả báo cáo, xem lại trong ngày miễn phí |
| Luận giải năm (lưu niên 12 tháng) | tháng hiện tại | tháng hiện tại | **10 Sao** cả năm |
| Hợp đôi chi tiết theo quan hệ (5 kiểu) | tóm tắt | tóm tắt | **5 Sao** bản đầy đủ |
| Phong thuỷ: báo cáo bố cục nhà đầy đủ | 3 kết luận đầu | 3 kết luận đầu | **10 Sao** |
| (Sau) PDF tải về, xem ảnh nhà bằng AI | — | — | 15–30 Sao |
| Sao tặng | — | **+10 khi lưu hồ sơ, +20 mời bạn (hai phía), +5/tháng nếu ghé ≥ 8 ngày** | — |

Một Sao mua ≈ 830–970đ. Chi phí AI một báo cáo 10 Sao ≈ 1–3 nghìn đồng → biên lợi nhuận > 60 % sau phí cổng (~1–2 %).

## 4. Lộ trình bật (mỗi bước đo 2 tuần rồi mới qua bước sau)

| Bước | Việc | Ai | Điều kiện |
|---|---|---|---|
| S0 | Bật tài khoản (VIEC-CUA-ANH mục F) + chạy 0012 + payOS (HT-8) | Anh rồi em | — |
| S1 | Bật `luan_giai.thu_sao` ở /quan-tri — **chỉ** Luận giải toàn bộ 10 Sao; hiện chương 1 + mục lục miễn phí | Em làm "chương 1 miễn phí", anh bật | Đã có ≥ 200 lượt xem luận giải/tuần |
| S2 | Hạn mức hỏi đáp theo tài khoản (3/10 câu/ngày) + 1 Sao/câu vượt | Em (migration đếm lượt, không lưu nội dung câu hỏi) | Chi phí AI > 500k/tháng hoặc S1 có người trả |
| S3 | Hợp đôi chi tiết, luận giải năm, báo cáo bố cục nhà | Em | S1 tỷ lệ trả ≥ 2 % |
| S4 | Sao tặng hằng tháng theo ngày ghé (khâu quay lại) | Em | S2 chạy ổn |

Mọi giá và hạn mức đặt trong `cau_hinh` (/quan-tri), không sửa code khi đổi giá.

## 5. Chủ dự án cần chốt

1. Ma trận ở mục 3 (đặc biệt: hỏi đáp 3/10 câu miễn phí mỗi ngày có hợp không).
2. Giá: giữ Luận giải toàn bộ 10 Sao; hợp đôi chi tiết 5 Sao; lượt AI vượt 1 Sao.
3. Thời điểm S1 (quyết định 2026-10-01: miễn phí 2 tháng thử nghiệm → sớm nhất ~đầu tháng 12/2026).

# Audit bài NotFair trên hieuban.com — 17/11/2026 (NF-BT)

Chủ dự án giao: dựa theo kế hoạch từ khoá 6 tháng (`docs/KE-HOACH-TU-KHOA-SEO-6-THANG.md`), kiểm tra lại các bài NotFair
đang lên web, audit theo engine, bỏ giọng AI sáo rỗng, thêm ảnh đẹp có alt, ảnh bìa có tiêu đề chữ, rồi xuất bản; sau đó
viết bài tiếp theo của kế hoạch dựa trên engine.

## 1. Phạm vi

- REST công khai `https://cms.hieuban.com/api/bai-viet` ngày 17/11/2026: **33 bài đang xuất bản**, trong đó **21 bài nguồn
  NotFair** (chữ ký Đức Luân, BLOG-9), gồm 4 bài máy tự xuất bản sau ngày 11/11 (BLOG-10).
- Chạy lại bộ kiểm định CMS (`kiemDinhBai`) trên từng bài + đếm cụm sáo theo `cum_cam` của KB và danh sách giọng AI hay gặp.
- Đối chiếu ví dụ trong bài với engine Hiểu Bản Thân (Tử vi, Bát tự, thần số, Kinh Dịch, phong thuỷ, nhân tướng).

## 2. Phát hiện

| # | Vấn đề | Số bài | Mức |
|---|---|---|---|
| 1 | Lượt sửa KW-6T (11/11) **chưa lên**: cả 21 bài chính bị bỏ qua vì bản nháp máy để lại (chuẩn hoá BLOG-7 / tự lưu) khác bản xuất bản; 3 bài phụ đã thôi xuất bản | 21 | Cao |
| 2 | Ảnh trong bài chỉ có ảnh tự vẽ "Tóm tắt nhanh / Lộ trình / Câu hỏi thường gặp"; **alt = "Tóm tắt nhanh: " + tiêu đề** (không nói ảnh có gì) | 21 | Cao (SEO ảnh, trợ năng) |
| 3 | Không có ảnh số liệu / ví dụ thật; ví dụ trong bài chưa đối chiếu engine | 21 | Trung bình |
| 4 | Đoạn kết lặp một câu quảng bá chung ("Hiểu Bản Thân cung cấp công cụ…, không thay thế tư vấn chuyên môn…") trỏ về trang chủ, không dẫn đúng công cụ | 20 | Trung bình |
| 5 | Giọng AI: "lăng kính" (11 lần / 8 bài), "tự phản tỉnh / tự phản chiếu", "đánh giá toàn diện", "hãy cùng…"; rào đón "không phải dự đoán chắc chắn" ở hầu hết đoạn | 12 | Trung bình |
| 6 | 4 bài mới (đại vận, đường đời, quẻ Phục Hy, xem tướng) **không có hỏi đáp, không có nguồn**; 4 bài khác chỉ 2 câu hỏi | 8 | Trung bình |
| 7 | Bài quẻ Phục Hy viết sai tên quẻ "Hoả Lôi **Thệ** Hạp" (đúng: Phệ Hạp) | 1 | Thấp |
| 8 | Bài xem tướng gắn mảng "Tử vi" | 1 | Thấp |
| 9 | Trộn kiểu dấu "hòa / hoà", "thủy / thuỷ" (kiểm định cảnh báo) | 3 | Thấp |

Đối chiếu engine (đều **khớp**, không phải sửa lời luận): 14/09/1992 → Đường đời 8 cả hai cách; 7 8 9 7 8 6 → Lôi Hoả Phong
(55) biến Hoả Lôi Phệ Hạp (21); Bát quái Tiên Thiên cặp đối; cách tính Life Path.

## 3. Đã làm (migration CMS `20261117_090000_nf_bt_bien_tap`, `src/lib/notfair-bien-tap.ts`)

1. **Chạy lại KW-6T** không dừng ở bản nháp máy (`apDungKw6t(…, { boQuaNhap: true })`): gộp 3 cặp (308), đổi 3 tiêu đề
   + đường dẫn, link đúng công cụ, "Đọc tiếp", bài liên quan, từ khoá chính không trùng. Bản nháp cũ vẫn trong lịch sử phiên bản.
2. **21 ảnh bìa mới** 1600×900 (WebP): tiêu đề chữ lớn Newsreader, dòng phụ, chip, hoạ tiết theo mảng (lá số 12 cung đúng vị
   trí, quẻ bản → quẻ biến, la bàn tô hướng tốt, vòng ngũ hành, tứ trụ, gương mặt tam đình…), QR về bài, alt riêng từng ảnh.
3. **9 ảnh số liệu engine** chèn đúng mục, alt mô tả nội dung: 4 đại vận của lá số mẫu; 25.933 ngày sinh / 13,8% lệch hai
   cách cộng; hai quẻ 55 → 21 có hào động; tuổi trên gương mặt (Thần Tướng Toàn Biên); Mai Hoa 20/11/2026 → Gia Nhân → Bí;
   lá số 12 cung + Quan Lộc mượn đối cung; 12 giờ → 12 cung Mệnh; cung phi 1992 nam/nữ; năm hành Bát tự.
4. **Alt ảnh cũ** viết lại theo nội dung (danh sách mục / câu hỏi), không lặp tiêu đề.
5. **Đoạn kết** mỗi bài viết lại: dẫn đúng công cụ của mảng và nói rõ công cụ làm gì; bớt cụm sáo; thống nhất "hoà, thuỷ".
6. **Hỏi đáp** đủ ≥ 3 câu; **nguồn** lấy từ link uy tín có sẵn trong bài; bài xem tướng → mảng "Chung"; sửa "Thệ Hạp".

Mô phỏng trên bản sao 33 bài (KW-6T + NF-BT, bộ kiểm định CMS): 0 lỗi chặn, điểm **93–100** (trước 87–100).
Thử thật trên Postgres: `tests/nfbt-du-lieu-that.ts` (nạp bài thật + bản nháp máy khác nội dung → `up` → kiểm → chạy lại → `down`).

## 4. Bài tiếp theo của kế hoạch (tuần 3) — migration `20261117_120000_kw6t_tuan_3`

| Bài | Từ khoá | Số liệu engine dùng trong bài |
|---|---|---|
| `/blog/tai-sao-than-so-hoc-ra-2-ket-qua-khac-nhau` | thần số học ra 2 kết quả khác nhau | 25.933 ngày sinh, 13,8% lệch, chỉ ở cặp 33–6, 22–4, 11–2; Nguyễn Minh Anh: Sứ mệnh 9 (khai sinh) / 4 (thường gọi), Chaldea "Anh" 11 |
| `/blog/than-so-hoc-co-dung-khong` | thần số học có đúng không | Thẻ kiểm chứng 3 điểm mạnh + 3 điểm mù (kho chân dung), ngưỡng 4/2; thí nghiệm Forer 1949 |
| `/blog/khong-biet-gio-sinh-co-xem-tu-vi-duoc-khong` | không biết giờ sinh có xem tử vi được không | 12 canh giờ → 12 cung Mệnh, Cục đổi 5 lần, Bát tự giữ 3 trụ; cách dùng phần định giờ |
| `/blog/mua-nha-cu-can-xem-phong-thuy-gi` | mua nhà cũ cần xem phong thuỷ gì | 12 dấu hiệu KB `bo_tri`, 4 dấu hiệu nặng (veto) + việc theo 3 mức chi phí, mục "nhà cũ mua lại" |

Mỗi bài 4 ảnh WebP (bìa + 3) có alt và QR, xuất bản khi qua kiểm định (vẫn "Gửi duyệt", Ban biên tập đứng tên).
Tuần 4 theo kế hoạch: chuyển nhà về nhà mới · hỏi ChatGPT xem Tử vi · huyền học có phải mê tín · 7 môn huyền học cho người mới.

## 5. Chưa làm / cần người

- Đọc lại 21 + 4 bài, thêm "Góc nhìn chuyên gia" bằng lời của chính chuyên gia (GN-1) rồi bấm Xuất bản → "Đã duyệt".
- Ảnh vẽ ảnh dùng công cụ tự vẽ (HTML + Chromium), không dùng ảnh AI: chữ tiếng Việt trong ảnh luôn đúng dấu.
- Bộ vẽ ảnh: `cms/src/bai-khoi-tao/notfair/ve-anh.mjs` (sửa `NOI_DUNG` rồi chạy lại).

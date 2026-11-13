# 8 video bài blog KW-6T tuần 1–2: đăng YouTube rồi nhúng vào bài

Video dọc 1080×1920, 35–55 giây. YouTube tự xếp vào **Shorts** (video dọc ≤ 3 phút).
Tệp MP4 không vào git. Dựng lại bằng:

```bash
python3 video-ngan/blog-kw6t/giong.py <thư mục ra>
node video-ngan/blog-kw6t/dung.mjs <thư mục ra>
```

## Cách đăng và nhúng tốt nhất

1. **Đăng lên YouTube ở chế độ Công khai.** Video "Không công khai" nhúng vẫn phát, nhưng Google không đưa vào kết quả
   video, nên mất phần lợi SEO. Mỗi video nên chọn ảnh đại diện ở giây đầu (cảnh tiêu đề) và thêm vào danh sách phát
   "Tết Đinh Mùi 2027" (7 video Tết) hoặc "Thần số học cho người mới".
2. **Tiêu đề và mô tả lấy ở bảng dưới.** Link trong mô tả của Shorts không bấm được trên điện thoại, nhưng vẫn bấm được
   trên máy tính và vẫn cho Google biết video thuộc bài nào. Trong video đã có QR và chữ hieuban.com.
3. **Nhúng vào bài:** gửi em 8 link (dạng `youtube.com/shorts/…` là được). Em thêm khối "Video YouTube" vào đúng chỗ
   (ngay sau phần mở đầu, trước mục H2 thứ hai) bằng migration, có tiêu đề video cho trình đọc màn hình.
   Hoặc anh tự làm trong CMS: mở bài → đặt con trỏ ở dòng trống dưới đoạn mở đầu → bấm "+" (hoặc gõ `/`) → chọn
   **Video YouTube** → dán link, điền "Tiêu đề video" (cột Tiêu đề bên dưới) → Lưu → Xuất bản.
4. Sau khi nhúng: web phát video qua youtube-nocookie (ít cookie, hợp chính sách riêng tư), khung video chỉ tải khi người
   đọc cuộn tới (lazy). Video dọc hiện trong khung ngang có viền hai bên, vẫn xem tốt.

## Tiêu đề · mô tả · thẻ

| Mã | Bài | Tiêu đề YouTube (≤ 100 ký tự) |
|---|---|---|
| b1 | /blog/cach-chon-nguoi-xong-dat-dau-nam | Cách chọn người xông đất Tết 2027: 4 bước tự làm #shorts |
| b2 | /blog/khong-co-nguoi-hop-tuoi-xong-dat-thi-lam-sao | Không có người hợp tuổi xông đất thì làm sao? 5 cách #shorts |
| b3 | /blog/tam-tai-la-gi-cach-tinh | Tam tai là gì? Năm 2027 tuổi nào gặp Tam tai #shorts |
| b4 | /blog/kim-lau-la-gi-cach-tinh-tuoi-kim-lau | Kim lâu là gì? Cách tính tuổi Kim lâu năm 2027 #shorts |
| b5 | /blog/hoang-oc-la-gi-cach-dem-tuoi-lam-nha | Hoang ốc là gì? Cách đếm tuổi làm nhà trên 6 cung #shorts |
| b6 | /blog/muon-tuoi-lam-nha-nhu-the-nao | Mượn tuổi làm nhà thế nào? Ví dụ năm 2027 #shorts |
| b7 | /blog/sao-la-hau-ke-do-nam-2027-nen-lam-gi | Sao La Hầu, Kế Đô 2027: tuổi nào gặp, nên làm gì #shorts |
| b8 | /blog/than-so-hoc-cho-nguoi-moi-bat-dau | Thần số học cho người mới: 4 con số cần biết #shorts |

**Mô tả (mẫu, thay dòng đầu và link theo từng video):**

```
<Một câu tóm tắt — lấy câu "Trả lời nhanh" đầu tiên của bài>
Đọc bài đầy đủ (có bảng tuổi 1960–2005): https://hieuban.com/blog/<slug>
Tra tuổi của bạn miễn phí: https://hieuban.com/<trang công cụ>

Nội dung là tập quán dân gian để tham khảo, không phải lời phán.
#tet2027 #dinhmui #hieubanthan
```

Câu tóm tắt + trang công cụ từng video:

- **b1:** Bốn bước chọn người xông đất Tết Đinh Mùi 2027: lấy năm sinh gia chủ, gạt tuổi nên tránh, chọn tuổi hợp, chọn giờ đẹp sáng mùng 1. · https://hieuban.com/tuoi-xong-dat/2027
- **b2:** Không tìm được người hợp tuổi xông đất vẫn có năm cách: gia chủ tự xông, nhờ người nhà, nới tiêu chí, mời trẻ nhỏ, để tự nhiên. · https://hieuban.com/tuoi-xong-dat/2027
- **b3:** Tam tai là ba năm liền nhau dân gian khuyên thận trọng việc lớn; năm 2027 tuổi Hợi, Mão, Mùi ở năm Tam tai cuối. · https://hieuban.com/xem-tuoi-lam-nha/2027
- **b4:** Kim lâu là năm tuổi mụ chia 9 dư 1, 3, 6, 8; ví dụ cô dâu sinh 1998 cưới năm 2027 phạm Kim lâu Thê. · https://hieuban.com/nam/2027/cuoi-hoi
- **b5:** Hoang ốc đếm tuổi mụ qua 6 cung; Nhất Cát, Nhì Nghi, Tứ Tấn Tài là cung tốt cho việc làm nhà. · https://hieuban.com/xem-tuoi-lam-nha/2027
- **b6:** Tuổi người đứng tên chưa đẹp thì mượn tuổi người thân làm lễ động thổ; giấy phép vẫn đứng tên chủ đất. · https://hieuban.com/xem-tuoi-lam-nha/2027
- **b7:** Năm 2027 nam sinh 1964, 1973, 1982, 1991, 2000 gặp La Hầu; La Hầu là năm nên nói ít, nghe nhiều. · https://hieuban.com/xem-sao-han/2027
- **b8:** Thần số học cho người mới bắt đầu từ 4 con số: Đường đời, Sứ mệnh, Linh hồn, Nhân cách. · https://hieuban.com/than-so

**Thẻ chung:** hiểu bản thân, hieuban, tết 2027, đinh mùi, tuổi 2027 + thẻ riêng: xông đất (b1, b2) · tam tai (b3) ·
kim lâu, cưới hỏi (b4) · hoang ốc, làm nhà (b5, b6) · sao hạn, la hầu, kế đô (b7) · thần số học, số đường đời (b8).

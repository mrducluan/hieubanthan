# Persona B — Minh, 27 tuổi, văn phòng Hà Nội, hoài nghi, ghét "AI sáo rỗng"

Phạm vi: localhost:3100, ~60 request, giả lập tìm kiếm bằng /sitemap.xml (962 URL) + /llms.txt. Đọc chữ trong `<main>` của 21 trang: số 7 (ý nghĩa / nghề / tình yêu), cặp 2–7 và 3–7, năm cá nhân 5 và 6, Thái Dương ở Phu Thê và Tử Nữ, Tử Vi ở Mệnh, Hoá Kỵ ở Tài Bạch và Quan Lộc, quẻ 29 / 30 / 63, nhật chủ Giáp và Ất, Thất Sát, gương đối diện giường và gương chiếu cửa chính, /tu-dien, /kinh-dich/que. Kiểm 37 link (mọi link ngoài sitemap + mẫu ngẫu nhiên): tất cả trả 200, riêng một URL đoán tay trả 404 (mục 4 bên dưới).

## Điểm tốt (Minh thấy đáng tin)
- Câu hỏi nào cũng có "Trả lời nhanh" ngay đầu trang, trả lời thẳng.
- **Dữ kiện tính được và ĐÚNG** (đã soát tay):
  - Quẻ 29: nạp giáp Dần–Thìn–Ngọ / Thân–Tuất–Tý, lục thân, thế 6 / ứng 3, hỗ quái Di, sáu quẻ biến (Tiết, Tỷ, Tỉnh, Khốn, Sư, Hoán) đều đúng.
  - Quẻ 63: cung Khảm, quẻ "3 thế", hỗ / thác / tổng đều là Vị Tế — đúng.
  - "Thái Dương ở Phu Thê → Mệnh luôn có Thiên Cơ" và "Thái Dương ở Tử Nữ → Mệnh có Tử Vi" đều đúng khẩu quyết.
  - Bảng tàng can của Thất Sát (10 nhật chủ) và bảng được lệnh 12 tháng của nhật chủ Giáp đều đúng.
  - Ví dụ cộng đường đời và năm cá nhân đều đúng.
- Lời trích Hán văn thật: 甲木參天，脫胎要火 (Trích Thiên Tuỷ), 八字用神，專求月令 (Tử Bình Chân Thuyên).
- Trang gương đối diện giường thực dụng: bảng vị trí gương, việc 0 đồng, nói rõ "không giới thiệu vật phẩm".
- Phần riêng giữa các trang cùng cụm khá lớn: các dòng chữ trùng nhau chủ yếu là byline, chân trang, CTA. Văn mẫu lặp có nhưng ít.
- Đoạn "Ban biên tập bổ sung" có số liệu (11,1 % số ngày ra đường đời 7) và bối cảnh đời thường. Giọng nhìn chung không sáo.

## Vấn đề, xếp theo mức nghiêm trọng

1. **[Cao] Lộ chữ "Nháp AI", tự mâu thuẫn với byline.**
   - URL: /phong-thuy/dau-hieu/guong-doi-dien-giuong và /phong-thuy/dau-hieu/guong-chieu-thang-cua-chinh (chưa mở hết 23 trang dấu hiệu, nhưng có lẽ cả cụm đều vậy).
   - Mục Nguồn: "Nháp AI tổng hợp Dương Trạch Tam Yếu, Táng Thư, Hám Long Kinh (kiến thức phổ thông) + quan niệm dân gian ghi rõ; chưa đối chiếu nguyên văn."
   - Trong khi đầu trang ghi "Biên soạn từ cổ thư… Chủ biên duyệt xuất bản". Minh đọc tới đây là mất tin cả trang. Câu này còn trái BM-1. Táng Thư và Hám Long Kinh là sách âm trạch / địa hình, chẳng liên quan gì tới gương.
   - Đề xuất: lọc chuỗi này trong `cong_khai.py`; nguồn cụm dấu hiệu chỉ ghi "Phong thuỷ dân gian Việt Nam (truyền khẩu)" + Dương Trạch Tam Yếu (nếu đúng); thêm test e2e bắt chữ "Nháp AI".

2. **[Cao] Mâu thuẫn "số 7 hợp với số nào" giữa hai trang.**
   - /than-so/y-nghia-so/so-7: "Số 7 thường được xếp chung nhóm với 1 và 5… Với số 2 hay 6, số 7 dễ bị thấy là lạnh".
   - /than-so/tinh-yeu/so-7-trong-tinh-yeu: "Số 4, 7 hoặc 9 thường hợp nhịp… Số 2, 3 hoặc 6 mang hơi ấm".
   - Người hoài nghi thấy ngay hai trang nói hai kiểu.
   - Đề xuất: thống nhất một nguồn KB (cùng nhóm năng lượng ở `thanso_ban_do`), hoặc nói rõ một bên xét theo "nhóm năng lượng", một bên xét theo "nhịp sống chung".

3. **[Trung bình] "Cấu trúc quẻ" dày thuật ngữ, không giải thích cho người mới.**
   - URL: /kinh-dich/que/que-29-kham, que-63-ky-te.
   - Đoạn: "loại Bát thuần, hào thế 6, hào ứng 3. Hỗ quái là Di… Bảng dưới ghi nạp giáp, lục thân".
   - Trang không link sang từ điển và không có chú thích; "loại 3 thế" khó hiểu. /tu-dien có Thế, Ứng, Lục thân nhưng **không có Nạp giáp, Hỗ quái**.
   - Đề xuất: thêm 1–2 câu "đọc bảng này thế nào" (thế = bạn, ứng = người/việc kia, lục thân = vai của hào, hỗ quái = diễn biến bên trong). Gạch chân, link sang /tu-dien. Bổ sung mục Nạp giáp, Hỗ quái vào từ điển.

4. **[Trung bình] Cặp số đảo thứ tự trả 404.**
   - /hop-doi/cap-so/so-chu-dao-7-va-2 → 404. Chỉ có bản 2-va-7.
   - Người gõ hay link ngoài theo thứ tự "7 và 2" sẽ gặp trang lỗi.
   - Đề xuất: 308 số lớn–nhỏ về nhỏ–lớn.

5. **[Trung bình] Tiêu đề quẻ thiếu tên đầy đủ.**
   - Quẻ 29 và 30 không có chữ "Thuần Khảm", "Thuần Ly" ở bất cứ đâu, kể cả title "Quẻ 29 Khảm (坎)".
   - Minh tìm "quẻ Thuần Khảm" thì khó ra trang này.
   - Đề xuất: thêm tên đầy đủ (Thuần Khảm / Bát Thuần Khảm, Thủy Hỏa Ký Tế…) vào H1, Trả lời nhanh, title cho cả 64 quẻ.

6. **[Trung bình] Câu khó hiểu, dễ hiểu sai ở Hoá Kỵ.**
   - /tu-vi/tu-hoa/hoa-ky-cung-tai-bach: "Vũ Khúc ở đây ứng với các năm Nhâm, vd 2032; Thiên Cơ ứng với các năm Mậu".
   - /tu-vi/tu-hoa/hoa-ky-cung-quan-loc: "Thiên Cơ ở đây…".
   - Chữ "ở đây" đọc như thể ai cũng có Vũ Khúc ở Tài Bạch.
   - Đề xuất: viết "Nếu Vũ Khúc nằm ở Tài Bạch của bạn thì năm Nhâm (vd 2032)…".

7. **[Thấp–Trung bình] Lặp ý ngay trong một đoạn, lộ dấu ghép máy.**
   - /than-so/nghe-nghiep/so-7-hop-nghe-gi, "Cái bẫy": "…dễ cầu toàn đến chậm tiến độ. Dễ cầu toàn, ngại trình bày…". Mục tiền bạc lặp "cân nhắc kỹ / tìm hiểu kỹ".
   - /than-so/tinh-yeu/so-7-trong-tinh-yeu, "Điểm mù": hai câu cùng ý. Mục Nguồn có một dòng in hai lần.
   - Trả lời nhanh của sao-ở-cung lặp ý câu đầu, ví dụ Thái Dương Phu Thê: "người bạn đời đàng hoàng, có danh dự… Bạn chọn người đàng hoàng, có danh dự". Hoá Kỵ ở Tài Bạch cũng vậy. Gương đối diện giường thì Trả lời nhanh = mục "Dân gian nói gì" + "Nhìn theo đời sống hiện đại".
   - Đề xuất: khử trùng lặp câu khi ghép KB (so cụm 5 từ).

8. **[Thấp–Trung bình] "Sách xưa nói gì" ghi nguồn không phải sách.**
   - Cụm thần số ghi nguồn là "Thần số học Pythagoras — hệ thống phổ biến".
   - Cụm dấu hiệu ghi "truyền khẩu", lại dưới tiêu đề "Sách xưa".
   - Byline mọi trang thần số ghi "Biên soạn từ cổ thư" trong khi đây là hệ hiện đại.
   - Đề xuất: đổi tiêu đề thành "Truyền thống / Các sách phổ biến nói gì" khi không có sách cụ thể; byline thần số bỏ chữ "cổ thư".

9. **[Thấp] Tử Vi ở cung Mệnh: tiêu đề và nội dung chỏi nhau.**
   - Tiêu đề "Khi Tử Vi hãm ở cung Mệnh", câu đầu lại nói "Tử Vi không có vị trí hãm theo bảng Nam phái".
   - Đề xuất: đổi tiêu đề thành "Khi Tử Vi kém sáng (bình)", nêu rõ các chi Tý, Mão, Dậu, Hợi.
   - "vô chính diệu", "toạ Mệnh" trong bảng chưa giải thích hay link từ điển.
   - Mục "cung Mệnh có sao gì" và bảng tam phương thì dễ hiểu, đáng tin.

10. **[Thấp] Năm cá nhân 5, mục "từng quý": trộn hai loại số tháng.**
    - Ngoặc ghi "(tháng cá nhân 6, 7, 8)", nhưng ngay sau lại viết "rồi tháng 3…" — đó là tháng dương lịch.
    - Tiêu đề quý cũng không đồng nhất ("Ba tháng tiếp" ↔ "Tháng 7, 8, 9").
    - Câu "hợp cân nhắc kỹ mọi quyết vội" lủng củng.
    - Đề xuất: mọi dòng dùng định dạng "Tháng 1–3 dương lịch (tháng cá nhân 6–8): …".

## Lý do bấm công cụ cá nhân
- Câu CTA "Đọc chung chung chỉ là điểm bắt đầu…" giống hệt trên mọi trang và không nói sẽ nhận được gì. Trang Tử vi có lý do rất rõ để bấm (sao đậm hay nhạt tuỳ chi cung), nhưng CTA lại không dùng tới.
- Đề xuất CTA theo cụm, ví dụ: "Thái Dương của bạn sáng hay hãm? Nhập ngày giờ sinh để biết cung Phu Thê của bạn rơi vào chi nào".

## Biên soạn / nguồn
- Byline rõ: "Ban biên tập biên soạn · Chủ biên Đức Luân duyệt xuất bản". Riêng trang Số 7 ghi "Tác giả: Đức Luân", kèm các đoạn có nhãn "Ban biên tập bổ sung" — đúng EEAT-1.
- Nguồn cổ thư ghi đủ ở Tử vi (Toàn Thư, Nam phái Nguyễn Phát Lộc), Kinh Dịch (Chu Dịch, Mai Hoa, Tăng San Bốc Dịch), Bát tự (Trích Thiên Tuỷ, Tử Bình Chân Thuyên, Uyên Hải Tử Bình).
- Chỗ hỏng duy nhất là cụm dấu hiệu Phong thuỷ (mục 1).

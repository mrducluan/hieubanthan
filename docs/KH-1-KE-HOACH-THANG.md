# KH-1 — Audit /thoi-gian-toi + /chan-dung và "Việc bạn định làm: tháng nào hợp" (2026-11-23)

Khâu của vòng tăng trưởng: **QUAY LẠI** (trả lời câu người dùng mang tới, có lý do mở lại khi kế hoạch đổi) và **THU HÚT**
(nhóm quảng cáo / tìm kiếm "tháng nào tốt để …"). Đo bằng `chart_interacted{mo_dun=thoi_gian, kind=ke_hoach_chon|ke_hoach_thang|ke_hoach_xuong_bai}`
→ `reading_completed{mo_dun=thoi_gian}` → `unlock_clicked{mo_dun=thoi_gian}`.

## 1. Audit: engine trả gì, giao diện dùng gì

Chạy engine thật với hai hồ sơ: chỉ ngày sinh, và đủ lá số.

| | /thoi-gian-toi | /chan-dung |
|---|---|---|
| Chỉ họ tên + ngày sinh | Đọc được: thần số (năm, tháng cá nhân), con giáp từng tháng, ngày đẹp, tập quán theo tuổi; phong thuỷ cần giới tính. **Họ tên không dùng tới.** | **Ngõ cụt**: chỉ có khối mời lập lá số (cần giờ, giới tính, nơi sinh) |
| Đủ lá số | Thêm Tử vi (tháng âm) + Bát tự (tháng tiết), hộp "hai lá số cùng thấy / nhìn hai mặt" | Ma trận 6 mảng × 3 môn, 9 chương |
| Khoảng trống | `cot_loi` ("Điều quan trọng nhất") **luôn rỗng** — cả khi đủ lá số; 12 tháng chỉ trả lời "tháng này thế nào", không trả lời "việc tôi định làm thì tháng nào" | Người chỉ có thần số không có gì để xem |

Điều người đọc thật sự mang tới (từ hỏi đáp + Search Console): "tháng nào tốt để đổi việc / mua nhà / cưới / khai trương",
"năm nay có nên …". Engine đã có đủ phép tính để trả lời (tháng cá nhân, con giáp tháng, sách lịch chọn ngày theo việc,
mức tháng Tử vi / Bát tự, Kim lâu, tuổi làm nhà) nhưng **chưa ghép lại theo việc**.

## 2. Ba cách tiếp cận

### A. "Việc bạn định làm: tháng nào hợp" (/thoi-gian-toi) — **CHỌN**
Chọn 1 trong 9 việc (đổi việc, khai trương, ký hợp đồng / bàn lương, mua nhà, làm nhà, cưới hỏi, đi xa, học thi, mua xe)
→ 12 tháng tới, mỗi tháng đếm các cách xem (thần số: tháng cá nhân có hợp việc này không; con giáp hợp / xung; sách lịch có
ngày hợp việc này không; Tử vi + Bát tự khi đủ giờ) → tháng hợp nhất, tháng nên lùi, 3 ngày nên đặt việc chính, tập quán theo
năm (Kim lâu cô dâu, tuổi làm nhà), việc nên làm trước, ranh giới.

- **Được**: đánh đúng nỗi đau "dự định"; chạy được chỉ với ngày sinh (đa số người dùng); một bộ tính — mọi phép đã có golden;
  quay lại tự nhiên (đổi việc định làm, mở lại đúng việc đã chọn); khớp nhóm quảng cáo "tháng nào tốt để …".
- **Rủi ro, đã chặn**: (1) dễ thành "chấm điểm tháng" → chỉ đếm lớp, cùng luật "≥ 2 thuận, 0 nhắc chậm" của TG-V2, không số;
  (2) "phán" → câu nói "nhịp gợi ý", có ranh giới (không phải lời khuyên đầu tư / pháp lý, kỹ sư, kết quả thi do ôn tập);
  (3) dữ kiện thần số × việc có thể bị bịa → số hợp lấy đúng chữ `hop_de` của `thanso_ban_do` (KB đã có), không thêm
  luật "số xấu"; (4) ăn mất phần trả phí → chỉ đưa câu trả lời + ngày; lý do từng mảng (công việc, tiền, tình cảm theo từng tháng)
  vẫn ở chương khoá, khối có lối "Đọc từng tháng kỹ hơn ↓".
- **Hạn chế còn lại**: chỉ có ngày sinh thì tối đa 2 điểm thuận (thần số + con giáp) → nhiều việc chỉ ra mức "Được", ít
  "Hợp nhất". Đúng sự thật, nói rõ ("chưa có tháng nào hội đủ hai điểm thuận").

### B. "Chân dung tạm" từ họ tên + ngày sinh (/chan-dung)
Bỏ ngõ cụt: khi thiếu giờ, đặt cạnh nhau những gì đã đọc được (4 số thần số, nhật chủ Bát tự theo ngày, con giáp + nạp âm)
rồi mời thêm giờ để có bản đủ.
- **Được**: không còn trang trống cho người chỉ có thần số.
- **Bác vì**: lặp nội dung /than-so và /bat-tu; không có "mức theo mảng" cho thần số và Bát tự thiếu giờ nên ma trận đồng thuận
  sẽ phải tự chế (CD-1 đã loại hướng "đồ thị nét người liên môn" vì độ chính xác giả); giá trị mới cho người đọc thấp.

### C. "Nhìn lại để tin nhìn tới" (/thoi-gian-toi)
5 năm đã qua: năm cá nhân, năm tuổi / xung tuổi, (đủ giờ) mức Tử vi / Bát tự từng năm → người đọc tự đánh dấu năm nào
thật sự là bước ngoặt → tăng niềm tin trước khi đọc năm tới.
- **Được**: chạm sự tò mò về bản thân, tạo niềm tin bằng kiểm chứng của chính người đọc.
- **Bác (để sau)**: không trả lời câu người ta mang tới ("tôi nên làm gì"); BT-DC đã làm cơ chế đối chiếu quá khứ cho Bát tự —
  nên mở rộng từ đó khi có số liệu tỉ lệ dùng, không dựng thêm một cơ chế song song.

**Chọn A**: giá trị cao nhất cho người đọc, ít rủi ro nhất (không phép tính mới, không dữ liệu mới), đo được ngay.

## 3. Đã làm

- Engine RULES `luangiai/ke_hoach_thang.py` + KB `ke_hoach_thang_kb.json` (nháp ban biên tập) + route
  `GET/POST /v1/thoi-gian-toi/ke-hoach`; test viết trước `tests/test_ke_hoach_thang.py` (20 ca: một nguồn tháng cá nhân,
  không điểm số, tháng xung tuổi không bao giờ "Hợp nhất", ngày gợi ý đúng `chon_ngay` + không quá khứ / kiêng, Kim lâu chỉ cô
  dâu và chỉ ghi "Kim lâu", đầu ra không mang ngày sinh, không doạ, không cụm giọng AI).
- Web: khối `components/thoi-gian/KeHoachThang.tsx` đầu /thoi-gian-toi (chào bằng tên trên máy — tên không gửi engine; dải 12
  tháng bấm được, màu lục / hổ phách, không đỏ; máy nhớ MÃ việc đã chọn), proxy `/api/thoi-gian-toi/ke-hoach`.
- `?kw=thang-tot` (/thoi-gian-toi) và `?kw=tong-hop` (/chan-dung) cho nhóm quảng cáo Google.
- Tử vi: lối "Hỏi một câu về lá số ↓" cạnh nút xuống bài luận. Mục lục dính riêng **không làm**: trên điện thoại sẽ chồng lên
  thanh chương của báo cáo (cùng vị trí dính).

## 4. Việc tiếp theo (chưa làm, chờ số)
- Điền `cot_loi` của Thời gian tới (đang rỗng) từ hộp đầu chương 1 — đổi đầu ra cũ, cần sinh lại golden có chủ đích.
- Mời "nhắc tôi" (nhắc việc opt-in KC-4) vào ngày đầu tháng hợp nhất của việc đã chọn.
- Cách C khi BT-DC có ≥ 300 lượt dùng.

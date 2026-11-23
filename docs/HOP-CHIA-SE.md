# Hộp chia sẻ chung (HCS-1, 2026-11-23)

Khâu vòng tăng trưởng: **MỜI**. Đo `share_sheet_opened` → `share_target{kenh, bien_the}` → `share_clicked` →
`referral_signup` (theo tiền tố `?tu=`). Bảng thẻ và quy tắc riêng tư của từng thẻ vẫn ở `docs/THE-CHIA-SE.md`.

## 1. Học được gì từ readalongbook, và hieuban đã hụt ở đâu

| readalongbook làm | hieuban trước HCS-1 | Sau HCS-1 |
|---|---|---|
| Một hộp chia sẻ cho mọi trang | 13 giao diện riêng, mỗi thẻ một kiểu nút | `BangGui` dùng chung cho mọi thẻ đã nối (mục 5) |
| Thấy trước tấm thẻ bạn bè sẽ nhận | Không hiện ảnh trước khi gửi | Ảnh `/og/...` ngang (đúng ảnh hiện khi dán link) + dòng "không có ngày sinh" |
| Nút theo app + Copy link + "More apps" | Điện thoại: hộp của máy; máy tính: chỉ chép link | Zalo · Messenger · Facebook · Gửi ảnh · Chép · Lưu ảnh · Khác, xếp theo nơi người dùng đứng |
| Một chạm là có link | Gõ tên → Tạo link → Gửi (2–3 bước) | Mở khung là thẻ được tạo; đổi tên là tuỳ chọn |
| Không có | `<a download>` không lưu được ảnh trong app Zalo / Facebook / Instagram | "Gửi ảnh" gửi thẳng tệp qua hộp chia sẻ của máy (tệp tải sẵn khi hộp mở); không gửi được tệp → nhắc "nhấn giữ ảnh để lưu" |
| Nút chia sẻ ở thanh trên mọi trang | ~700 trang kiến thức + blog + ngày tốt + lịch âm không có nút | `NutChiaSeTrang` ở trang kiến thức, bài blog CMS và mọi trang có khối "Trả lời nhanh" |

Không chép: X, Pinterest, WhatsApp, Telegram (ít người Việt dùng), logo bằng chữ cái.

## 2. Thành phần

- `web/components/chia-se/HopChiaSe.tsx`
  - `BangGui`: ảnh xem trước · chọn lời nhắn (2–3 lời + "Sửa lời nhắn") · kênh · ô link + Chép link.
  - `HopGui`: `BangGui` trong hộp trượt (Sheet) cho nút một chạm.
  - `NutRuBan`: nút mời chia sẻ chung — viền vàng, vệt sáng (`.nut-sang`, tắt khi giảm chuyển động), dòng phụ nói thẻ có / không có gì.
- `web/components/chia-se/KhungTaoThe.tsx`: thẻ cần máy chủ ký mã từ kết quả vừa xem (hai người, nhà, quẻ, trải bài) — mở khung là tạo.
- `web/components/chia-se/NutChiaSeTrang.tsx`: trang công khai, không ký mã; link = trang + `?tu=tr.<ngẫu nhiên>`, ảnh = `og:image` của trang.
- `web/lib/kenh-chia-se.ts`: thứ tự kênh, link Facebook (`sharer.php`, không app id), Messenger (`fb-messenger://`, chỉ điện thoại).
- `web/lib/loi-nhan-chia-se.ts`: lời nhắn theo thẻ (`loiNhanThe`), theo trang (`loiNhanTrang`), nhãn nút (`CTA_CHIA_SE`).

**Kênh và thứ tự** (`thuTuKenh`):

| Nơi đứng | Thứ tự |
|---|---|
| Trong app Zalo | Zalo → Gửi ảnh → Facebook → Chép → Lưu ảnh → Khác |
| Trong app Facebook / Instagram | Gửi ảnh → Messenger → Facebook → Zalo → … |
| Điện thoại thường | Zalo → Messenger → Gửi ảnh → Facebook → … |
| Máy tính | Zalo (chép sẵn lời + link, nhắc dán vào Zalo PC) → Facebook → Chép → Lưu ảnh |

Zalo không có link chia sẻ web công khai ổn định; trên điện thoại Zalo luôn nằm trong hộp chia sẻ của máy. SDK Zalo
(`sp.zalo.me`) **không nạp** — cần script ngoài + mở CSP, phải hỏi chủ dự án trước.

**Riêng tư**: hộp không thêm dữ liệu mới vào link hay ảnh — vẫn là mã ký của từng thẻ. Đo lường chỉ gửi mã kênh, kết quả,
mã lời nhắn (`bien_the`), không bao giờ gửi chữ lời nhắn hay link (e2e kiểm).

## 3. Lời nhắn soạn sẵn — cá nhân hoá theo thẻ và theo trang

### 3.1 Nguyên tắc (test `e2e/hop-chia-se.spec.ts` khoá)

1. Giọng **người gửi** ("mình"), ≤ 2 câu, kết bằng lời mời hành động + dấu ":" để link đứng ngay sau.
2. Mỗi thẻ có ba lối mở, người gửi chọn:
   - **Khoe + hỏi lại**: "Mình là số 7 — … Bạn số mấy?"
   - **Nỗi lo người nhận đang có**: "Đừng để sáng mùng 1 mới cuống tìm người xông đất", "Đang định mua nhà, thuê nhà hay sửa nhà?"
   - **Trò chơi / thách**: "Đoán xem mình là số mấy?"
3. Chỉ dùng dữ kiện đã có trên thẻ (con số, tên quẻ, nhãn nghiêng, điểm). Không ngày sinh, không can chi / con giáp năm
   sinh. Không doạ ("xui", "hạn nặng"), không hứa chính xác ("100%", "chắc chắn"), không vật phẩm / giải hạn.
4. Lời về **người khác** chỉ ở thẻ cặp đôi.

### 3.2 Lời theo thẻ (mặc định = lời đầu)

| Thẻ | Lời đầu (ví dụ với dữ liệu thật) | Lối mở khác |
|---|---|---|
| Hồ sơ | "Mình là số 7 — người đi tìm sự thật. Đọc xong thấy đúng tới mức hơi ngại. Bạn số mấy? Nhập ngày sinh, 30 giây là biết:" | Đoán số · "sao mình cứ vấp mãi một kiểu" |
| Lời mời hợp đôi | "Mình nhập ngày sinh rồi, tới lượt bạn. Xem hai đứa mình hợp nhau ở đâu, dễ lệch nhau ở đâu:" | Nói mãi không hiểu nhau · "Mình là số 7. Bạn số mấy?" |
| Hai người (Tử vi) | "Hai đứa mình được 72/100 — "Hợp nếu hiểu nhau". Bạn với người ấy được bao nhiêu?" | Trước khi giận người ấy · Cặp nào cũng có chỗ phải nhường |
| Thẻ ngày | "Hôm nay là Ngày cá nhân 4 của mình — … Ngày của bạn số mấy? Xem để biết hôm nay nên đẩy việc hay nên chậm lại:" | Ngày trôi / ngày vướng · Trước khi chốt việc quan trọng |
| Xông đất | "Tết Đinh Mùi 2027 nhà mình nên mời tuổi nào xông đất? …" | Sáng mùng 1 mới cuống · Ông bà coi trọng người bước vào đầu năm |
| Nhà | "Mình vừa xem nhà mình (hướng Nam): phòng nào hợp, chỗ nào nên sửa đã rõ. Nhà bạn thì sao?" | Đang định mua / thuê / sửa nhà · Kê giường, kê bàn |
| Quẻ | "Mình đang phân vân chuyện đổi việc và gieo được quẻ Lý. Bạn đang lăn tăn việc gì? Gieo thử một quẻ:" | Đứng giữa hai lựa chọn · Đọc lời quẻ thấy nhẹ đầu |
| Tarot | "Mình hỏi lá bài chuyện đổi việc — câu trả lời: "nên chờ thêm". Bạn có câu nào đang canh cánh không?" | Có nên hay không · Không bói số phận |
| Bản đồ 5 mảng | câu mời của biến thể thẻ (CTA-1) | Đoán số · 5 môn cùng nhìn một người |
| Ba lá · Tháng · Huy hiệu · Câu hỏi | khoe + hỏi lại | thói quen mỗi sáng · "câu này chắc bạn cũng từng thắc mắc" |

### 3.3 Lời theo trang — cách sinh

`loiNhanTrang(đường dẫn, tiêu đề, câu trả lời ngắn)` trả 3 lời, **tất định, không gọi AI**:

1. **Câu hỏi + câu trả lời của chính trang**: tiêu đề (thường đã là câu người ta tìm) + câu "Trả lời nhanh" do engine dựng,
   cắt ở ranh câu ≤ 140 ký tự. Ví dụ: "Ngày 24/11/2026 tốt hay xấu? Ngày Hoàng đạo, hợp cưới hỏi, khai trương. Xem đầy đủ:".
   Đây là lời cá nhân hoá nhất — mỗi trang một lời, không ai phải viết tay.
2. **Nỗi lo theo cụm** (`HOOK_TRANG`, khớp tiền tố đường dẫn — 26 cụm): xem ngày tốt → "Sắp làm việc lớn — cưới hỏi,
   khai trương, về nhà mới?", tuổi làm nhà → "đỡ phải mượn tuổi phút chót", hướng hợp tuổi → "Sắp mua nhà, thuê nhà?",
   dấu hiệu trong nhà → "phần lớn không tốn tiền", sao ở cung → "mình đọc thấy khá trúng"…
3. **Gửi người cần**: "Gửi bạn đang băn khoăn chuyện này — {tiêu đề}:".

**Đề xuất tầng tiếp theo (chưa làm, cần anh chọn):**

- **A (khuyên làm trước) — chọn lời thắng bằng số**: sau 4 tuần đọc `share_target{bien_the}` → `share_clicked` theo mã lời,
  đổi thứ tự (lời có tỉ lệ bạn bè bấm cao nhất lên đầu) ngay trong `loi-nhan-chia-se.ts`. Không thêm hạ tầng.
- **B — lời theo cụm sửa trong CMS**: thêm nhóm "Lời nhắn chia sẻ" vào "Chữ dùng chung" / mẫu cụm (ND-7) để ban biên tập
  sửa câu nỗi lo của từng cụm không cần PR. Cần migration Payload.
- **C — AI soạn nháp lời theo cụm** (như trợ lý CMS-2): AI chỉ đề xuất, người duyệt rồi mới vào bảng. **Không** sinh lời
  mỗi lượt bấm (tốn lượt, có thể nói sai dữ kiện, khó kiểm cụm cấm).

## 4. Nút kêu gọi chia sẻ (CTA) chung

Một kiểu nút `NutRuBan` cho mọi thẻ: viền vàng + vệt sáng + biểu tượng tròn vàng + dòng phụ nói rõ thẻ **không có gì riêng
tư** (nỗi sợ lớn nhất khi chia sẻ kết quả bói). Nhãn theo **việc người gửi muốn làm với bạn bè**, không phải "Chia sẻ":

| Thẻ | Nhãn | Dòng phụ |
|---|---|---|
| Hồ sơ | Thách bạn bè đoán số của mình | Đoán xong họ xem được số của chính họ |
| **Lời mời hợp đôi · Hai người** | **Gửi cho người ấy** (chỉ thẻ cặp đôi) | Người ấy nhập ngày sinh là thấy hai bạn hợp nhau ở đâu / Thẻ không ghi tên người kia |
| Thẻ ngày | Rủ bạn bè xem ngày hôm nay | Ai cũng có một con số ngày riêng |
| Xông đất | Gửi cả nhà xem tuổi xông đất | Chỉ có thông tin chung của năm, không có tuổi nhà bạn |
| Nhà | Gửi người nhà xem sơ đồ | Không có địa chỉ, không có năm sinh |
| Quẻ | Rủ bạn gieo một quẻ | Thẻ không có câu bạn hỏi |
| Tarot | Rủ bạn rút bài cùng | Thẻ không có câu bạn hỏi |
| Bản đồ 5 mảng | Thách bạn đoán 5 mảnh ghép | Bạn bè đoán đường đời của bạn trước khi xem |
| Ba lá · Tháng · Huy hiệu | Rủ bạn lật ba lá · Khoe tháng của mình · Khoe huy hiệu | Không có ngày sinh trên thẻ |
| Câu hỏi | Rủ bạn hỏi câu này | Chỉ gửi câu hỏi, không gửi câu trả lời của bạn |
| Trang công khai | Gửi người đang cần đọc | Kèm ảnh tóm tắt có mã QR |

Nhãn thẻ ngày và xông đất sửa được ở CMS ("Chữ dùng chung" `chia_se.the_ngay`, `chia_se.xong_dat`). Đề xuất thử A/B sau:
nhãn "thách" (Thách bạn bè đoán…) vs "rủ" (Rủ bạn xem…) trên thẻ hồ sơ, đo `share_sheet_opened / lượt thấy nút`.

## 5. Đã nối / chưa nối

**Đã nối**: thẻ hồ sơ (`/chia-se`, `/ban-than`), lời mời hợp đôi (`/hop-doi`, trang nhận lời mời), thẻ ngày (trang chủ,
`/hom-nay`), xông đất, huy hiệu, hai người (Tử vi), nhà, quẻ, Tarot, Bản đồ 5 mảng, Ba lá, Tháng của tôi, câu hỏi (hỏi đáp),
trang kiến thức, bài blog CMS, mọi trang có "Trả lời nhanh" (ngày tốt, lịch âm, năm, tuổi làm nhà, xông đất, hướng xấu,
Kỳ Môn, chỉ tay, đồ hình, sinh ở nước ngoài).

**Chưa nối (giữ nút cũ, làm đợt sau)**: chuỗi ngày (`ChuoiNgay`), Hẹn với chính mình, Hôm nay của hai người, Lá bài đầu ngày
(cũ), Tặng một chương, lời mời trong hộp Sao (`LoiMoSao`), ảnh hợp đôi (`TheChiaSeHopDoi`), bài NotFair chưa nhập, bản tiếng Anh.

**Đổi cách đo** (ghi để đọc số cho đúng): thẻ hai người, nhà, quẻ, Tarot trước ghi `share_created` lúc bấm "Tạo thẻ"; nay
khung tạo thẻ ngay khi mở nên `share_created` ghi lúc người dùng **bấm kênh gửi đầu tiên** (một lần mỗi thẻ). Các thẻ khác
giữ như cũ (ghi lúc tạo link).

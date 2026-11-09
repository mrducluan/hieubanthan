# Video 21–27 · Bảy mảng, bảy câu hỏi (Hiểu Bản Thân)

Cập nhật 09/11/2026. Mỗi mảng một video dọc 9:16, dài 44–53 giây, cùng flow với video 6–20:
**Hook (≤ 3 giây) → câu hỏi người dùng → engine tính → câu trả lời → điều bất ngờ → việc nên làm → CTA.**

- **Câu trả lời trong video là câu trả lời thật của engine** (chạy ngày 09/11/2026, đầu vào ghi ở từng video,
  dữ liệu gốc `kich-ban.json`). Đổi câu chữ trong video thì chạy lại engine, không tự viết thêm ý.
- **Nhân vật minh hoạ**: Minh Anh, nữ, sinh 24/10/1988 lúc 9:30 ở Hà Nội. Không phải người thật. Trên màn hình luôn có dòng
  "Nhân vật minh hoạ" / "Một lần gieo minh hoạ" / "Một lần rút minh hoạ".
- Thần số dùng cách tính **"Rút gọn con số"** (mặc định trên web) nên 24/10/1988 ra **đường đời 6**, khớp video 17.
- Vì sao chọn 7 câu này: đều thuộc nhóm hỏi nhiều nhất trong kho câu hỏi có nhãn của engine (Thần số: tình yêu 306 câu, đứng
  thứ hai sau "bản thân"; Kinh Dịch: quyết định + tình cảm; Phong thuỷ: nhà ở 262 câu; Tử vi: thời vận + tiền bạc…) và chưa trùng
  20 video trước.

## Bảng tóm tắt

| # | Mảng | Hook | Điều bất ngờ engine trả về | Link |
|---|---|---|---|---|
| 21 | Thần số học | Bạn không yêu sai người. Có khi bạn đang yêu *sai cách*. | "Bạn cho đi vì người ấy cần, hay vì bạn cần được cần?" | hieuban.com/than-so |
| 22 | Tử vi | Năm 2027, chỗ tiền dễ ra có khi *không phải* chỗ bạn đang lo. | Tiền thuận, nhưng Hoá Kỵ năm vào cung anh em → hạn chế cho vay, đừng đứng tên bảo lãnh | hieuban.com/tu-vi |
| 23 | Bát tự | Đừng hỏi hợp *nghề* gì. Hãy hỏi hợp *vai* gì. | Thất Sát ×3: dám nhận việc khó, nhưng dễ nhận thêm việc vì ngại từ chối | hieuban.com/bat-tu |
| 24 | Kinh Dịch | Hỏi người cũ có quay lại không, hào ra: *bừng cháy, tắt lịm*. | Quẻ Ly hào 4: "nổi lên quá nhanh thì cũng tắt nhanh" → chưa nên vội | hieuban.com/kinh-dich |
| 25 | Phong thuỷ | Giường kê thẳng cửa: sách xưa có cấm không? | Đây là quan niệm dân gian, không có trong cổ thư như một quy tắc | hieuban.com/phong-thuy |
| 26 | Nhân tướng | Nốt ruồi quanh miệng: đoạn cuối mới là quan trọng nhất. | Nốt ruồi đổi màu, đổi cỡ, chảy nước → đi khám da liễu | hieuban.com/nhan-tuong |
| 27 | Tarot | Rút 3 lá, ra cả 3 lá *ngược*. Đừng hoảng. | Lá ngược không phải điềm xấu; "Tôi đi tìm, hay đi trốn?" | hieuban.com/tarot |

## Quy ước chung cho giọng đọc (voice)

- Giọng nữ trẻ hoặc nam trầm, **giọng Bắc chuẩn**, nhịp ~4 âm tiết/giây (thời lượng cảnh trong video nháp đã tính theo nhịp này).
- Đọc **"hieuban chấm com"**, không đánh vần. "2027" đọc **"hai không hai bảy"**. "Thần số" không đọc "thần sổ".
- Đọc rõ: **Hoá Kỵ** (hoá-kỵ), **Thiên Phủ**, **Nhâm** (nhâm, không "nhầm"), **Mậu**, **Thất Sát**, **Cửu Tứ**, **Diên Niên**,
  **Xuất Nạp quan**, **Cốc** (trong "tám Cốc").
- Dấu phẩy trong lời đọc là chỗ ngắt; dấu hai chấm ngắt dài hơn một nhịp.
- Không đổi lời đọc thành "chắc chắn", "sẽ", "chính xác 100%"; không thêm "AI".

## Cách dựng hình (bản nháp đã có) và b-roll

Video nháp `v21.mp4 … v27.mp4` đã dựng xong bằng **hình động tạo sinh bằng code** (trời sao + tinh vân trôi, mỗi mảng một
màu nhấn; hình minh hoạ vẽ theo đúng dữ liệu engine: vòng số 1–9, lá số 12 cung, tứ trụ, sáu hào, la bàn 8 hướng, gương mặt
và bộ vị, ba lá bài lật ngược) + phụ đề + nhạc nền tự tổng hợp. **Chưa có giọng đọc**: lồng voice theo lời ở dưới, thời lượng
từng cảnh đã khớp.

Muốn thay b-roll bằng **hình AI tạo sinh** (Veo / Kling / Midjourney…): prompt ở từng video, dùng làm **nền hoặc chèn 1–2 giây**,
giữ nguyên lớp chữ và hình dữ liệu (lá số, quẻ, lá bài) vì đó là phần "engine tính" — không để AI vẽ lại con số hay quẻ.
Quy tắc prompt chung: dọc 9:16, không chữ trong hình, không mặt người thật nổi tiếng, không biểu tượng tôn giáo cụ thể,
tông đêm xanh lam + vàng sao.

---

## Video 21 · Thần số học · "Vì sao bạn cứ yêu sai người?"

**Engine:** `POST /v1/thanso/hoi` · Nguyễn Minh Anh · 24/10/1988 · Rút gọn con số ·
câu hỏi: "Tình yêu của tôi thế nào, vì sao tôi hay yêu sai người?"

| Cảnh | Giây | Chữ trên màn hình | Lời đọc | Hình |
|---|---|---|---|---|
| 1 Hook | 0–4 | **Bạn không yêu sai người.** / Có khi bạn đang yêu *sai cách*. | Bạn không yêu sai người. Có khi, bạn đang yêu sai cách. | Vòng 9 con số mờ, chữ to dâng lên |
| 2 Hỏi | 4–8 | "Vì sao tôi cứ yêu sai người?" | Mình đem câu hỏi này vào engine Thần số học của Hiểu Bản Thân. | Khung chat gõ chữ, ba chấm "engine" |
| 3 Tính | 8–18 | Đường đời *6* · Linh hồn *9* / 2+4=6 · 1+0=1 · 1+9+8+8=26→8 / 6+1+8=15→6 | Ngày sinh hai mươi tư tháng mười năm một chín tám tám. Rút gọn từng phần rồi cộng lại, ra số đường đời sáu. Nguyên âm trong tên cho số linh hồn chín. | Vòng số, nối 6 ↔ 9 |
| 4 Đáp | 18–26 | Số 6 yêu bằng sự chăm lo / Dễ vấp: bao bọc thành *kiểm soát* / Số 9: dễ yêu *hình ảnh* hơn con người thật | Số sáu yêu bằng sự chăm lo, nhưng dễ bao bọc thành kiểm soát. Còn số linh hồn chín thì dễ yêu hình ảnh, hơn là con người thật. | Thẻ chữ |
| 5 Bất ngờ | 26–33 | "Bạn cho đi vì người ấy cần, hay vì bạn *cần được cần*?" | Rồi engine hỏi ngược lại một câu khá đau: bạn cho đi vì người ấy cần, hay vì bạn cần được cần? | Loé sáng, chữ phóng nhẹ |
| 6 Việc | 33–38 | Hỏi người ấy: họ thấy được yêu qua điều gì, thay vì tự đoán | Việc nên làm: hỏi người ấy họ thấy được yêu qua điều gì, thay vì tự đoán. | Danh sách tích |
| 7 CTA | 38–47 | Con số của bạn nói gì về chuyện yêu? / **hieuban.com/than-so** | Con số của bạn nói gì về chuyện yêu? Vào hieuban chấm com, mục Thần số, nhập tên và ngày sinh. Miễn phí. | Logo + nút link nhịp đập |

**Prompt b-roll AI:** "Vertical 9:16, cinematic night sky, nine softly glowing golden numerals floating in a slow circle,
two of them (6 and 9) connected by a thin line of light, deep indigo nebula, gentle dust particles, no text, dreamy, 4K."
· "Close-up of two hands, one holding a warm cup of tea out to the other, warm lamp light, soft focus, no faces, 9:16."

**Caption** — TikTok: *Bạn không yêu sai người, có khi bạn đang yêu sai cách. Số 6 yêu bằng chăm lo, nhưng dễ bao bọc thành
kiểm soát. Bạn cho đi vì người ấy cần, hay vì bạn cần được cần? Comment số đường đời của bạn nhé 👉 hieuban.com/than-so*
#thansohoc #tinhyeu #duongdoi #hieubanthan ·
Reels: *Thần số học và tình yêu: vì sao mình cứ yêu sai người? Số 6 yêu bằng sự chăm lo nhưng dễ bao bọc thành kiểm soát; số linh hồn 9 dễ yêu hình ảnh hơn con người thật. Xem con số của bạn nói gì về chuyện yêu, miễn phí tại
hieuban.com/than-so (link ở bio). Tag người hay "cho đi" quá nhiều 💛* ·
Shorts: **Vì sao bạn cứ yêu sai người? | Thần số học tình yêu #shorts**

---

## Video 22 · Tử vi · "Năm 2027: tiền dễ ra ở chỗ bạn không ngờ"

**Engine:** `POST /v1/tuvi/hoi` · nữ · 24/10/1988 · 09:30 · Hà Nội · âm lịch Việt Nam · ngày xem 09/11/2026 ·
câu hỏi: "Năm 2027 tiền bạc của tôi thế nào, có nên đầu tư không?"

| Cảnh | Giây | Chữ trên màn hình | Lời đọc | Hình |
|---|---|---|---|---|
| 1 Hook | 0–5 | **Năm 2027** / Chỗ tiền dễ ra, có khi *không phải* chỗ bạn đang lo. | Năm hai không hai bảy, chỗ tiền dễ ra, có khi không phải chỗ bạn đang lo. | Lá số 12 cung mờ |
| 2 Hỏi | 5–10 | "Năm 2027 tiền bạc của tôi thế nào, có nên đầu tư không?" | Câu ai cũng hỏi dịp cuối năm. Mình hỏi engine Tử vi của Hiểu Bản Thân. | Khung chat |
| 3 Tính | 10–20 | Lá số + 3 lớp hạn / Âm lịch Việt Nam · 12 cung / Cung Tài Bạch có *Thiên Phủ*: kho giữ tiền | Engine an lá số theo âm lịch Việt Nam, rồi chồng ba lớp hạn: mười năm, năm Đinh Mùi, và nhịp phụ. Cung tiền bạc có sao Thiên Phủ, cái kho giữ tiền. | Lá số hiện từng cung, Tài Bạch sáng vàng, tâm: "Năm 2027 Đinh Mùi" |
| 4 Đáp | 20–30 | Tiền bạc: *thuận lợi* / Hay có người giúp đúng lúc / Nhưng Hoá Kỵ năm 2027 rơi vào cung *anh em, bạn bè, cộng sự* | Kết quả: năm hai không hai bảy ở mức cân bằng, tiền bạc thuận, hay có người giúp đúng lúc. Nhưng Hoá Kỵ của năm lại rơi vào cung anh em, bạn bè, cộng sự. | Thẻ chữ; mũi tên Kỵ (cam, nét đứt) bay vào cung Huynh Đệ |
| 5 Bất ngờ | 30–37 | Hạn chế *cho vay*. Đừng *đứng tên bảo lãnh* cho người khác. | Nên lời nhắc lại không nằm ở chuyện đầu tư: hạn chế cho vay, và đừng đứng tên bảo lãnh cho người khác. | Loé sáng |
| 6 Việc | 37–45 | Chia nhỏ khoản chi lớn / Giữ quỹ dự phòng vài tháng / *Không phải lời khuyên đầu tư* | Chia nhỏ khoản chi lớn, giữ một quỹ dự phòng vài tháng. Đây không phải lời khuyên đầu tư; việc lớn, hãy tính bằng con số thật. | Danh sách tích |
| 7 CTA | 45–53 | Lá số của bạn nói gì về năm 2027? / **hieuban.com/tu-vi** | Lá số của bạn nói gì về năm hai không hai bảy? Vào hieuban chấm com, mục Tử vi. | Logo + link |

**Prompt b-roll AI:** "Vertical 9:16, an ancient Vietnamese-style astrology chart drawn in gold ink on dark indigo paper, twelve
square houses around a center, slow camera push-in, faint stars drifting, no readable text, 4K." · "Two hands passing an envelope
across a wooden table, one hand hesitating, dim warm light, no faces, 9:16."

**Caption** — TikTok: *Năm 2027, lá số này tiền bạc thuận, nhưng Hoá Kỵ của năm lại rơi vào cung anh em, bạn bè. Lời nhắc:
hạn chế cho vay, đừng đứng tên bảo lãnh. Năm sau bạn định giữ tiền thế nào? 👉 hieuban.com/tu-vi* #tuvi #lasotuvi #tuvi2027
#dinhmui #hieubanthan · Reels: *Tử vi 2027 và tiền bạc: lá số này tiền thuận, hay có người giúp đúng lúc, nhưng lời nhắc lại là hạn chế cho vay, đừng đứng tên bảo lãnh. Đây không phải lời khuyên đầu tư; xem lá số của bạn miễn phí tại
hieuban.com/tu-vi (link ở bio). Gửi cho người hay bị hỏi vay tiền 😅* · Shorts: **Tử vi 2027: tiền dễ ra ở chỗ bạn không ngờ #shorts**

---

## Video 23 · Bát tự · "Đừng hỏi hợp nghề gì, hãy hỏi hợp vai gì"

**Engine:** `POST /v1/battu/hoi` · nữ · 24/10/1988 · 09:30 · Hà Nội · câu hỏi: "Tôi hợp với nghề gì?"
(tứ trụ Mậu Thìn · Nhâm Tuất · Nhâm Tý · Ất Tỵ; Thất Sát xuất hiện 3 lần ở can và bản khí).

| Cảnh | Giây | Chữ trên màn hình | Lời đọc | Hình |
|---|---|---|---|---|
| 1 Hook | 0–4 | **Đừng hỏi mình hợp *nghề* gì.** / Hãy hỏi mình hợp *vai* gì. | Đừng hỏi mình hợp nghề gì. Hãy hỏi mình hợp vai gì. | Bốn cột tứ trụ mờ |
| 2 Hỏi | 4–9 | "Tôi hợp với nghề gì?" | Mình đem câu tôi hợp nghề gì, hỏi engine Bát tự của Hiểu Bản Thân. | Khung chat |
| 3 Tính | 9–20 | Nhật chủ *Nhâm*: nước lớn / Đất *Mậu* chặn dòng nước: xuất hiện *3 lần* / → *Thất Sát* | Ngày giờ sinh đổi ra bốn cột can chi. Người ví dụ có nhật chủ Nhâm, nước lớn. Đất Mậu, thứ chặn dòng nước, xuất hiện ba lần. Trong Bát tự, đó là Thất Sát: áp lực, thử thách. | Bốn cột tô màu ngũ hành, ba ô Mậu · Thìn · Tuất phát sáng cam |
| 4 Đáp | 20–27 | Dám nhận việc khó, việc gấp / mà người khác *né* / Áp lực làm bạn *tỉnh táo hơn* | Điểm sáng: bạn dám nhận việc khó, việc gấp mà người khác né. Áp lực làm bạn tỉnh táo hơn. | Thẻ chữ + tứ trụ |
| 5 Bất ngờ | 27–31 | Nhưng dễ *nhận thêm việc* vì ngại từ chối người trên. | Nhưng cũng dễ nhận thêm việc, chỉ vì ngại từ chối người trên. | Loé sáng |
| 6 Việc | 31–39 | Vai hợp với bạn: thử thách *rõ ràng*, có *thời hạn* · có *quyền quyết* · hỏi rõ phạm vi | Vai hợp với bạn: thử thách rõ ràng, có thời hạn, và có quyền quyết đi kèm. Trước khi nhận, hỏi rõ phạm vi việc. | Danh sách tích |
| 7 CTA | 39–46 | Bạn mạnh ở vai nào? / **hieuban.com/bat-tu** | Bạn mạnh ở vai nào? Vào hieuban chấm com, mục Bát tự. Chương đầu đọc miễn phí. | Logo + link |

**Prompt b-roll AI:** "Vertical 9:16, a strong river current meeting a wall of earth and stones at night, water pushing through
a narrow gap, moonlight, cinematic slow motion, no people, no text." · "Over-the-shoulder shot of a person at a desk late at night
with one lamp, many sticky notes, calm focused mood, face not visible, 9:16."

**Caption** — TikTok: *Đừng hỏi mình hợp nghề gì, hãy hỏi mình hợp vai gì. Bát tự có Thất Sát nhiều: dám nhận việc khó,
nhưng dễ ôm thêm việc vì ngại từ chối. Bạn hay nói "để em làm" không? 👉 hieuban.com/bat-tu* #battu #tutru #nghenghiep
#hieubanthan · Reels: *Bát tự và chọn nghề: thay vì tìm một cái tên nghề, hãy tìm vai hợp mình. Thất Sát nhiều thì hợp vai có thử thách rõ, có thời hạn, có quyền quyết. Chương đầu đọc miễn phí tại hieuban.com/bat-tu (link ở bio). Tag đồng nghiệp hay "để em làm" 🙋* ·
Shorts: **Bát tự: đừng hỏi hợp nghề gì, hãy hỏi hợp vai gì #shorts**

---

## Video 24 · Kinh Dịch · "Người yêu cũ có quay lại không?"

**Engine:** `POST /v1/kinhdich/hoi` · gieo tay minh hoạ 7·8·7·9·8·7 (từ hào 1 lên) → **Ly 離**, hào 4 động → **Bí 賁** ·
câu hỏi: "Người yêu cũ có quay lại với tôi không? Anh ấy chia tay tôi 3 tháng rồi."
(Không ghi giới tính người ấy thì engine hỏi lại "người ấy là nữ hay nam?" — chữ "anh ấy" giúp engine tự chọn.)

| Cảnh | Giây | Chữ trên màn hình | Lời đọc | Hình |
|---|---|---|---|---|
| 1 Hook | 0–6 | **Hỏi người cũ có quay lại không…** / Hào ra đúng mấy chữ: *bừng cháy, tắt lịm*. | Hỏi Kinh Dịch người yêu cũ có quay lại không. Hào chủ ra đúng mấy chữ: bừng cháy, tắt lịm. | Quẻ Ly mờ, hào 4 cam |
| 2 Hỏi | 6–11 | "Người yêu cũ có quay lại với tôi không? Anh ấy chia tay tôi 3 tháng rồi." | Câu hỏi có chữ anh ấy, nên engine biết lấy hào nào đại diện cho người ấy. | Khung chat |
| 3 Tính | 11–18 | Quẻ *Ly*: lửa nối lửa / 3 đồng xu × 6 lần gieo / Hào 4 động → quẻ biến *Bí* | Ba đồng xu, sáu lần gieo. Lần này ra quẻ Ly, lửa nối lửa. Hào thứ tư động, quẻ biến sang Bí. | Ba đồng xu xoay; sáu hào dựng từ dưới lên; hào 4 tách đôi |
| 4 Đáp | 18–25 | 突如其來如，焚如，死如，棄如 / Đột ngột mà đến, *bừng cháy*, *tắt lịm*, bị bỏ rơi / Hiểu đơn giản: nổi lên quá nhanh thì cũng tắt nhanh | Lời hào Cửu Tứ: đột ngột mà đến, bừng cháy, tắt lịm. Hiểu đơn giản: nổi lên quá nhanh, thì cũng tắt nhanh. | Thẻ chữ Hán + dịch |
| 5 Bất ngờ | 25–31 | Nghiêng: *Chưa nên vội* / Người ấy đang ở thế vững, và đang gây sức ép lên bạn | Engine nghiêng về: chưa nên vội. Người ấy đang ở thế vững, và đang gây sức ép lên bạn. | Loé sáng |
| 6 Việc | 31–36 | Câu nên tự hỏi: Người này có làm mình *dễ chịu* khi ở cạnh không? | Câu nên tự hỏi: người này có làm mình dễ chịu, khi ở cạnh không? | Danh sách tích |
| 7 CTA | 36–44 | Bạn gieo thì ra quẻ gì? / **hieuban.com/kinh-dich** | Bạn tự gieo thì sẽ ra quẻ khác. Vào hieuban chấm com, mục Kinh Dịch, gieo thử miễn phí. | Logo + link |

**Prompt b-roll AI:** "Vertical 9:16, three old bronze coins spinning in slow motion above a dark wooden table, warm candle
light, sparks rising, shallow depth of field, no text." · "A single flame flaring up brightly then shrinking to an ember, black
background, slow motion, 9:16."

**Caption** — TikTok: *Hỏi Kinh Dịch người cũ có quay lại không, hào ra: "bừng cháy, tắt lịm". Nổi lên quá nhanh thì cũng tắt
nhanh. Bạn gieo thử ra quẻ gì? 👉 hieuban.com/kinh-dich* #kinhdich #gieoque #nguoiyeucu #hieubanthan · Reels: *Gieo quẻ hỏi người yêu cũ: quẻ Ly, hào 4 động, lời hào nói chuyện bùng lên quá nhanh thì cũng tắt nhanh. Engine nghiêng về: chưa nên vội. Quẻ là tấm
gương để soi, không phải lời phán. Gieo 3 đồng xu online miễn phí tại hieuban.com/kinh-dich (link ở bio).* · Shorts:
**Người yêu cũ có quay lại không? Gieo quẻ Kinh Dịch #shorts**

---

## Video 25 · Phong thuỷ · "Giường đối diện cửa: sách xưa có cấm không?"

**Engine:** `POST /v1/phongthuy/hoi` · nữ · sinh 1988 · câu hỏi: "Giường ngủ đối diện cửa phòng có sao không?"
(mục KB `giuong_sat_cua`, engine ghi rõ "quan niệm dân gian, không có trong cổ thư như một quy tắc"; cung phi nữ 1988 = Chấn).

| Cảnh | Giây | Chữ trên màn hình | Lời đọc | Hình |
|---|---|---|---|---|
| 1 Hook | 0–5 | **Giường kê thẳng cửa phòng.** / Sách xưa có cấm không? Câu trả lời *khá bất ngờ*. | Giường kê thẳng cửa phòng: sách xưa có cấm không? Câu trả lời khá bất ngờ. | Sơ đồ phòng nhìn từ trên, gió từ cửa thổi vào giường |
| 2 Hỏi | 5–8 | "Giường ngủ đối diện cửa phòng có sao không?" | Mình hỏi engine Phong thuỷ của Hiểu Bản Thân. | Khung chat |
| 3 Bất ngờ | 8–14 | Đây là *quan niệm dân gian*. / Không có trong cổ thư như một quy tắc. | Bất ngờ là: engine ghi rõ, đây là quan niệm dân gian, không có trong cổ thư như một quy tắc. | Loé sáng |
| 4 Đáp | 14–20 | Lý do thật rất đời thường / Người đi qua · tiếng mở cửa · *gió lùa* làm giấc ngủ *bị ngắt* | Lý do thật rất đời thường: người đi qua, tiếng mở cửa, gió lùa, làm giấc ngủ bị ngắt. | Thẻ chữ |
| 5 Việc | 20–30 | Việc 0 đồng: xoay giường *lệch* khỏi lối thẳng cửa · đầu giường tựa tường, nằm vẫn *thấy cửa* · phòng trọ chật: rèm hoặc kệ thấp | Việc không tốn đồng nào: xoay giường lệch khỏi lối thẳng của cửa, đầu giường tựa tường, nằm vẫn thấy cửa. Phòng trọ chật, dùng rèm hoặc kệ thấp ngăn ở giữa. | Giường trượt lệch, đổi màu xanh |
| 6 Tính | 30–38 | Nữ 1988 · cung *Chấn* / Đông Nam = *Diên Niên*: hợp đầu giường, phòng ngủ vợ chồng | Còn hướng thì tính theo năm sinh. Ví dụ nữ sinh năm tám mươi tám, cung Chấn: hướng Đông Nam là Diên Niên, hợp đầu giường vợ chồng. | La bàn 8 hướng xoay về, 4 hướng hợp sáng, Đông Nam đậm |
| 7 CTA | 38–45 | 4 hướng hợp tuổi bạn là gì? / **hieuban.com/phong-thuy** | Bốn hướng hợp tuổi bạn là gì? Vào hieuban chấm com, mục Phong thuỷ. | Logo + link |

**Prompt b-roll AI:** "Vertical 9:16, top-down view of a cozy small bedroom at night, a bed slowly sliding sideways away from
the doorway, soft moonlight through a curtain, minimal, no people, no text." · "A bedroom door gently opening, a breeze moving a
light curtain, quiet night, 9:16."

**Caption** — TikTok: *Giường kê thẳng cửa: engine ghi rõ đây là quan niệm dân gian, không có trong cổ thư như một quy tắc. Lý do
thật: gió lùa, tiếng cửa làm ngủ không sâu. Giường nhà bạn kê thế nào? 👉 hieuban.com/phong-thuy* #phongthuy #phongngu
#kegiuong #hieubanthan · Reels: *Giường đối diện cửa phòng: engine ghi rõ là quan niệm dân gian, lý do thật là gió lùa và tiếng ồn. Việc 0 đồng: xoay giường lệch khỏi lối thẳng cửa, đầu giường tựa tường. Xem 4 hướng hợp tuổi
bạn tại hieuban.com/phong-thuy (link ở bio). Gửi cho người đang thuê trọ 🛏️* · Shorts: **Giường đối diện cửa: sách xưa có cấm
không? #shorts**

---

## Video 26 · Nhân tướng học · "Nốt ruồi quanh miệng"

**Engine:** `POST /v1/nhan-tuong/hoi` · không cần ảnh · câu hỏi: "Nốt ruồi ở khoé miệng nói gì?"

| Cảnh | Giây | Chữ trên màn hình | Lời đọc | Hình |
|---|---|---|---|---|
| 1 Hook | 0–5 | **Nốt ruồi quanh miệng.** / Sách tướng xưa nói gì? Đoạn cuối mới là *quan trọng nhất*. | Nốt ruồi quanh miệng, sách tướng xưa nói gì? Đoạn cuối mới là điều quan trọng nhất. | Gương mặt nét mảnh |
| 2 Hỏi | 5–9 | "Nốt ruồi ở khoé miệng nói gì?" | Mình hỏi engine Nhân tướng học của Hiểu Bản Thân. | Khung chat |
| 3 Tính | 9–18 | Xuất Nạp quan / các *bộ vị* · *xuất* là ra, *nạp* là vào · lời nói đi ra, ăn uống đi vào | Sách tướng chia gương mặt thành các bộ vị. Quanh miệng gọi là Xuất Nạp quan: xuất là ra, nạp là vào. Lời nói đi ra, ăn uống đi vào. | Đường tam đình, vùng miệng sáng hồng, chấm nốt ruồi |
| 4 Đáp | 18–25 | Dân gian xem là: có *lộc ăn* · *khéo nói* · ưa ăn ngon / Nhắc nhẹ: *giữ lời đã hứa* | Dân gian xem là người có lộc ăn, khéo nói, ưa ăn ngon. Kèm một lời nhắc nhẹ: giữ lời đã hứa. | Thẻ chữ |
| 5 Tính | 25–30 | Sách xưa còn dặn: nốt sáng, gọn, hơi nổi gọi là *nét sống* | Sách xưa còn phân biệt: nốt ruồi sáng, gọn, hơi nổi, gọi là nét sống. | Gương mặt, vòng sáng quanh nốt |
| 6 Bất ngờ | 30–38 | Đổi màu · đổi cỡ · chảy nước → *đi khám da liễu* / Không xem tướng thay khám | Còn điều quan trọng nhất engine dặn: nốt ruồi đổi màu, đổi cỡ, hay chảy nước, thì đi khám da liễu. Không xem tướng thay cho khám. | Loé sáng |
| 7 CTA | 38–45 | Gương mặt bạn nói gì? / **hieuban.com/nhan-tuong** | Gương mặt bạn nói gì? Vào hieuban chấm com, mục Nhân tướng, tự soi gương sáu bước. | Logo + link |

**Prompt b-roll AI:** "Vertical 9:16, elegant line-art illustration of a calm face drawn in thin gold lines on deep indigo,
three horizontal guide lines dividing forehead, nose and chin, a soft pink glow around the mouth, no real person, no text."
(Không dùng ảnh mặt người thật cho cảnh này.)

**Caption** — TikTok: *Nốt ruồi quanh miệng: sách tướng gọi vùng này là Xuất Nạp quan, dân gian bảo có lộc ăn, khéo nói. Nhưng
nốt ruồi đổi màu, đổi cỡ thì đi khám da liễu nha, không xem tướng thay khám! 👉 hieuban.com/nhan-tuong* #nhantuong #notruoi
#xemtuong #hieubanthan · Reels: *Nốt ruồi quanh miệng: sách tướng gọi là Xuất Nạp quan, dân gian xem là có lộc ăn, khéo nói; kèm lời nhắc giữ lời đã hứa. Nốt ruồi đổi màu, đổi cỡ thì đi khám da liễu. Tự soi gương 6 bước, ảnh không rời máy của bạn, tại hieuban.com/nhan-tuong (link ở bio).* ·
Shorts: **Nốt ruồi quanh miệng: sách tướng xưa nói gì? #shorts**

---

## Video 27 · Tarot · "Có nên nghỉ việc nhận lời mời mới?"

**Engine:** `POST /v1/tarot/xao-bai` (hạt giống cố định `hieuban-video-27`) → `POST /v1/tarot/doc-bai` trải 3 lá thời gian ·
Quá khứ **Tháp** (ngược) · Hiện tại **5 Gậy** (ngược) · Sắp tới **8 Cốc** (ngược) · nghiêng **Chưa nên vội** (điểm −0,50) ·
câu hỏi: "Tôi có nên nghỉ việc để nhận lời mời công việc mới không?"

| Cảnh | Giây | Chữ trên màn hình | Lời đọc | Hình |
|---|---|---|---|---|
| 1 Hook | 0–5 | **Rút 3 lá Tarot, ra cả 3 lá *ngược*.** / Đừng hoảng. Nghe hết đã. | Rút ba lá Tarot, ra cả ba lá ngược. Đừng hoảng, nghe hết đã. | Ba lá bài lộn ngược |
| 2 Hỏi | 5–9 | "Tôi có nên nghỉ việc để nhận lời mời công việc mới không?" | Câu hỏi: có nên nghỉ việc, để nhận lời mời công việc mới không? | Khung chat |
| 3 Tính | 9–19 | Quá khứ · Hiện tại · Sắp tới / Tháp · 5 Gậy · 8 Cốc (đều ngược) / Lá *Sắp tới* tính nặng *gấp đôi* | Trải ba lá: quá khứ, hiện tại, sắp tới. Ra Tháp, năm Gậy và tám Cốc, đều ngược. Engine cân từng lá, lá sắp tới tính nặng gấp đôi. | Ba lá lật lần lượt |
| 4 Đáp | 19–23 | Lá ngược *không phải điềm xấu* / Nó chỉ *đổi chiều* nghĩa của lá | Lá ngược không phải điềm xấu. Nó chỉ đổi chiều nghĩa của lá. | Thẻ chữ |
| 5 Bất ngờ | 23–30 | "Tôi *đi tìm*, hay *đi trốn*?" / Nghiêng: Chưa nên vội · lá nặng nhất: 8 Cốc ngược | Engine nghiêng về: chưa nên vội. Lá nặng nhất là tám Cốc ngược, và nó hỏi bạn: tôi đi tìm, hay đi trốn? | Loé sáng |
| 6 Việc | 30–41 | Trước khi quyết, làm 3 việc: hỏi rõ *lương*, việc, người quản lý · hỏi một người *đang làm* ở đó · so mức sống thật | Trước khi quyết, làm ba việc: hỏi rõ lương, việc cụ thể, người quản lý trực tiếp. Hỏi một người đang làm ở đó. Và so cả mức sống thật, đi lại, giờ làm. | Danh sách tích |
| 7 CTA | 41–47 | Bạn rút được lá gì? / **hieuban.com/tarot** | Bạn rút được lá gì? Vào hieuban chấm com, mục Tarot, hỏi đúng câu của bạn. | Logo + link |

Hình lá bài trong video là **ký hiệu giản lược tự vẽ** (tháp + tia sét, 5 cây gậy, 8 chiếc cốc), không dùng tranh của bộ bài nào.

**Prompt b-roll AI:** "Vertical 9:16, three tarot-style cards face down on a dark velvet table, a hand turning them over one by
one, the cards land upside down, golden dust in candle light, card faces abstract and blank, no text, no brand artwork." ·
"A person's silhouette standing at a doorway between a dim office and a bright street, back to camera, 9:16."

**Caption** — TikTok: *Hỏi Tarot có nên nghỉ việc nhận lời mời mới, ra cả 3 lá ngược 😳 Lá ngược không phải điềm xấu đâu. Lá
8 Cốc hỏi lại: mình đi tìm, hay đi trốn? Bạn rút được lá gì? 👉 hieuban.com/tarot* #tarot #nghiviec #doiviec #hieubanthan ·
Reels: *Có nên nghỉ việc nhận lời mời mới? Ba lá ngược, engine nghiêng về chưa nên vội, và lá 8 Cốc hỏi: mình đi tìm hay đi trốn. Trước khi quyết: hỏi rõ lương, việc cụ thể, người quản lý trực tiếp. Rút bài miễn phí tại hieuban.com/tarot (link ở
bio). Gửi cho đứa bạn đang cầm offer 💼* · Shorts: **Có nên nghỉ việc? Rút 3 lá Tarot, ra cả 3 lá ngược #shorts**

---

## QC đã làm

- **Đúng engine:** mọi câu trả lời, con số, tên quẻ, tên lá, mức "thuận / chưa nên vội" lấy từ kết quả engine chạy thật
  (đối chiếu từng dòng). Đã kiểm tay: 24/10/1988 rút gọn ra 6; Mậu khắc Nhâm cùng dương = Thất Sát; 7·8·7·9·8·7 = Ly, đổi hào 4
  = Sơn Hoả Bí; nữ 1988 cung phi Chấn, Đông Nam = Diên Niên.
- **Đúng web:** Thần số dùng cách tính mặc định của web; Kinh Dịch nói rõ "bạn tự gieo sẽ ra quẻ khác"; Tarot nói rõ đây là
  một lần rút minh hoạ; link đều là trang có thật.
- **Ranh giới nội dung:** không phán ("sẽ", "chắc chắn"); tiền bạc có câu "không phải lời khuyên đầu tư"; sức khoẻ khuyên đi khám
  da liễu (không xem tướng thay khám); quẻ/bài là tấm gương để soi; không xin người xem ghi ngày sinh công khai.
- **Chính tả & giọng:** kiểu dấu theo site ("thuỷ", "hoá"); không dùng cụm "giọng AI"; câu ngắn, đời thường, thuật ngữ đi kèm
  lời giải thích.
- **Hình:** đã duyệt ảnh mốc từng cảnh, sửa 6 lỗi bố cục (hình đè chữ ở cảnh mở, thẻ tràn xuống phụ đề, vệt sáng có mép cứng,
  đồng xu đè tên quẻ…). Chữ và hình chính nằm trong vùng an toàn (tránh cột nút bên phải và mép dưới của TikTok/Reels).

## Gợi ý đăng

- **Ngay:** 22 (Tử vi 2027 — đúng mùa cuối năm), 24 (người yêu cũ — hay được gửi cho bạn), 27 (nghỉ việc — cuối năm hay nhận offer).
- **Tối thứ 6 – chủ nhật:** 21, 24 (chủ đề tình cảm, dễ tag bạn bè).
- **Lúc nào cũng được:** 23, 25, 26.
- Comment chỉ xin con số / quẻ / lá bài / lựa chọn; không xin ngày sinh.

## Dựng lại

```bash
cd video-ngan/v21-27
node dung.mjs ../xuat            # toàn bộ 7 video (≈ 15–20 phút)
node dung.mjs ../xuat v24        # một video
node dung.mjs ../duyet --anh     # chỉ xuất ảnh mốc từng cảnh để duyệt
```

Cần: Node + Playwright (Chromium), ffmpeg, python3. Sửa lời / chữ ở `kich-ban.json`; hình ở `khung.html`; nhạc nền ở `am-thanh.py`.

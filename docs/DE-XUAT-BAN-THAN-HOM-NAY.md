# Đề xuất: trang Bản thân, trang Hôm nay và "Lá bài đầu ngày" (BT-UI)

Ngày 10/11/2026. Trạng thái: **mục 1, 2, 3, 4 đã làm** (chủ dự án duyệt cả ba hướng em chọn, 10/11/2026); mục 5 chờ chọn.

## 0. Đã làm so với đề xuất — chỗ khác

- **Ba lá**: lật đủ ba hiện khối **"Ba lá ghép lại"** (Mang theo · Việc nhỏ · Thời điểm) thay cho "Câu của ngày" — câu ghép
  `tom_lai` đã là câu chính của thẻ ngày ngay bên cạnh, hiện lần hai là lặp. Lá Con số không in lại nghĩa ngày cá nhân
  (thẻ ngày đã in) mà in việc nhỏ + câu hỏi riêng.
- **Nhật ký tháng**: không thêm migration — ba lá ghi vào ba mã lá cũ (`MA_NHAT_KY`), tổng kết tháng đếm "ngày có lật lá".
  Dòng "lá Tarot gặp nhiều nhất" chưa làm (cần lưu mã lá theo ngày).
- **Bản thân**: tám ô = bảy môn + ô "Chân dung tổng hợp" (kín lưới 4 × 2). Ô Tarot không lộ lá khi chưa lật ở Hôm nay.
  Khối "Nhịp hiện tại" giữ nguyên (đã gọn từ QH-BT). Ba ô lối tắt cuối trang thành một hàng link.
- **Buổi tối**: "Hôm nay thế nào?" chỉ hỏi khi ý định được chọn trước 16 giờ và đồng hồ máy đã qua 18 giờ.
- Engine cũ chưa trả `ba_la` (deploy lệch) → web tự giữ Lá bài đầu ngày một lá như trước.
- **Riêng tư (rà soát độc lập trước khi merge)**: lá Tarot riêng được chọn bằng phép băm công khai từ ngày xem + ngày sinh, nên
  đưa lá lên thẻ thì hai, ba thẻ là đủ dò ra ngày sinh. Đã sửa: lá riêng chỉ lên thẻ và lời nhắn soạn sẵn khi máy chủ engine
  có khoá bí mật `LA_NGAY_MUOI`; chưa đặt thì thẻ vẽ lá Tarot úp (con số và quẻ vẫn hiện).

## 1. Đã làm trong đợt này (không cần duyệt thêm)

- **Đầu trang `/ban-than`**: lời chào trải hết bề ngang; bên dưới là hai cột cao bằng nhau. Cột trái là thẻ "Hồ sơ bản thân",
  cột phải là "Bài đọc đầy đủ" + bốn ô (Xem hợp đôi · Chân dung tổng hợp · Thời gian tới · Sửa hồ sơ) + dòng huy hiệu.
  Không còn khoảng trống trên và dưới cột phải; mép trái thẳng với các mục phía dưới.
- **Chia sẻ ngay trên thẻ**: nút "Chia sẻ thẻ" nằm trong thẻ. Bấm một lần → hiện mã QR (bạn bè quét tại chỗ là mở thẻ) +
  "Gửi link" · "Chép link" · "Tải ảnh" (ảnh dọc có sẵn QR + hieuban.com). Thẻ vẫn chỉ mang tên hiển thị + bốn con số,
  không ngày sinh. Đo: `share_created{kind=card, nguon=ban_than}` → `share_clicked` → `referral_signup`.
- Test: `web/e2e/ban-than-ui.spec.ts` (hai cột cao bằng nhau, QR đúng link thẻ, ảnh PNG, điện thoại không tràn ngang).

## 2. Trang `/ban-than` — rà soát và ba hướng

### Chỗ chưa hợp lý

1. Trang "của tôi" nhưng chỉ nói bằng thần số. Người đã nhập giờ sinh không thấy gì từ Tử vi, Bát tự, Phong thuỷ ở đây.
2. Khối "Nhịp hiện tại" (ngày, tháng, năm cá nhân) lặp gần hết trang Hôm nay.
3. Không cho biết hồ sơ còn thiếu gì (giờ sinh, nơi sinh, nhà, khảo sát tướng) và thiếu thì mất phần nào.
4. Việc dang dở nằm rải rác: chương còn khoá, quẻ đã gieo, trải bài Tarot, nhà đã lưu, người thân đã lưu.
5. Ba ô lối tắt cuối trang chung chung, không dựa vào hồ sơ.

### Ba hướng

| | A. "Bảy cách nhìn về bạn" | B. "Lịch của tôi" | C. "Điều tôi đã xác nhận" |
|---|---|---|---|
| Ý chính | Lưới ô theo mảng; mỗi ô một câu đã tính riêng cho người đó + trạng thái "Sẵn sàng / cần giờ sinh" | Một dòng thời gian: hôm nay → tuần → tháng → năm, ghép thần số + tháng Tử vi + tiết khí + ngày đẹp | Chân dung lớn dần từ các hộp người dùng bấm "Đúng với mình", ký ức, bài đã lưu |
| Lấy từ engine | `/v1/goi-y-cheo` (đã có: đường đời, chính tinh cung Mệnh, nhật chủ, cung phi, quẻ ngày…) | `/v1/thoi-gian-toi` (hộp tháng nhiều lớp), `/v1/thanso/nhip` | `/v1/giao-thoa` (đã có), phiếu của chính người xem |
| Có ích cho người dùng | Một màn hình thấy mình qua nhiều môn; biết bước kế tiếp ở từng môn | Biết tháng này nên làm gì | Thấy điều mình tự kiểm chứng, tin hơn |
| Điểm yếu | Cần viết gọn để không thành "menu" thứ hai | Trùng `/hom-nay` và `/thoi-gian-toi` | Người mới chưa có phiếu → khối trống |
| Khâu đẩy | QUAY LẠI + NẠP (mở chương từng môn) | QUAY LẠI | QUAY LẠI + HỌC |
| Công sức | Vừa (web là chính) | Vừa | Nhỏ, nhưng ít người thấy |

### Em chọn: A làm xương sống, ghép một phần C

Thứ tự trang sau khi làm:

1. Thẻ hồ sơ + chia sẻ (đã xong).
2. **"Bảy cách nhìn về bạn"**: mỗi mảng một ô — tên mảng, một câu đã tính cho chính người đó, nút "Đọc tiếp". Mảng thiếu
   dữ liệu ghi rõ thiếu gì và mở đúng ô cần nhập ("Thêm giờ sinh để có lá số Tử vi"). Nhân tướng và Tarot (không tính từ
   ngày sinh) hiện trạng thái trên máy: đã khảo sát chưa, lá của ngày.
3. **"Đang dang dở"**: tối đa ba dòng, lấy từ máy người dùng — chương còn khoá, quẻ gần nhất, trải bài gần nhất, nhà đã lưu.
4. **"Điều bạn đã xác nhận"**: chỉ hiện khi có từ hai phiếu "Đúng với mình" trở lên (lớp giao thoa đã có).
5. Nhịp: rút còn một dòng "Hôm nay: Ngày cá nhân N — …" dẫn sang `/hom-nay`; tháng và năm giữ như cũ.
6. Tổng kết tháng, huy hiệu, nhiệm vụ Sao như cũ. Bỏ ba ô lối tắt cuối (đã có ở mục 2).

Không cần migration, không dependency. Engine: chỉ thêm trường "thiếu gì" nếu `goi-y-cheo` chưa trả đủ (test viết trước).
Đo: `hub_viewed` → `cross_cta_clicked{tu: ban_than, den}`; tỉ lệ người có hồ sơ thần số bổ sung giờ sinh.

## 3. "Lá bài đầu ngày" — ba hướng

### Vì sao lá hiện tại yếu

- Chỉ một trong ba loại (việc nhỏ · câu hỏi · giờ tốt), mỗi loại một câu.
- Lá "Giờ tốt" lấy giờ hoàng đạo **đầu tiên** của ngày — thường là giờ Tý (0:00–0:59), người xem buổi sáng không dùng được,
  lại trùng nút "Giờ hoàng đạo" ngay đầu trang.
- Chia sẻ dùng thẻ ngày chung, không có hình lá vừa lật.
- Engine đã có **lá Tarot riêng của ngày** theo ngày sinh (`POST /v1/tarot/la-ngay`) và web có sẵn hình 78 lá, nhưng trang
  Hôm nay chưa dùng.

### Ba hướng

| | A. Một lá Tarot của ngày | B. "Ba lá của ngày" | C. Một lá, lật ra cả bảng |
|---|---|---|---|
| Ý chính | Thay lá hiện tại bằng lá Tarot riêng: hình, ba từ khoá, ý chính, một việc, câu tự soi | Ba lá úp: **Lá Tarot** · **Lá Con số** · **Lá Thời khắc**; lật đủ ba hiện "Câu của ngày" | Một lá; mặt sau là bảng dài gồm Tarot + số + giờ + nên/kiêng |
| Lấy từ engine | Tarot | Tarot + thần số (ngày cá nhân, việc nhỏ, câu hỏi thêm) + hoàng lịch (giờ tốt sắp tới, một việc nên) + quẻ đầu ngày + `tom_lai` | Như B |
| Tò mò | Một lần lật | Ba lần lật, có phần thưởng nội dung khi đủ ba | Một lần lật |
| Chia sẻ | Ảnh một lá | Ảnh ba lá cạnh nhau + QR — dễ nhận ra, dễ hỏi "của bạn là gì?" | Khó thành ảnh |
| Điểm yếu | Tarot đứng một mình, chưa "dựa vào toàn bộ engine" | Nhiều việc hơn; phải giữ đúng ranh giới (dưới đây) | Lặp lại gần hết nội dung trang |

### Em chọn: B — "Ba lá của ngày"

- **Lá Tarot của bạn**: lá riêng theo ngày sinh + ngày xem (engine chọn tất định, luôn đọc xuôi). Mặt sau: hình lá, tên,
  ba từ khoá, ý chính, một việc làm được hôm nay, câu tự soi, link "Rút trải bài ba lá cho một câu hỏi" → `/tarot`.
- **Lá Con số**: ngày cá nhân hôm nay + việc nhỏ nên thử (theo ý định đã chọn nếu có) + câu hỏi riêng của ngày.
- **Lá Thời khắc**: giờ hoàng đạo **sắp tới tính từ lúc đang xem** (web chỉ chọn trong danh sách engine trả, không tự tính)
  + một việc "nên" và một việc "kiêng" của hoàng lịch + tên quẻ đầu ngày kèm một câu "Hiểu đơn giản".
- Lật đủ ba → **"Câu của ngày"**: câu `tom_lai` engine đã ghép, đặt trong khung nổi bật + nút chia sẻ.
- **Thẻ chia sẻ "Ba lá của tôi hôm nay"**: ảnh ba lá + QR + hieuban.com; mã ký riêng (tên hiển thị, mã lá Tarot, số ngày,
  ngày xem — không ngày sinh); máy chủ gọi engine tính lại rồi mới ký, như các thẻ khác. Trang nhận mời "Lật ba lá của bạn".
- Tổng kết tháng thêm một dòng thì quá khứ: "Tháng trước bạn lật N lá; lá Tarot gặp nhiều nhất: …" (chỉ đếm trên máy).

Ranh giới giữ nguyên (không thành gacha): tất định theo hồ sơ + ngày, miễn phí, không giải thưởng, không khoá lá sau nút
chia sẻ, không đếm ngược, không chữ "trúng / quay". Lá Tarot không dự báo, lá ngược không dùng ở đây. Lời hoàng lịch ghi
"tham khảo văn hoá".

Engine: một hàm RULES mới ghép ba lá từ dữ liệu đã có (`luangiai/ba_la_ngay.py`, test viết trước) + trường trong
`/v1/thanso/hom-nay`; không đổi phép tính → không tăng `ENGINE_VERSION`. Không migration, không dependency.
Đo: `daily_card_flipped{kind: tarot|so|thoi_khac, thu_tu}`, tỉ lệ lật đủ ba, `share_created{kind=ba_la}` →
`share_clicked{bl}` → `referral_signup`, `cross_cta_clicked{tu: la_bai, den: tarot}`.

## 4. Trang `/hom-nay` — rà soát và ba hướng

### Chỗ chưa hợp lý

1. Khoảng 20 khối ngang hàng nhau. Trên điện thoại, phần tương tác chính "Hôm nay bạn định làm gì?" đứng thứ 12, sau cả
   "cài app" và "bật nhắc".
2. Bốn câu "tự soi" (ngày cá nhân, Bát tự, quẻ, ý định) + ba "câu hỏi nổi bật" — quá nhiều câu hỏi cho một buổi sáng.
3. Mỗi môn nói một ý riêng; câu ghép `tom_lai` có nhưng nằm chìm giữa thẻ.
4. "Ngày chung của mọi người" và "Theo phái Chaldea" là thông tin phụ nhưng chiếm chỗ như khối chính.
5. Giờ hoàng đạo liệt kê cả sáu giờ, không cho biết giờ nào còn ở phía trước.
6. Tarot chưa có mặt.

### Ba hướng

| | A. Ba tầng | B. Sáng – trưa – tối | C. Thẻ theo từng môn (tab) |
|---|---|---|---|
| Ý chính | Tầng 1 "10 giây"; tầng 2 "Việc của tôi hôm nay"; tầng 3 "Đọc thêm" gập sẵn | Nội dung đổi theo buổi; tối có câu hỏi "hôm nay thế nào?" | Mỗi môn một tab |
| Có ích | Vào là thấy điều chính; phần tương tác lên cao; người muốn sâu vẫn có | Lý do quay lại hai lần một ngày | Gọn mắt |
| Điểm yếu | Phải chọn kỹ cái gì gập | Engine chưa có nội dung theo buổi → phải viết KB mới | Giấu nội dung, mất phần ghép các môn |
| Khâu đẩy | QUAY LẠI + MỜI | QUAY LẠI | — |

### Em chọn: A, lấy thêm một mảnh nhỏ của B

- **Tầng 1 — trong 10 giây**: dòng ngày (dương, âm, hoàng đạo) → thẻ ngày cá nhân với `tom_lai` làm câu chính → "Ba lá của
  ngày" → một chip **"Giờ tốt sắp tới: giờ Ngọ 11:00–12:59"**.
- **Tầng 2 — việc của tôi hôm nay**: ý định (chọn / gõ) + đánh giá hoàng lịch cho đúng việc đó + ngày hợp gần nhất. Trên
  điện thoại lên vị trí thứ ba.
- **Tầng 3 — đọc thêm (gập)**: Nhịp Bát tự · Quẻ đầu ngày + quẻ riêng · Hoàng lịch đầy đủ · Tháng và năm · Ngày chung +
  Chaldea. Mỗi dòng gập hiện sẵn một câu tóm tắt để vẫn đọc lướt được.
- **Dải việc nhỏ** (một hàng gọn cuối tầng 1): chuỗi ngày, bật nhắc, cài app, hỏi lại hôm qua, nhà tháng này — thay cho năm
  khối rời.
- Mảnh của B: sau 18 giờ, khối "Hỏi lại hôm qua" đổi thành **"Hôm nay thế nào?"** cho chính ngày đang xem (cùng phiếu kiểm
  chứng ẩn danh đang dùng, không migration).
- Chỉ giữ một câu tự soi ở tầng 1; các câu còn lại nằm trong phần gập của từng môn.

Đo: `daily_intent_set` (kỳ vọng tăng khi lên cao), `reading_completed{mo_dun=hom_nay}`, lượt mở từng mục gập
`chart_interacted{kind=hom_nay_mo, muc}` để biết mục nào đáng đưa lên.

## 5. Ý tưởng thêm — đã làm (đợt 2, 10/11/2026)

1. **"Hôm nay của hai người"** (mục gập ở Hôm nay): chọn một người thân đã lưu trên máy → ngày cá nhân của hai người, bốn kiểu
   nhịp (cùng số · cùng hướng ra · cùng hướng vào · lệch nhịp), một việc nên làm cùng, câu tự soi. Không chấm điểm. Engine
   chỉ nhận ngày + tháng sinh của người kia (năm chỉ khi nhập âm lịch), không tên, không lưu. "Gửi cho người ấy" dùng thẻ
   ngày sẵn có của chính người gửi + lời nhắn hai con số (không làm loại thẻ mới — thẻ mang số của người thứ hai cần rà riêng).
2. **Thẻ hồ sơ hai mặt** (Bản thân): nút "Mặt sau: thẻ 5 mảnh ghép làm nên tôi" ngay trên thẻ → mở khung tạo thẻ Bản đồ 5 mảng
   (đã có từ CTA-1) dưới hai cột.
3. **Lối tắt app** "Ba lá hôm nay" (`/hom-nay?tu=app#ba-la`) trong manifest.
4. **"Tuần này của bạn"** (mục gập đầu "Đọc thêm" ở Hôm nay, mở sẵn vào thứ Hai): bảy ngày (số ngày cá nhân, ngày lịch ghi
   đẹp, hợp / xung tuổi) + tối đa ba ngày đáng để ý còn lại trong tuần (thuận nhất · hợp tuổi · nên đi chậm · mở đầu · khép lại).
   **Đợt 3 (2026-11-10, anh duyệt)**: gửi qua thông báo sáng thứ Hai — mốc `tuan_cua_toi` (migration 0036, người dùng tự
   tích ở Bật nhắc), engine `/v1/push/tuan`, bấm thông báo mở đúng mục này.
5. **Lá Tarot trong tổng kết tháng**: lật lá Tarot thì nhật ký trên máy ghi mã + tên lá; tổng kết tháng kể "Lá Tarot bạn gặp
   nhiều nhất: … (N lần)" khi có lá lặp lại, không thì kể tên tối đa ba lá. Mã lá chỉ nằm trên máy (máy chủ không giữ).

## 6. Thứ tự đề xuất

1. "Ba lá của ngày" + thẻ chia sẻ (mục 3) — tác động lớn nhất tới quay lại và mời.
2. Trang Hôm nay ba tầng (mục 4) — làm liền sau vì cùng trang.
3. Trang Bản thân "Bảy cách nhìn" (mục 2).

Mỗi bước một PR, deploy engine trước web.

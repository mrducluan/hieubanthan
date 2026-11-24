# Chiến lược Google Ads cho hieuban.com (23/11/2026)

Gộp từ 3 agent: nhu cầu tìm kiếm (số Search Console thật), kiến trúc chiến dịch, câu chữ quảng cáo + trang đích.
Khâu vòng tăng trưởng: **THU HÚT → NẠP Sao**. Đo: `landing_viewed{qc=google}` → `profile_created` → `unlock_clicked` →
`checkout_started` → `payment_succeeded`.

## 0. Kết luận trước

1. **Google Ads phải lấp đúng chỗ SEO chưa có**: cụm từ khoá cá nhân có tiền ("lá số tử vi của tôi", "xem bát tự theo
   ngày giờ sinh", "thần số học theo tên và ngày sinh", "tử vi 2027 theo ngày sinh"). Search Console 90 ngày: các cụm này
   gần như 0 hiển thị. Lưu lượng SEO hiện có là truy vấn thông tin ("1991 mệnh gì": 113 truy vấn, 159 hiển thị, 0 nhấp) —
   **không mua lại lưu lượng này bằng tiền**.
2. **Chưa được chi tiền ngay.** Đo lường Google Ads hiện gần như mù (mục 2). Chạy bây giờ sẽ lặp lại Meta: tiêu tiền, 0 đơn,
   không biết rơi ở đâu.
3. **Bỏ ưu đãi 30/11 cho Google**: còn 7 ngày, đo lường chưa xong, Google duyệt mất 1 ngày. Chạy Google từ **01/12**, đúng
   lúc mùa "tử vi 2027" bắt đầu lên (Tết 06/02/2027).
4. **Phễu chưa hoà vốn** với số hiện tại: CPC 2.000 ₫ × 25 % ra Lead × 3 % mở khoá trả tiền × 50 % → ~1 đơn / 267 nhấp ≈
   530.000 ₫ cho một đơn 59–99k. Hai tuần đầu là để **đo phễu với khách có ý định cao**, không phải để lãi. Cần Lead →
   checkout ≥ 8–10 % mới gần hoà vốn.

## 1. Thói quen tìm kiếm (Search Console thật, 25/08 → 22/11/2026)

| Điều thấy được | Số | Dùng vào |
|---|---|---|
| Điện thoại | 68 % nhấp | Giảm giá thầu máy tính −50 %; trang đích ô nhập trong màn đầu |
| Việt Nam | 96 % nhấp | Vị trí: Việt Nam, "Sự hiện diện" |
| Giờ | đỉnh 19–23h, đợt phụ 8–10h, thấp 1–6h | Sau 2 tuần có số thì giảm 0–6h |
| Cách gõ | năm sinh + con giáp + "nam/nữ mạng" + 2027; không dấu; "ko/j"; chữ "xem" đứng đầu | Nhóm quảng cáo có cả con giáp lẫn năm sinh, có/không dấu |
| Hiển thị | 710 → 1.400 → 1.507 (nửa tháng → tuần) | SEO đang lên, để SEO lo trang thông tin |

Lịch mùa (ước lượng): 01–20/12 "tử vi 2027", "làm nhà 2027" lên · 20/12–25/01 đỉnh "tử vi 2027 tuổi…", "sao hạn 2027" ·
15/01–05/02 đỉnh "xông đất", "ngày tốt khai trương" · sau Rằm Giêng (20/02) giảm mạnh.

## 2. Giai đoạn 0 — đo lường (24/11 → 30/11, 0 ₫ quảng cáo) — CẦN ANH QUYẾT + SỬA CODE

Hiện trạng (đọc code):
- `DoLuongGoogle.tsx`: `ad_storage`, `ad_user_data`, `ad_personalization` luôn **denied** → không cookie `_gcl_aw`, không
  lưu gclid, Google chỉ có chuyển đổi ước tính (với site nhỏ ≈ 0).
- `lib/do-luong.ts` chỉ gửi PostHog + Meta, **không đẩy gì vào `dataLayer`** → GTM không thấy `profile_created`…
- PERF-2 hoãn gtm.js 8 giây → người vào rồi đi nhanh mất gclid.
- Thanh toán Pay2S báo về máy chủ → Purchase trên trình duyệt hụt khi khách đóng tab sau khi quét QR.

| # | Việc | Ai | Ghi chú |
|---|---|---|---|
| G0-1 | Consent Mode: `ad_storage` + `ad_user_data` mặc định **granted** (như GA4 đã quyết 2026-10-09), "Từ chối" → denied; `ad_personalization` **giữ denied** | **Anh quyết** → em sửa | Cập nhật Chính sách riêng tư (Google Ads là bên nhận), ngày hiệu lực mới |
| G0-2 | `ghi()` đẩy sự kiện vào `dataLayer` (chỉ mã + giá trị, không tên/ngày sinh) | Em | Không thêm thư viện |
| G0-3 | Bắt `gclid`/`gbraid`/`wbraid` ngay trong đoạn khởi động (trước khi hoãn gtm và trước khi làm sạch URL), giữ 90 ngày | Em | Chỉ khi ad_storage granted |
| G0-4 | Lưu gclid cùng đơn nạp → cron ngày xuất chuyển đổi offline (Purchase, VND thật) | Em, **migration mới có .down** | Không dùng email (giữ chủ trương như Meta) |
| G0-5 | `qc=google` cho PostHog (như `qc=meta`) | Em | Khung phễu riêng ở /quan-tri/tang-truong |
| G0-6 | H1 đổi theo `?kw=<mã>` từ **danh sách mã cố định** (không in chữ người dùng gõ) | Em | Canonical giữ nguyên, không ảnh hưởng SEO |
| G0-7 | Dòng giá trên màn đầu /tu-vi, /bat-tu, /than-so, /thoi-gian-toi: "Miễn phí: … · Bản đủ: 99 Sao ≈ 99.000 ₫" | Em | Giá trong quảng cáo phải khớp trang, không thì Google từ chối |
| G0-8 | /tuoi-xong-dat/2027: nút "Xem năm 2027 của riêng bạn" ngay dưới bảng → /thoi-gian-toi?nam=2027 | Em | |
| G0-9 | GTM: Conversion Linker mọi trang + thẻ chuyển đổi từng sự kiện; liên kết GA4 ↔ Ads | **Anh** (trong GTM) | Em ghi từng bước khi code xong |
| G0-10 | Kiểm bằng Tag Assistant: `?gclid=TEST`, đi hết phễu | Anh + em | |

Chuyển đổi trong Google Ads:

| Sự kiện | Vai trò | Giá trị |
|---|---|---|
| profile_created ("Lead") | **Chính** giai đoạn 1, đếm "Một" | 5.000 ₫ quy ước |
| unlock_clicked (bấm Mở toàn bộ) | Phụ → Chính nếu checkout quá ít | ~10 % giá báo cáo |
| checkout_started | Phụ → Chính giai đoạn 2 | ~30 % giá trị đơn |
| purchase (offline, đơn đã trả) | **Chính** khi đủ số, đếm "Mọi" | VND thật |

## 3. Cấu trúc tài khoản

Thiết lập chung: Việt Nam "Sự hiện diện" · tiếng Việt (+ tiếng Anh) · **chỉ Mạng Tìm kiếm** (bỏ đối tác, bỏ Display) ·
tắt tài sản tự động / mở rộng URL / gợi ý tự áp dụng · máy tính −50 % · đối tượng chỉ "Quan sát" · 24/7 hai tuần đầu.

| Chiến dịch | Nhóm quảng cáo | Trang đích | Ngân sách GĐ1 |
|---|---|---|---|
| S-TuVi | lập lá số tử vi · lá số tử vi trọn đời (`kw=tron-doi`) · luận giải tử vi chi tiết (`kw=luan-giai`) | `/tu-vi?kw=…` | 30k |
| S-BatTu | mệnh thiếu hành gì (`kw=thieu-hanh`) · xem bát tự theo ngày giờ sinh · lá số tứ trụ (`kw=tu-tru`) | `/bat-tu?kw=…` | 25k |
| S-ThanSo | thần số học theo tên và ngày sinh · tra cứu thần số học · con số chủ đạo | `/than-so?kw=ngay-sinh` | 25k |
| S-2027 | tử vi 2027 theo ngày sinh · vận hạn 2027 của tôi | `/thoi-gian-toi?nam=2027&kw=2027` | 40k |
| S-2027-Tuoi (rẻ, lấy tệp) | tử vi 2027 tuổi … · tuổi xông đất 2027 · sao hạn 2027 · tuổi làm nhà 2027 | `/nam/2027/tuoi-{năm}` · `/tuoi-xong-dat/2027` · `/xem-sao-han/2027` · `/xem-tuoi-lam-nha/2027` | 10k (tăng ở GĐ2) |
| S-ThuongHieu | hieuban, hiểu bản thân | `/` | 5k |

- Mỗi nhóm 3–8 từ khoá cùng ý, **[khớp chính xác] + "khớp cụm từ"**, có/không dấu. **Không khớp rộng** trước khi có ≥ 30
  chuyển đổi. Từ khoá "theo ngày sinh" (không chữ giờ) → /than-so hoặc /thoi-gian-toi, không đẩy vào /tu-vi (bắt giờ sinh).
- **Không chạy**: "X mệnh gì / con gì", lịch âm, "2027 có nhuận không", "là gì", ý nghĩa lá Tarot, trang quẻ — để SEO.
- **Không dùng /goi-xem làm trang đích** (người lạ gặp bảng giá thì thoát) — chỉ làm sitelink.

## 4. Lộ trình

| Giai đoạn | Thời gian | Chiến lược giá | Ngân sách | Chuyển khi |
|---|---|---|---|---|
| 0 Đo lường | 24–30/11 | — | 0 | Tag Assistant thấy đủ sự kiện |
| 1 Search khớp chính xác | 01–14/12 | **Manual CPC** hoặc Tối đa hoá lượt nhấp có trần: đuôi dài 1.500–2.500 ₫, cụm "2027" ~3.000 ₫ | ~135k/ngày | ≥ 30 Lead / 30 ngày |
| 2 Smart Bidding + Tết | 15/12 → 06/02 | Tối đa hoá chuyển đổi → tCPA ≈ 1,2 × cost/Lead sau 2 tuần ổn định; ≥ 15 checkout/30 ngày thì chuyển chính sang checkout | S-2027 100k (tháng 12) → 200k (10/01–05/02); 25/01–06/02 dùng Seasonality adjustment | ≥ 30 Purchase / 30 ngày |
| 3 Mở rộng | sau Tết | tROAS bắt đầu ~150 %; PMax (tắt mở rộng URL, chỉ trang tiền), Demand Gen | theo ROAS | — |

Quy tắc tắt: nhóm chi ≥ 3 × cost/Lead mục tiêu mà 0 Lead → dừng · CTR < 3–4 % sau 300 hiển thị → viết lại quảng cáo ·
Lead → checkout < 2 % sau 100 Lead → **ngừng tăng ngân sách, sửa trang/giá** (lỗi không nằm ở quảng cáo) ·
07/02 tắt nhóm xông đất; "tử vi 2027", "sao hạn 2027" giữ tới ~07/03.

## 5. KPI

| Chỉ số | Mốc | Không đạt thì |
|---|---|---|
| CTR khớp chính xác | ≥ 8 % | < 4 % sau 300 hiển thị: viết lại RSA |
| CPC | ≤ 2.500 ₫ | luôn sát trần: chuyển sang đuôi dài |
| Nhấp → Lead | ≥ 25 % | < 10 %: lỗi trang đích, không phải giá thầu |
| Cost/Lead | ≤ 10.000 ₫ | > 20.000 ₫ sau 10 Lead: dừng nhóm |
| Lead → checkout | ≥ 3 % (mục tiêu 8–10 %) | < 2 % sau 100 Lead: sửa phễu |
| checkout → trả tiền | ≥ 40 % | thấp: QR/Pay2S hoặc tin cậy |
| ROAS | ≥ 100 % tháng 1, mục tiêu 150 % | < 70 % sau 30 đơn: thu về nhóm có đơn |

Mỗi tuần: search terms report (thêm từ khoá đúng ý, thêm phủ định) · đối chiếu Google Ads ↔ PostHog `qc=google` ↔ đơn
đã trả (lệch > 30 % thì sửa đo lường trước) · tình trạng duyệt quảng cáo · impression share mất do thứ hạng thì sửa
Quality Score, không tăng giá thầu · giá trong price asset vẫn khớp /goi-xem.

## 6. Chính sách Google + ranh giới dự án

- Google **cho phép** quảng cáo tử vi, chiêm tinh; luật Quảng cáo VN cấm mê tín → khung "hiểu bản thân, tham khảo văn hoá,
  sách xưa ghi".
- **Không dùng**: "chính xác", "100 %", "tốt nhất / số 1", "thay đổi vận mệnh", "giải hạn", "cúng sao", "năm hạn",
  "coi chừng", "xui", "bói", "thầy", "linh nghiệm", "đoán đúng tương lai"; câu gợi hoàn cảnh khó khăn ("Bạn đang bế tắc?",
  "nợ nần?") — vi phạm nhóm nhạy cảm của quảng cáo cá nhân hoá.
- "Miễn phí" chỉ gắn phần thật sự miễn phí (lá số, chương đầu, 4 số chính, 3 tháng tới, bảng xông đất).
- Giá trong quảng cáo luôn là VND. Không đồng hồ đếm ngược.
- Danh sách tiếp thị lại có thể bị Google hạn chế (site tâm linh, giống Meta xếp "Religion + Personal hardship") — kiểm trong
  Trình quản lý đối tượng trước giai đoạn 3.

## 7. Từ khoá phủ định (khớp cụm từ, có + không dấu)

- Tải / học: tải, download, apk, app, ứng dụng, phần mềm, pdf, ebook, sách, giáo trình, khoá học, học, dạy.
- Kiến thức: là gì, ý nghĩa của, định nghĩa, wiki, nguồn gốc, công thức, cách tính tay.
- Việc / địa điểm: tuyển dụng, việc làm, lương, thầy, thầy bói, địa chỉ, gần đây, chùa, phủ, quận, hà nội, tphcm.
- Vật phẩm / giải hạn: giải hạn, cúng sao, dâng sao, bùa, yểm, trấn, vòng tay, đá, tỳ hưu, vật phẩm, sim, số điện thoại, biển số.
- May rủi: lô, đề, xổ số, xsmb, số đẹp, giải mã giấc mơ, đánh con gì.
- Nhạy cảm: chết, tự tử, năm mất, tuổi thọ, bệnh, ung thư, có thai, sinh con trai, giới tính thai nhi.
- Khác: phim, truyện, game, hình nền, avatar, tattoo, chinese, numerology, english; tên đối thủ (không mua tên đối thủ).
- **Không** phủ định "miễn phí" (công cụ thật sự miễn phí — đo 2 tuần rồi quyết).

## 8. Quảng cáo (RSA) — ký tự đã đếm

Ghim: vị trí 1 cho 2 tiêu đề chứa từ khoá; vị trí 2–3 để tự do. Dòng "từ 59.000 ₫" **chỉ** khi gói Lần đầu đang bật;
dòng giá chỉ khi thu Sao đang bật.

### a. Tử vi → /tu-vi — đường dẫn hiển thị `tu-vi / la-so-tron-doi`
Tiêu đề: Xem Tử vi online miễn phí (25, ghim) · Lập lá số Tử vi trọn đời (24, ghim) · Tử vi theo ngày giờ sinh (24) ·
Lá số 12 cung có ngay (21) · Công việc, tiền, tình cảm (25) · Đọc 10 năm tới của bạn (22) · Lời thường, dễ hiểu (19) ·
Âm lịch Việt Nam (16) · Có nguồn sách xưa từng ý (24) · Tự chấm đúng hay chưa đúng (26) · Chương đầu đọc miễn phí (23) ·
Bản đủ từ 99.000 ₫ (18) · Bản đầy đủ 12 chương (20) · Nhập giờ sinh, xem ngay (23) · Lập lá số của bạn (17)
Mô tả:
1. Lá số 12 cung theo âm lịch Việt Nam. Lá số và chương đầu miễn phí, không cần tài khoản. (87, ghim)
2. Đọc công việc, tiền bạc, tình cảm, các chặng 10 năm bằng lời thường, có nguồn sách xưa. (87)
3. Bản đủ 12 chương mở bằng Sao, từ 99.000 ₫. Trả bằng QR ngân hàng, không tự gia hạn. (83)
4. Chưa rõ giờ sinh vẫn lập được lá số tạm, trang ghi rõ phần nào cần giờ. Tự chấm từng ý. (87)

### b. Bát tự → /bat-tu — `bat-tu / ngu-hanh`
Tiêu đề: Xem Bát tự online miễn phí (26, ghim) · Lá số Tứ trụ theo giờ sinh (26, ghim) · Mệnh bạn thiếu hành gì? (23) ·
Bát tự ngũ hành dư thiếu (24) · Hành nào nhiều, hành nào ít (27) · Đại vận 10 năm của bạn (22) · Dụng thần nêu cả hai cách (25) ·
Chấm điểm ngũ hành công khai (28) · Theo tiết khí, có nguồn sách (28) · Lời thường, không phán hung (27) ·
Tứ trụ + chương đầu miễn phí (28) · Bản đủ từ 99.000 ₫ (18) · Bản đầy đủ 12 chương (20) · Nhập ngày giờ sinh, xem ngay (28) ·
Xem tứ trụ của bạn (18)
Mô tả:
1. Lập bốn trụ theo tiết khí, chấm điểm Kim Mộc Thuỷ Hoả Thổ: biết mệnh thiếu hành gì. (83, ghim)
2. Tứ trụ, biểu đồ năm hành và chương đầu miễn phí. Không cần tài khoản để xem. (76)
3. Dụng thần nêu đủ hai cách, đại vận 10 năm, việc nên làm. Lời thường, có nguồn sách. (83)
4. Bản đủ 12 chương từ 99.000 ₫, trả bằng QR ngân hàng. Đọc chương đầu trước rồi mới chọn. (87)

### c. Thần số → /than-so — `than-so / ban-do-con-so`
Tiêu đề: Thần số học theo ngày sinh (26, ghim) · Tra cứu thần số học online (26, ghim) · Thần số học theo tên (20) ·
Bạn là số mấy? (14) · Biết điểm mạnh, điểm mù (23) · Năm nay nên dồn sức vào đâu (27) · Hợp nghề gì theo con số (23) ·
Cách tính từng bước, tự kiểm (28) · Pitago, có nguồn rõ ràng (24) · Đúng hay sai, bạn tự chấm (25) · Xem 4 số chính miễn phí (23) ·
Bản đủ từ 59.000 ₫ (18, chỉ khi gói Lần đầu bật; không thì "Bản đủ từ 99.000 ₫") · Bản đồ con số 4 chương (22) ·
Nhập tên, xem trong 30 giây (27) · Xem con số của bạn (18)
Mô tả:
1. Nhập họ tên và ngày sinh: số chủ đạo, sứ mệnh, linh hồn, nhân cách. Miễn phí, 30 giây. (86, ghim)
2. Mỗi con số kèm cách tính từng bước để bạn tự kiểm. Không cần tài khoản. (71)
3. Bản đồ con số 4 chương: nghịch lý bên trong, 12 tháng tới, sự nghiệp và tiền bạc. (81)
4. Chương tổng quan miễn phí. Bản đủ mở bằng Sao, trả QR ngân hàng, không tự gia hạn. (82)

### d. Năm 2027 → /thoi-gian-toi?nam=2027 — `nam-2027 / 12-thang-toi`
(Chọn trang này thay /nam/2027: là trang bán thật, chỉ cần tên + ngày sinh, 3 tháng tới miễn phí.)
Tiêu đề: Tử vi 2027 theo ngày sinh (25, ghim) · Tử vi năm Đinh Mùi 2027 (23, ghim) · Xem năm 2027 của riêng bạn (26) ·
12 tháng tới của bạn (20) · Tháng nào hợp bắt đầu việc (26) · Sao hạn, Tam tai theo tuổi (26) · Không cần giờ sinh vẫn xem (26) ·
Ghép Thần số, Tử vi, Bát tự (27) · Nhịp gợi ý, không phán hung (27) · Có nguồn sách, lời thường (25) ·
3 tháng tới đọc miễn phí (24) · Bản đủ từ 99.000 ₫ (18) · Bản năm 2027 đầy đủ (19) · Nhập ngày sinh, xem ngay (24) ·
Xem năm 2027 của bạn (20)
Mô tả:
1. Ba tháng tới và tóm tắt năm 2027 miễn phí. Chỉ cần tên và ngày sinh để bắt đầu. (79, ghim)
2. Thần số, Tử vi, Bát tự cùng đọc: tháng nào thuận để bắt đầu, tháng nào nên đi chậm. (83)
3. Sao hạn, Tam tai, Kim lâu theo tuổi nói bằng lời thường, kèm việc cụ thể nên làm. (81)
4. Bản đủ 12 tháng + năm 2027 từ 99.000 ₫, trả bằng QR ngân hàng. Không tự gia hạn. (80)

### e. Xông đất → /tuoi-xong-dat/2027 — `xong-dat / 2027` (trang miễn phí, không dòng giá)
Tiêu đề: Xem tuổi xông đất 2027 (22, ghim) · Tuổi xông đất Tết Đinh Mùi (26, ghim) · Tuổi xông nhà 2027 hợp ai (25) ·
Chọn người xông đất đầu năm (27) · Tra theo năm sinh gia chủ (25) · Kèm lý do từng tuổi hợp (23) · Giờ hoàng đạo mùng 1 Tết (24) ·
Theo âm lịch Việt Nam (21) · Bảng 46 tuổi 1960–2005 (22) · Tập quán, nói rõ nguồn gốc (26) · Tra cứu miễn phí (16) ·
Không cần đăng ký (17) · Không bán vật phẩm (18) · Tra tuổi xông đất ngay (22) · Xem bảng tuổi hợp (17)
Mô tả:
1. Tra tuổi xông đất Tết 2027 theo năm sinh gia chủ: tuổi hợp và lý do. Miễn phí. (78)
2. Xét tam hợp, lục hợp, can, nạp âm; bỏ tuổi xung năm, xung chủ, Tam tai. Kèm giờ đẹp. (84)
3. Bảng 46 tuổi 1960–2005, tra một chạm. Không cần tài khoản, không bán vật phẩm. (78)
4. Xem thêm ngày tốt, tuổi làm nhà, sao hạn 2027 theo tuổi trên cùng trang. (72)

## 9. Tiện ích (assets)

**Sitelinks**
| Tên | Link | Dòng 1 | Dòng 2 |
|---|---|---|---|
| Bảng giá các gói xem | /goi-xem | Từ 99.000 ₫ một lần xem | Chương đầu luôn đọc miễn phí |
| Xem Tử vi trọn đời | /tu-vi | Lá số 12 cung, âm lịch Việt Nam | Công việc, tiền, tình cảm, 10 năm |
| Bát tự: mệnh thiếu gì | /bat-tu | Tứ trụ theo tiết khí, giờ sinh | Chấm điểm năm hành công khai |
| Thần số học của bạn | /than-so | Số chủ đạo, sứ mệnh, linh hồn | Có cách tính từng bước để tự kiểm |
| Năm 2027 của riêng bạn | /thoi-gian-toi?nam=2027 | 3 tháng tới và tóm tắt năm miễn phí | Tháng nào thuận, tháng nào đi chậm |
| Tuổi xông đất Tết 2027 | /tuoi-xong-dat/2027 | Bảng 46 tuổi theo năm sinh | Kèm lý do và giờ hoàng đạo |

**Callouts**: Phép tính miễn phí · Chương đầu đọc miễn phí · Âm lịch Việt Nam · Có nguồn sách xưa · Lời thường, dễ hiểu ·
Không bán vật phẩm · Trả bằng QR ngân hàng · Không tự gia hạn.

**Structured snippets** — Dịch vụ: Tử vi, Bát tự, Thần số học, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot, Lịch âm.

**Price assets** (chỉ khi thu Sao bật; giá phải khớp /goi-xem): Một lần xem 99.000 ₫ · Hai lần xem 199.000 ₫ ·
Ba lần xem 249.000 ₫ (≈ 83.000 ₫ mỗi lần) · Cả nhà 499.000 ₫ · Hội viên năm 599.000 ₫ · Lần đầu nạp 59.000 ₫ (chỉ khi gói bật).

**Hình ảnh** (không chữ chèn lên ảnh): lá số 12 cung · năm cột ngũ hành + la bàn mờ · vòng số 1–9 · dải 12 tháng 2027 chấm
lục/vàng/hổ phách (không đỏ) · tay cầm điện thoại mở lá số · bàn trà Tết có bánh chưng, cành mai.

## 10. Đã quyết (23/11/2026) — code đã làm

1. Cookie quảng cáo đo lường (`ad_storage`, `ad_user_data`) bật theo lựa chọn cookie như GA4. **Quảng cáo cá nhân hoá (tiếp thị
   lại) TẮT** — không cần cho tối ưu giá thầu; bật bằng `NEXT_PUBLIC_QC_CA_NHAN_HOA=1` ở giai đoạn 3 nếu Google cho dùng danh sách.
2. Migration 0041 `google_don` lưu gclid / gbraid / wbraid cùng đơn (95 ngày); tệp chuyển đổi offline `/api/qc/google-offline`.
3. Email tài khoản **băm SHA-256** gửi Meta (API chuyển đổi) và Google (cột Email của tệp offline) — không email gốc, bỏ email đại
   diện Zalo, chỉ khi người dùng chưa tắt cookie đo lường; tắt bằng `META_CAPI_EMAIL=0` / `GOOGLE_OFFLINE_EMAIL=0`.
4. `dataLayer` (`hbt_lead`, `hbt_xem`, `hbt_mo_khoa`, `hbt_thanh_toan`, `hbt_da_mo`, `purchase`, `hbt_nap`), `qc=google` cho PostHog,
   tiêu đề theo `?kw=`, dòng giá màn đầu, nút từ trang xông đất sang `/thoi-gian-toi`, Chính sách riêng tư (hiệu lực 23/11/2026).

Việc anh làm trong Google Ads / GTM / Vercel: `docs/VIEC-CUA-ANH.md` mục **QC-G**.

## 11. (cũ) Câu hỏi đã gửi anh

1. G0-1: bật `ad_storage` + `ad_user_data` mặc định (giống GA4), `ad_personalization` giữ tắt.
2. G0-4: migration lưu gclid cùng đơn nạp để gửi Purchase từ máy chủ.
3. Có gửi email đã băm cho Google (Enhanced Conversions) không — mặc định **không**, như Meta.
4. Duyệt em làm G0-2 → G0-8 (sửa code, test, PR, merge như CRO-1).

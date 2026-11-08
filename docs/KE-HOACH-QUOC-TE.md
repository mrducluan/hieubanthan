# Kế hoạch mở rộng quốc tế (QTE-1)

> Chốt qua phiên `/grill-me` ngày 2026-11-07. Chủ dự án duyệt toàn bộ, sau đó đổi ba điểm:
> lịch tính theo **tuần** (làm bằng AI code nên nhanh hơn), hỏi **cần mấy bản ngôn ngữ**,
> **bật thu tiền từ tháng thứ 3**.
> Mỗi giai đoạn khi bắt đầu code vẫn được duyệt riêng; tài liệu này chưa đụng code.

## 0. Một điều cần nói thật trước

AI code rút ngắn được phần **dựng**. Nó không rút ngắn được ba thứ:

| Việc | Thời gian thật | Vì sao |
|---|---|---|
| Google lập chỉ mục trang mới | vài tuần → vài tháng | Site đang có ~860 URL "đã phát hiện, chưa lập chỉ mục" (`docs/AUDIT-INDEX-2026-11.md`); thêm trang tiếng Anh sẽ chia thêm suất thu thập |
| Người bản xứ duyệt nội dung | theo sức người duyệt | Trang chưa duyệt vẫn hiện, ghi "editorial team" (EEAT-1) |
| Cổng thanh toán duyệt hồ sơ, luật sư | 1–4 tuần | Phải nộp ngay tuần 1 |

Vì vậy lịch dưới đây **dựng nhanh theo tuần**, nhưng **mốc đánh giá thành công vẫn ở tháng 6**.

## 1. Mục tiêu và cách đo

- Vòng tăng trưởng: đẩy **THU HÚT** trước (tuần 1–8). Sau đó bật **NẠP** từ tháng 3. **MỜI** (thẻ chia sẻ có QR) dịch ngay từ đầu vì rẻ. **QUAY LẠI** (Hôm nay, nhắc việc) đi theo.
- Chỉ số, tách theo nước và ngôn ngữ:
  - Hiển thị và nhấp trên Search Console.
  - `landing_viewed` → `reading_started` → `reading_completed`.
  - Từ tháng 3: `checkout_started`, `unlock_succeeded`.
- **Mốc tháng 6** cho mỗi thị trường thử nghiệm:
  - ≥ 1.000 lượt vào trang tự nhiên mỗi tuần.
  - Tỉ lệ `reading_started` không kém Việt Nam.
  - Có đơn nạp đầu tiên.
  - Không đạt thì dừng hoặc đổi hướng, chưa mở thêm ngôn ngữ.
- Ngân sách: 300–500 USD/tháng, chủ yếu thuê người bản xứ duyệt nội dung. Đi bằng SEO/GEO là chính; quảng cáo chỉ thử nhỏ.

## 2. Cần mấy bản ngôn ngữ

**Trả lời: 3 bản trong 6 tháng đầu, tối đa 5 bản sau 12 tháng.**

| # | Ngôn ngữ | Phục vụ ai | Khi nào | Vì sao |
|---|---|---|---|---|
| 1 | Tiếng Việt (đang có) | Việt Nam + **người Việt ở nước ngoài** (Mỹ ~2,35 triệu, Nhật ~681 nghìn, Pháp ~400 nghìn, Úc ~335 nghìn, Hàn ~300 nghìn, Canada ~275 nghìn, Đài Loan, Đức) | Tuần 1–2 | Không cần dịch, chỉ sửa giờ sinh nước ngoài + thu tiền quốc tế |
| 2 | Tiếng Anh `/en/` | Mỹ, Anh, Úc, Canada, Singapore, Malaysia | Tuần 3–8 | Các công cụ Bát tự, Tử vi, kua number, Kinh Dịch có vẻ ít đối thủ; app lớn (Nebula, Co–Star) không làm loại này |
| 3 | Tiếng Hoa phồn thể `/zh-hant/` | Đài Loan, Hồng Kông, người Hoa ở Singapore và Malaysia | Tháng 3–4, **chỉ khi tiếng Anh có số tốt ở tuần 8** | Tử vi khởi nguồn từ đây, người dùng sẵn lòng trả tiền (click108). Đối thủ nội địa mạnh nên vào sau tiếng Anh. *Đổi so với Q15 ("để 12 tháng"): lý do mới là AI code làm khung đa ngôn ngữ dùng lại được, chi phí thêm ngôn ngữ thứ 3 thấp.* |
| 4 | Tiếng Hàn | Saju (~1 tỉ USD) | Xét ở tháng 6 | Đối thủ mạnh (점신, 포스텔러), người dùng quen thanh toán nội địa |
| 5 | Tiếng Nhật | Uranai (~650 triệu USD) | Xét ở tháng 6 | Kênh phân phối nằm trong LINE, dịch đắt |

**Không làm:**
- Tiếng Trung giản thể: Trung Quốc đại lục cấm thu phí xem bói online, cần giấy phép ICP.
- Ấn Độ: chiêm tinh Vedic + gọi chuyên gia tính phút, không hợp thế mạnh.
- Tiếng Pháp, Đức: người Việt ở đó đọc bản tiếng Việt; EU kéo theo GDPR đầy đủ.

## 3. Sản phẩm theo ngôn ngữ

| Mảng | Tiếng Việt | Tiếng Anh | Phồn thể |
|---|---|---|---|
| Bát tự | có | tuần 3–4 | tháng 3–4 |
| Tử vi | có | tuần 5 | tháng 3–4 |
| Phong thuỷ (kua, phi tinh) | có | tuần 6 | tháng 4 |
| Kinh Dịch | có | tuần 7 | tháng 4 |
| Thần số học, Tarot | có | **không** (thị trường đã chật) | không |
| Nhân tướng | có | sau (ảnh khuôn mặt = dữ liệu sinh trắc) | sau |
| Hỏi đáp | có | **không** ở giai đoạn này (cần bộ luật nhận diện riêng) | không |
| Chiêm tinh phương Tây | không làm trong 12 tháng | | |

Mỗi mảng tiếng Anh gồm: công cụ lập lá số, trang kiến thức, bài đọc đời sống (chương 1 miễn phí), thẻ chia sẻ có QR.

## 4. Lịch theo tuần

| Tuần | Việc em làm (code) | Việc của anh |
|---|---|---|
| **1** | Giai đoạn 0 · người Việt ở nước ngoài: (a) form hồ sơ chọn **nước + thành phố**, máy tự tính múi giờ + giờ mùa hè theo ngày sinh (zoneinfo của Python + Intl của trình duyệt, không thư viện mới; golden test trước); (c) Hôm nay + nhắc việc theo múi giờ nơi đang sống | Nối Search Console + GA4 hieuban.com vào NotFair (hoặc gửi CSV quốc gia). Mở `trends.google.com` hoặc nối Keyword Planner. **Nộp hồ sơ cổng thanh toán** (mục 6). Tìm người duyệt bản xứ |
| **2** | (b) Trang SEO tiếng Việt theo nước: Mỹ, Nhật, Úc, Canada (giờ giao thừa, ngày Tết theo giờ địa phương, tuổi xông đất). **Kiểm mốc từ khoá**: nhóm bazi / zi wei / kua / i ching ≥ 20.000 lượt/tháng ở 6 nước nói tiếng Anh, dưới mốc thì dừng tiếng Anh, hỏi lại anh | Gửi bản pháp lý cho luật sư |
| **3–4** | Khung đa ngôn ngữ tự làm: nhóm route `/en/…` với slug tiếng Anh, bảng chữ `lib/chu` có bản `en`, hreflang, sitemap `/en`, `lang` theo trang. Engine thêm tham số `ngon_ngu`, đọc `*_en.json`, bộ lọc BM-1 + `cum_cam` tiếng Anh có test (không đổi phép tính, không tăng `ENGINE_VERSION`). **Bát tự tiếng Anh** (BaZi calculator + trang kiến thức). Chính sách riêng tư + Điều khoản tiếng Anh. Mặc định lịch Trung Quốc ở `/en` | Người duyệt bản xứ đọc các trang Bát tự đầu tiên |
| **5** | Tử vi tiếng Anh (Zi Wei Dou Shu chart) | |
| **6** | Phong thuỷ tiếng Anh (kua number, flying stars) | |
| **6–8** | **Thanh toán quốc tế**: migration loại đơn + tiền tệ (có `.down.sql`), giá USD theo gói, gọi REST cổng thanh toán bằng `fetch` (không SDK), webhook chỉ tin chữ ký, thử sandbox | Ký hợp đồng cổng thanh toán, chạy migration |
| **7** | Kinh Dịch tiếng Anh | |
| **8** | Đo lại: số lập chỉ mục, hiển thị, `reading_started` theo ngôn ngữ. Quyết có làm phồn thể không | Duyệt kết quả đo |
| **9–12 (tháng 3)** | **Bật thu tiền** cho người Việt ở nước ngoài + bản tiếng Anh (công tắc `/quan-tri/cai-dat`, mặc định tắt). Nếu tuần 8 đạt: dựng `/zh-hant/` Bát tự + Tử vi | Bật công tắc khi luật sư đã xem |
| **Tháng 4–6** | Phồn thể phong thuỷ + Kinh Dịch; tối ưu theo số | |
| **Tháng 6** | **Mốc đánh giá** (mục 1). Quyết tiếng Hàn / Nhật, hỏi đáp tiếng Anh, nhân tướng tiếng Anh | |

Mỗi mảng đưa lên ngay khi xong, không chờ 4–6 tuần như bản trước. Bù lại, số đo ở tuần 8 và tháng 6 đọc **theo từng mảng**.

## 5. Kỹ thuật (đã chốt)

- **Tên miền:** thư mục con `hieuban.com/en/…`, `hieuban.com/zh-hant/…`, thẻ hreflang. Thương hiệu quốc tế là "Hieuban".
- **Đa ngôn ngữ trên web:** tự làm, **không thêm `next-intl`**. Chỉ áp cho các trang được dịch, không sửa ~385 tệp tiếng Việt.
- **Kho tri thức:** dịch máy **chỉ phần cần cho 4 mảng** vào tệp song song `*_en.json` (git là nguồn), giữ `source_id` + `school_id`, gắn nhãn nháp, người bản xứ duyệt dần theo số Search Console. LLM chỉ diễn đạt từ kho đã dịch; **không** để LLM tự dịch lúc trả lời.
- **Lịch:** `/en` và `/zh-hant` mặc định lịch Trung Quốc (`lich: "trung"`), bản tiếng Việt giữ lịch Việt Nam. Người dùng đổi được ở "Trường phái".
- **Hạ tầng:** giữ Singapore. Chỉ xét đặt máy chủ thêm vùng khi người dùng ngoài châu Á vượt 30 % lượt truy cập.

## 6. Thu tiền từ tháng 3

- **Đổi so với quyết định ban đầu** (6 tháng chưa thu): chủ dự án muốn bật thu tiền từ tháng 3.
- Sao vẫn giữ quy tắc cũ: không đổi ra tiền, không chuyển nhượng, không tự gia hạn.
- **Tuần 1 phải kiểm** (agent nghiên cứu chỉ có nguồn thứ cấp):
  - Stripe theo các nguồn đó không mở cho doanh nghiệp Việt Nam.
  - Paddle / Lemon Squeezy: có nhận người bán Việt Nam không, có xếp "bói toán / chiêm tinh" vào ngành bị cấm không.
  - Phương án dự phòng, theo thứ tự: một dịch vụ bán hộ khác (Polar, Dodo) → PayPal → lập pháp nhân ở Singapore để dùng Stripe.
- Giá theo USD (bản nháp có sẵn ở `docs/KE-HOACH-THANH-TOAN.md`: 4,99 / 9,99 USD). Giá chốt ở tuần 6.
- Người dùng Hàn, Nhật quen thanh toán nội địa, nên thẻ quốc tế sẽ chuyển đổi thấp. Đây là một lý do để hai thị trường này đi sau.

## 7. Pháp lý

- Bản tiếng Anh nhắm Mỹ, Anh, Úc, Canada, Singapore, Malaysia. Không chủ động nhắm EU.
- Có Chính sách riêng tư + Điều khoản tiếng Anh theo chuẩn GDPR cơ bản, vì người EU vẫn vào được trang.
- **Tắt** tính năng ảnh khuôn mặt ở bản tiếng Anh và phồn thể.
- Lời trên trang và quảng cáo không dùng "accurate / guaranteed".
  - Anh: ASA và DMCC 2024.
  - Mỹ: FTC đang để ý gói thuê bao tự gia hạn của app xem bói.
- Google Ads không cấm hẳn quảng cáo xem bói, nhưng tránh hứa kết quả, sức khoẻ, tiền bạc. LinkedIn cấm. Chính sách của Meta chưa kiểm.
- Luật sư xem bản tiếng Anh **trước tuần 9**.

## 8. Người đứng tên nội dung (E-E-A-T)

- Đức Luân là Chủ biên, có hồ sơ tiếng Anh.
- Người bản xứ am hiểu Bát tự / phong thuỷ đứng tên "Editor / Reviewer", chỉ ở những trang người đó đã duyệt.
- Trang chưa duyệt ghi "Hieuban editorial team".

## 9. Việc của chủ dự án (chép sang `docs/VIEC-CUA-ANH.md` mục 4af)

1. Nối Search Console + GA4 của hieuban.com vào NotFair, hoặc gửi CSV quốc gia của 3 tháng gần nhất.
2. Cho phép `trends.google.com` trong cài đặt mạng của môi trường, hoặc nối Google Ads Keyword Planner vào NotFair.
3. Tuần 1: nộp hồ sơ cổng thanh toán quốc tế (mục 6).
4. Tìm 1 người bản xứ nói tiếng Anh am hiểu Bát tự / phong thuỷ để duyệt nội dung (từ ngân sách 300–500 USD/tháng).
5. Luật sư xem Chính sách riêng tư + Điều khoản tiếng Anh trước tuần 9.

## 10. Nguồn số liệu

Nghiên cứu ngày 2026-11-07, chưa có số lượt tìm kiếm đã kiểm chứng cho từ khoá ngách. Mốc tuần 2 sẽ kiểm lại.

- Quy mô thị trường: MarkNtel, TBRC, Ken Research.
- Đối thủ: Statista/AppMagic (Nebula, Co–Star); Outlook Business, Inc42 (Astrotalk); Seoulz, Asiae (saju Hàn); Yano Research (Nhật 99,7 tỉ ¥); Bnext (click108).
- Người Việt ở nước ngoài: Pew, ABS 2021, Bộ Tư pháp Nhật 12/2025.
- Pháp lý: ASA, Apple 4.3(b), chính sách Google Ads.
